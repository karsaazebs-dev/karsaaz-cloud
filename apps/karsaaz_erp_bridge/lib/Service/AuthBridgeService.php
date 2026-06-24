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

        // Store mapping
        $this->db->getQueryBuilder()
            ->insert(self::TABLE_USER_MAP)
            ->values([
                'tenant_id'   => $this->db->getQueryBuilder()->createNamedParameter($tenantId),
                'erp_user_id' => $this->db->getQueryBuilder()->createNamedParameter($erpUserId),
                'nc_uid'      => $this->db->getQueryBuilder()->createNamedParameter($ncUid),
                'created_at'  => $this->db->getQueryBuilder()->createNamedParameter(time()),
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
     * Set a fresh random password on the NC user and return it.
     * This acts as a short-lived session credential for the embed page.
     */
    private function setSessionPassword(string $ncUid): string {
        $user = $this->users->get($ncUid);
        if ($user === null) {
            throw new \RuntimeException("NC user not found: $ncUid");
        }
        $password = $this->rand->generate(24, ISecureRandom::CHAR_ALPHANUMERIC);
        $user->setPassword($password);
        return $password;
    }

    private function base64UrlDecode(string $input): string {
        return base64_decode(strtr($input, '-_', '+/'), true) ?: '';
    }

    private function base64UrlEncode(string $input): string {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }
}
