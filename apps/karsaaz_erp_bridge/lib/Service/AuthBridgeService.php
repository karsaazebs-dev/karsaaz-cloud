<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Service;

use OCP\IDBConnection;
use OCP\IGroupManager;
use OCP\IUserManager;
use OCP\Security\ISecureRandom;

/**
 * Validates ERP JWTs, auto-provisions NC users, and issues NC session credentials
 * for use by the embedded chat view.
 */
class AuthBridgeService {
    private const TABLE_USER_MAP  = 'kerp_user_map';
    private const ERP_GROUP       = 'erp_tenants';
    // Clock skew tolerance in seconds
    private const CLOCK_SKEW_SEC  = 30;
    // NC username prefix
    private const NC_UID_PREFIX   = 'erp_';
    // Session password TTL (seconds) — long enough for a normal chat session
    private const SESSION_TTL     = 3600;
    // Device-name label for the app tokens this bridge issues (used for pruning)
    private const EMBED_TOKEN_NAME = 'Karsaaz ERP Embed';

    public function __construct(
        private readonly IDBConnection  $db,
        private readonly IUserManager   $users,
        private readonly IGroupManager  $groups,
        private readonly ISecureRandom  $rand,
    ) {
    }

    /**
     * Validate an ERP JWT (HS256) and return the NC credentials for the embedded chat.
     *
     * @param array  $tenant     Row from kerp_tenants (already decrypted by TenantService)
     * @param string $erpJwt     Raw JWT string from ERP
     * @return array{nc_username:string, nc_password:string, nc_base_url:string, expires_in:int}
     * @throws \InvalidArgumentException on JWT validation failure
     */
    public function exchangeToken(array $tenant, string $erpJwt, string $ncBaseUrl): array {
        $claims = $this->validateJwt($erpJwt, $tenant['erp_jwt_secret']);

        if (isset($claims['active']) && $claims['active'] === false) {
            throw new \InvalidArgumentException('erp_user_inactive');
        }

        $ncUid    = $this->resolveOrProvisionUser($tenant, $claims);
        $password = $this->setSessionPassword($ncUid);

        return [
            'nc_username' => $ncUid,
            'nc_password' => $password,
            'nc_base_url' => $ncBaseUrl,
            'expires_in'  => self::SESSION_TTL,
        ];
    }

    /**
     * Decode and validate an HS256 JWT. Returns the payload claims.
     *
     * @throws \InvalidArgumentException on any validation failure
     */
    public function validateJwt(string $jwt, string $secret): array {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new \InvalidArgumentException('invalid_jwt_format');
        }

        [$headerB64, $payloadB64, $sigB64] = $parts;

        // Verify header
        $header = json_decode($this->base64UrlDecode($headerB64), true);
        if (!is_array($header) || ($header['alg'] ?? '') !== 'HS256') {
            throw new \InvalidArgumentException('unsupported_algorithm');
        }

        // Verify signature
        $expected = $this->base64UrlEncode(hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true));
        // Constant-time comparison
        if (!hash_equals($expected, $sigB64)) {
            throw new \InvalidArgumentException('invalid_signature');
        }

        // Decode payload
        $payload = json_decode($this->base64UrlDecode($payloadB64), true);
        if (!is_array($payload)) {
            throw new \InvalidArgumentException('invalid_payload');
        }

        // Validate expiry
        $exp = (int)($payload['exp'] ?? 0);
        if ($exp === 0 || $exp + self::CLOCK_SKEW_SEC < time()) {
            throw new \InvalidArgumentException('token_expired');
        }

        // Required claims
        foreach (['sub', 'name'] as $claim) {
            if (empty($payload[$claim])) {
                throw new \InvalidArgumentException("missing_claim:$claim");
            }
        }

        return $payload;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function resolveOrProvisionUser(array $tenant, array $claims): string {
        $erpUserId = (string)$claims['sub'];
        $tenantId  = $tenant['tenant_id'];

        // Check existing mapping
        $qb = $this->db->getQueryBuilder();
        $qb->select('nc_uid')
           ->from(self::TABLE_USER_MAP)
           ->where($qb->expr()->andX(
               $qb->expr()->eq('tenant_id',   $qb->createNamedParameter($tenantId)),
               $qb->expr()->eq('erp_user_id', $qb->createNamedParameter($erpUserId)),
           ));
        $result = $qb->executeQuery();
        $row    = $result->fetch();
        $result->closeCursor();

        if ($row !== false) {
            return $row['nc_uid'];
        }

        // Provision new NC user
        $ncUid = $this->buildNcUid($tenantId, $erpUserId);
        $this->createNcUser($ncUid, $claims, $tenant);

        // Store mapping — use a single QueryBuilder instance so all createNamedParameter
        // calls bind to the same parameter map that executeStatement() will use.
        $iqb = $this->db->getQueryBuilder();
        $iqb->insert(self::TABLE_USER_MAP)
            ->values([
                'tenant_id'   => $iqb->createNamedParameter($tenantId),
                'erp_user_id' => $iqb->createNamedParameter($erpUserId),
                'nc_uid'      => $iqb->createNamedParameter($ncUid),
                'created_at'  => $iqb->createNamedParameter(time()),
            ])
            ->executeStatement();

        return $ncUid;
    }

    private function buildNcUid(string $tenantId, string $erpUserId): string {
        $prefix    = self::NC_UID_PREFIX . substr(str_replace('-', '', $tenantId), 0, 8) . '_';
        $userSlug  = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '_', $erpUserId) ?? $erpUserId);
        $userSlug  = substr($userSlug, 0, 64 - strlen($prefix));
        return $prefix . $userSlug;
    }

    private function createNcUser(string $ncUid, array $claims, array $tenant): void {
        if ($this->users->userExists($ncUid)) {
            return;
        }

        $initialPass = $this->rand->generate(32, ISecureRandom::CHAR_ALPHANUMERIC);
        $user = $this->users->createUser($ncUid, $initialPass);
        if ($user === false) {
            throw new \RuntimeException("Failed to create NC user: $ncUid");
        }

        // Set display name and email
        $user->setDisplayName((string)($claims['name'] ?? $ncUid));
        if (!empty($claims['email'])) {
            $user->setEMailAddress((string)$claims['email']);
        }

        // Add to ERP group (create if needed)
        if (!$this->groups->groupExists(self::ERP_GROUP)) {
            $this->groups->createGroup(self::ERP_GROUP);
        }
        $group = $this->groups->get(self::ERP_GROUP);
        $group?->addUser($user);
    }

    /**
     * Issue a dedicated app token (device password) for the NC user and return it.
     *
     * IMPORTANT: this intentionally does NOT reset the account password. Resetting
     * it (the old behaviour) invalidated every previously-issued credential, so a
     * second embed / a second browser tab / any re-auth clobbered the first —
     * surfacing as a WebDAV 401 (Basic-auth prompt) in the embedded Cloud view.
     * App tokens coexist independently, so concurrent embeds never clobber each
     * other. The token authenticates Basic-auth on OCS and WebDAV just like a
     * password. Stale ERP-embed tokens (inactive beyond the TTL) are pruned
     * best-effort to avoid unbounded growth, without touching active ones.
     */
    private function setSessionPassword(string $ncUid): string {
        $user = $this->users->get($ncUid);
        if ($user === null) {
            throw new \RuntimeException("NC user not found: $ncUid");
        }

        /** @var \OC\Authentication\Token\IProvider $tokenProvider */
        $tokenProvider = \OCP\Server::get(\OC\Authentication\Token\IProvider::class);

        // Prune this user's stale ERP-embed tokens (best-effort; never fatal).
        // getLastCheck() is the last time the token was validated — a good
        // staleness proxy that (unlike getLastActivity) is on the public IToken.
        try {
            $cutoff = time() - self::SESSION_TTL;
            foreach ($tokenProvider->getTokenByUser($ncUid) as $existing) {
                if ($existing->getName() === self::EMBED_TOKEN_NAME
                    && $existing->getLastCheck() < $cutoff) {
                    $tokenProvider->invalidateTokenById($ncUid, $existing->getId());
                }
            }
        } catch (\Throwable $e) {
            // ignore — pruning is housekeeping only
        }

        $password = $this->rand->generate(72, ISecureRandom::CHAR_HUMAN_READABLE);
        $tokenProvider->generateToken(
            $password,
            $ncUid,
            $ncUid,
            null,
            self::EMBED_TOKEN_NAME,
            \OCP\Authentication\Token\IToken::PERMANENT_TOKEN,
            \OCP\Authentication\Token\IToken::DO_NOT_REMEMBER,
        );
        return $password;
    }

    private function base64UrlDecode(string $input): string {
        return base64_decode(strtr($input, '-_', '+/'), true) ?: '';
    }

    private function base64UrlEncode(string $input): string {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }
}
