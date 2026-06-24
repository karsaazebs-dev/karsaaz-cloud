<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Service;

use OCP\ICache;
use OCP\ICacheFactory;

/**
 * Optional external ERP database adapter.
 *
 * When a tenant has configured external DB credentials, new chat messages are
 * written to the ERP's `karsaaz_chat_messages` table in addition to NC Talk's
 * own persistence. If the external DB is unreachable, the message payload is
 * buffered in Redis (via NC distributed cache) and flushed by ExternalDbFlushJob.
 *
 * This service only INSERTs — it never SELECTs, UPDATEs, or DELETEs in the
 * external DB.
 */
class ExternalDbService {
    /** Lazy PDO connections keyed by tenant_id */
    private array $connections = [];

    private readonly ICache $cache;

    public function __construct(
        private readonly TenantService $tenants,
        ICacheFactory                  $cacheFactory,
    ) {
        // Use distributed cache (Redis) if available, otherwise in-memory
        $this->cache = $cacheFactory->createDistributed('kerp_ext_db');
    }

    /**
     * Write a chat message to the external ERP database.
     * Buffers in Redis on failure.
     *
     * @param string $tenantId
     * @param array  $messageData  Keys: room_token, sender_erp_user_id, message_text, sent_at
     */
    public function persistMessage(string $tenantId, array $messageData): void {
        $pdo = $this->getConnection($tenantId);
        if ($pdo === null) {
            return; // external DB not configured for this tenant
        }

        try {
            $this->insertMessage($pdo, $tenantId, $messageData);
        } catch (\Exception $e) {
            // Buffer for later retry
            $this->bufferMessage($tenantId, $messageData);
        }
    }

    /**
     * Test the external DB connection for a tenant.
     *
     * @return array{ok:bool, latency_ms:int, error:string|null}
     */
    public function testConnection(string $tenantId): array {
        $start = (int)(microtime(true) * 1000);
        try {
            $pdo = $this->connect($tenantId);
            if ($pdo === null) {
                return ['ok' => false, 'latency_ms' => 0, 'error' => 'No external DB configured'];
            }
            $pdo->query('SELECT 1');
            $ms = (int)(microtime(true) * 1000) - $start;
            return ['ok' => true, 'latency_ms' => $ms, 'error' => null];
        } catch (\Exception $e) {
            $ms = (int)(microtime(true) * 1000) - $start;
            return ['ok' => false, 'latency_ms' => $ms, 'error' => $e->getMessage()];
        }
    }

    /**
     * Flush buffered messages for a tenant into the external DB.
     * Called by ExternalDbFlushJob.
     *
     * @return int Number of messages flushed
     */
    public function flushBuffer(string $tenantId): int {
        $pdo = $this->getConnection($tenantId);
        if ($pdo === null) {
            return 0;
        }

        $bufferKey = $this->bufferKey($tenantId);
        $pending   = $this->cache->get($bufferKey) ?? [];
        if (empty($pending)) {
            return 0;
        }

        $flushed = 0;
        $remaining = [];
        foreach ($pending as $item) {
            try {
                $this->insertMessage($pdo, $tenantId, $item);
                $flushed++;
            } catch (\Exception $e) {
                $remaining[] = $item;
            }
        }

        if (empty($remaining)) {
            $this->cache->remove($bufferKey);
        } else {
            $this->cache->set($bufferKey, $remaining, 86400 * 7);
        }

        return $flushed;
    }

    /** Return all tenant IDs that have a buffered message queue. */
    public function getTenantIdsWithBuffer(): array {
        // NC's ICache doesn't support key listing, so we query the tenant table
        // and check each for a non-empty buffer.
        // In practice this list is short; Redis scan would be overkill here.
        $tenantList = $this->tenants->listAll();
        return array_values(array_filter(
            array_column($tenantList, 'tenant_id'),
            fn (string $tid) => !empty($this->cache->get($this->bufferKey($tid)))
        ));
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function getConnection(string $tenantId): ?\PDO {
        if (array_key_exists($tenantId, $this->connections)) {
            return $this->connections[$tenantId];
        }
        $this->connections[$tenantId] = $this->connect($tenantId);
        return $this->connections[$tenantId];
    }

    private function connect(string $tenantId): ?\PDO {
        $creds = $this->tenants->getExternalDbCredentials($tenantId);
        if ($creds === null) {
            return null;
        }

        $pdo = new \PDO(
            $creds['dsn'],
            $creds['user'],
            $creds['pass'],
            [
                \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_TIMEOUT            => 5,
            ]
        );

        return $pdo;
    }

    private function insertMessage(\PDO $pdo, string $tenantId, array $data): void {
        $stmt = $pdo->prepare(
            'INSERT INTO karsaaz_chat_messages
             (id, tenant_id, room_token, sender_erp_user_id, message_text, sent_at)
             VALUES (:id, :tenant_id, :room_token, :sender_erp_user_id, :message_text, :sent_at)'
        );
        $stmt->execute([
            ':id'                 => $this->uuid4(),
            ':tenant_id'          => $tenantId,
            ':room_token'         => (string)($data['room_token'] ?? ''),
            ':sender_erp_user_id' => (string)($data['sender_erp_user_id'] ?? ''),
            ':message_text'       => (string)($data['message_text'] ?? $data['message'] ?? ''),
            ':sent_at'            => (string)($data['sent_at'] ?? gmdate('c')),
        ]);
    }

    private function bufferMessage(string $tenantId, array $messageData): void {
        $key     = $this->bufferKey($tenantId);
        $current = $this->cache->get($key) ?? [];
        $current[] = $messageData;
        $this->cache->set($key, $current, 86400 * 7); // keep for 7 days
    }

    private function bufferKey(string $tenantId): string {
        return 'pending:' . $tenantId;
    }

    private function uuid4(): string {
        $data    = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
