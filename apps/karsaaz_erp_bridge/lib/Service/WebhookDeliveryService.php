<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Service;

use OCP\IDBConnection;
use OCP\Http\Client\IClientService;

/**
 * Signs and delivers webhook events from Karsaaz Cloud → external ERP.
 * All payloads are HMAC-SHA256 signed with the tenant's hmac_secret.
 */
class WebhookDeliveryService {
    private const TABLE_LOG    = 'kerp_webhook_log';
    private const TIMEOUT_SEC  = 10;
    private const MAX_ATTEMPTS = 5;

    // Retry delays in seconds (exponential backoff)
    private const RETRY_DELAYS = [30, 300, 1800, 7200, 86400];

    public function __construct(
        private readonly IDBConnection  $db,
        private readonly IClientService $httpClient,
    ) {
    }

    /**
     * Deliver an event to the tenant's registered webhook URL.
     *
     * @param array  $tenant     Full tenant row (with hmac_secret, webhook_url)
     * @param string $eventType  e.g. "new_message", "user_joined", "user_left", "file_shared"
     * @param array  $data       Event-specific payload data
     * @return bool True if delivered successfully
     */
    public function deliver(array $tenant, string $eventType, array $data): bool {
        $payload = json_encode([
            'event'     => $eventType,
            'tenant_id' => $tenant['tenant_id'],
            'timestamp' => gmdate('c'),
            'data'      => $data,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $signature = $this->sign($payload, $tenant['hmac_secret']);

        $delivered = $this->post($tenant['webhook_url'], $payload, $signature);

        $this->logDelivery(
            $tenant['tenant_id'],
            $eventType,
            hash('sha256', $payload),
            $delivered ? 'delivered' : 'failed',
            1,
            $delivered ? null : $payload
        );

        return $delivered;
    }

    /**
     * Send a test ping to verify webhook connectivity.
     *
     * @return array{delivered:bool, status_code:int, latency_ms:int}
     */
    public function sendTest(array $tenant): array {
        $payload = json_encode([
            'event'     => 'ping',
            'tenant_id' => $tenant['tenant_id'],
            'timestamp' => gmdate('c'),
            'data'      => ['message' => 'Karsaaz ERP Bridge test event'],
        ]);

        $signature = $this->sign($payload, $tenant['hmac_secret']);

        $start  = (int)(microtime(true) * 1000);
        $result = $this->postWithDetails($tenant['webhook_url'], $payload, $signature);
        $ms     = (int)(microtime(true) * 1000) - $start;

        return [
            'delivered'   => $result['success'],
            'status_code' => $result['status_code'],
            'latency_ms'  => $ms,
        ];
    }

    /**
     * Retry a failed log entry. Called from WebhookRetryJob.
     *
     * @param array $logRow Row from kerp_webhook_log
     * @param array $tenant Tenant row for this log entry
     */
    public function retry(array $logRow, array $tenant): void {
        if ($logRow['attempt_count'] >= self::MAX_ATTEMPTS) {
            $this->updateLog((int)$logRow['id'], 'dead', self::MAX_ATTEMPTS);
            return;
        }

        $payload   = (string)$logRow['payload'];
        $signature = $this->sign($payload, $tenant['hmac_secret']);
        $delivered = $this->post($tenant['webhook_url'], $payload, $signature);

        $newCount  = (int)$logRow['attempt_count'] + 1;
        $newStatus = $delivered ? 'delivered' : ($newCount >= self::MAX_ATTEMPTS ? 'dead' : 'failed');

        $this->updateLog((int)$logRow['id'], $newStatus, $newCount);
    }

    // ── Delivery log helpers ──────────────────────────────────────────────────

    public function getPendingRetries(): array {
        $now = time();
        $qb  = $this->db->getQueryBuilder();
        $qb->select('*')
           ->from(self::TABLE_LOG)
           ->where($qb->expr()->eq('status', $qb->createNamedParameter('failed')))
           ->andWhere($qb->expr()->lt('attempt_count', $qb->createNamedParameter(self::MAX_ATTEMPTS)))
           ->orderBy('last_attempt_at', 'ASC')
           ->setMaxResults(100);

        $result = $qb->executeQuery();
        $rows   = $result->fetchAll();
        $result->closeCursor();

        // Filter by retry schedule
        return array_filter($rows, function (array $row) use ($now): bool {
            $attempt = (int)$row['attempt_count'];
            $delay   = self::RETRY_DELAYS[$attempt] ?? self::RETRY_DELAYS[count(self::RETRY_DELAYS) - 1];
            return ($now - (int)$row['last_attempt_at']) >= $delay;
        });
    }

    public function getLogsForTenant(string $tenantId, int $limit = 50): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('id', 'event_type', 'payload_hash', 'status', 'attempt_count', 'last_attempt_at')
           ->from(self::TABLE_LOG)
           ->where($qb->expr()->eq('tenant_id', $qb->createNamedParameter($tenantId)))
           ->orderBy('last_attempt_at', 'DESC')
           ->setMaxResults($limit);

        $result = $qb->executeQuery();
        $rows   = $result->fetchAll();
        $result->closeCursor();

        return $rows;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private static function isLocalUrl(string $url): bool {
        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        return in_array($host, ['localhost', '127.0.0.1', 'host.docker.internal'], true)
            || str_starts_with($host, '192.168.')
            || str_starts_with($host, '10.');
    }

    private function sign(string $payload, string $secret): string {
        return 'sha256=' . hash_hmac('sha256', $payload, $secret);
    }

    private function post(string $url, string $payload, string $signature): bool {
        return $this->postWithDetails($url, $payload, $signature)['success'];
    }

    private function postWithDetails(string $url, string $payload, string $signature): array {
        try {
            $client   = $this->httpClient->newClient();
            $response = $client->post($url, [
                'body'    => $payload,
                'headers' => [
                    'Content-Type'         => 'application/json',
                    'X-Karsaaz-Signature'  => $signature,
                    'User-Agent'           => 'Karsaaz-ERP-Bridge/1.0',
                ],
                'timeout' => self::TIMEOUT_SEC,
                'verify'  => !self::isLocalUrl($url),
            ]);
            $status = $response->getStatusCode();
            return ['success' => $status >= 200 && $status < 300, 'status_code' => $status];
        } catch (\Exception $e) {
            return ['success' => false, 'status_code' => 0];
        }
    }

    private function logDelivery(
        string  $tenantId,
        string  $eventType,
        string  $payloadHash,
        string  $status,
        int     $attemptCount,
        ?string $payload,
    ): void {
        $qb = $this->db->getQueryBuilder();
        $qb->insert(self::TABLE_LOG)
           ->values([
               'tenant_id'      => $qb->createNamedParameter($tenantId),
               'event_type'     => $qb->createNamedParameter($eventType),
               'payload_hash'   => $qb->createNamedParameter($payloadHash),
               'status'         => $qb->createNamedParameter($status),
               'attempt_count'  => $qb->createNamedParameter($attemptCount),
               'last_attempt_at'=> $qb->createNamedParameter(time()),
               'payload'        => $qb->createNamedParameter($payload),
           ])
           ->executeStatement();
    }

    private function updateLog(int $id, string $status, int $attemptCount): void {
        $qb = $this->db->getQueryBuilder();
        $qb->update(self::TABLE_LOG)
           ->set('status',          $qb->createNamedParameter($status))
           ->set('attempt_count',   $qb->createNamedParameter($attemptCount))
           ->set('last_attempt_at', $qb->createNamedParameter(time()))
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)))
           ->executeStatement();
    }
}
