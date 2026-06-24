<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Service;

use OCP\IDBConnection;
use OCP\Security\ICrypto;
use OCP\Security\ISecureRandom;

class TenantService {
    private const TABLE_TENANTS = 'kerp_tenants';

    public function __construct(
        private readonly IDBConnection $db,
        private readonly ISecureRandom  $rand,
        private readonly ICrypto        $crypto,
    ) {
    }

    /**
     * Register a new ERP tenant. Returns plaintext credentials (shown once).
     *
     * @return array{tenant_id:string, api_key:string, hmac_secret:string}
     */
    public function register(
        string $name,
        string $webhookUrl,
        string $erpJwtSecret,
        array  $allowedOrigins,
    ): array {
        $tenantId   = $this->uuid4();
        $apiKey     = $this->rand->generate(32, ISecureRandom::CHAR_ALPHANUMERIC);
        $hmacSecret = $this->rand->generate(32, ISecureRandom::CHAR_ALPHANUMERIC);

        $this->db->insertIfNotExist(self::TABLE_TENANTS, [
            'tenant_id'         => $tenantId,
            'name'              => $name,
            'api_key_hash'      => hash('sha256', $apiKey),
            'hmac_secret'       => $hmacSecret,
            'webhook_url'       => $webhookUrl,
            'erp_jwt_secret_enc'=> $this->crypto->encrypt($erpJwtSecret),
            'allowed_origins'   => json_encode(array_values($allowedOrigins)),
            'created_at'        => time(),
        ], ['tenant_id']);

        return ['tenant_id' => $tenantId, 'api_key' => $apiKey, 'hmac_secret' => $hmacSecret];
    }

    /** Find tenant by plaintext API key. Returns null if not found. */
    public function findByApiKey(string $apiKey): ?array {
        $hash = hash('sha256', $apiKey);
        $qb   = $this->db->getQueryBuilder();
        $qb->select('*')
           ->from(self::TABLE_TENANTS)
           ->where($qb->expr()->eq('api_key_hash', $qb->createNamedParameter($hash)));

        $result = $qb->executeQuery();
        $row    = $result->fetch();
        $result->closeCursor();

        if ($row === false) {
            return null;
        }

        $row['erp_jwt_secret'] = $this->crypto->decrypt($row['erp_jwt_secret_enc']);
        $row['allowed_origins'] = json_decode($row['allowed_origins'], true) ?? [];

        return $row;
    }

    /** Find tenant by UUID. Returns null if not found. */
    public function findById(string $tenantId): ?array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
           ->from(self::TABLE_TENANTS)
           ->where($qb->expr()->eq('tenant_id', $qb->createNamedParameter($tenantId)));

        $result = $qb->executeQuery();
        $row    = $result->fetch();
        $result->closeCursor();

        if ($row === false) {
            return null;
        }

        $row['erp_jwt_secret'] = $this->crypto->decrypt($row['erp_jwt_secret_enc']);
        $row['allowed_origins'] = json_decode($row['allowed_origins'], true) ?? [];

        return $row;
    }

    /** List all tenants (admin view — omits secrets). */
    public function listAll(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('tenant_id', 'name', 'webhook_url', 'allowed_origins', 'created_at')
           ->from(self::TABLE_TENANTS)
           ->orderBy('created_at', 'DESC');

        $result = $qb->executeQuery();
        $rows   = $result->fetchAll();
        $result->closeCursor();

        return array_map(static function (array $r): array {
            $r['allowed_origins'] = json_decode($r['allowed_origins'], true) ?? [];
            return $r;
        }, $rows);
    }

    /** Delete tenant and user map rows. NC users are kept (they may have files). */
    public function revoke(string $tenantId): void {
        $this->db->getQueryBuilder()
            ->delete('kerp_user_map')
            ->where('tenant_id = :tid')
            ->setParameter('tid', $tenantId)
            ->executeStatement();

        $this->db->getQueryBuilder()
            ->delete(self::TABLE_TENANTS)
            ->where('tenant_id = :tid')
            ->setParameter('tid', $tenantId)
            ->executeStatement();
    }

    /** Store / update external DB credentials (AES-256-GCM via NC ICrypto). */
    public function saveExternalDb(string $tenantId, string $dsn, string $user, string $pass): void {
        $qb = $this->db->getQueryBuilder();
        $qb->update(self::TABLE_TENANTS)
           ->set('ext_db_dsn_enc',  $qb->createNamedParameter($this->crypto->encrypt($dsn)))
           ->set('ext_db_user_enc', $qb->createNamedParameter($this->crypto->encrypt($user)))
           ->set('ext_db_pass_enc', $qb->createNamedParameter($this->crypto->encrypt($pass)))
           ->where($qb->expr()->eq('tenant_id', $qb->createNamedParameter($tenantId)))
           ->executeStatement();
    }

    /** Decrypt and return external DB credentials, or null if not configured. */
    public function getExternalDbCredentials(string $tenantId): ?array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('ext_db_dsn_enc', 'ext_db_user_enc', 'ext_db_pass_enc')
           ->from(self::TABLE_TENANTS)
           ->where($qb->expr()->eq('tenant_id', $qb->createNamedParameter($tenantId)));

        $result = $qb->executeQuery();
        $row    = $result->fetch();
        $result->closeCursor();

        if ($row === false || $row['ext_db_dsn_enc'] === null) {
            return null;
        }

        return [
            'dsn'  => $this->crypto->decrypt($row['ext_db_dsn_enc']),
            'user' => $this->crypto->decrypt($row['ext_db_user_enc']),
            'pass' => $this->crypto->decrypt($row['ext_db_pass_enc']),
        ];
    }

    private function uuid4(): string {
        $data    = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
