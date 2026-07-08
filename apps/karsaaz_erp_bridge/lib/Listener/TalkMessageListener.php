<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Listener;

use OCA\KarsaazErpBridge\Service\TenantService;
use OCA\KarsaazErpBridge\Service\WebhookDeliveryService;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\IDBConnection;

/**
 * Listens for Nextcloud Talk message events and fans them out to all registered
 * ERP tenants that have a user active in the affected conversation room.
 *
 * The event class OCA\Talk\Events\MessageSentEvent is registered conditionally
 * in Application.php — if Talk is not installed the listener is never invoked.
 */
class TalkMessageListener implements IEventListener {
    public function __construct(
        private readonly TenantService         $tenants,
        private readonly WebhookDeliveryService $delivery,
        private readonly IDBConnection          $db,
    ) {
    }

    public function handle(Event $event): void {
        // Safely extract data — Talk event shapes vary across NC versions
        if (!method_exists($event, 'getComment') && !method_exists($event, 'getMessage')) {
            return;
        }

        $roomToken   = $this->extractRoomToken($event);
        $senderNcUid = $this->extractSenderUid($event);
        $message     = $this->extractMessage($event);
        $messageId   = $this->extractMessageId($event);

        if ($roomToken === '' || $senderNcUid === '') {
            return;
        }

        // Find all ERP tenants that provisioned this NC user
        $tenantRows = $this->findTenantsForNcUser($senderNcUid);
        if (empty($tenantRows)) {
            return;
        }

        $erpUserId = $this->findErpUserId($senderNcUid);

        foreach ($tenantRows as $tenant) {
            $this->delivery->deliver($tenant, 'cloud.message.sent', [
                'room_token'        => $roomToken,
                'sender_erp_user_id'=> $erpUserId,
                'sender_nc_uid'     => $senderNcUid,
                'message'           => $message,
                'message_id'        => $messageId,
            ]);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function extractRoomToken(Event $event): string {
        // NC Talk 17+ exposes getRoom()->getToken()
        if (method_exists($event, 'getRoom') && $event->getRoom() !== null) {
            return (string)$event->getRoom()->getToken();
        }
        return '';
    }

    private function extractSenderUid(Event $event): string {
        if (method_exists($event, 'getComment')) {
            return (string)$event->getComment()->getActorId();
        }
        if (method_exists($event, 'getMessage')) {
            $msg = $event->getMessage();
            if (method_exists($msg, 'getActorId')) {
                return (string)$msg->getActorId();
            }
        }
        return '';
    }

    private function extractMessage(Event $event): string {
        if (method_exists($event, 'getComment')) {
            return (string)$event->getComment()->getMessage();
        }
        return '';
    }

    private function extractMessageId(Event $event): int {
        if (method_exists($event, 'getComment')) {
            return (int)$event->getComment()->getId();
        }
        return 0;
    }

    /** Return all tenant rows that have a mapping for this NC uid. */
    private function findTenantsForNcUser(string $ncUid): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('t.*')
           ->from('kerp_tenants', 't')
           ->join('t', 'kerp_user_map', 'u', $qb->expr()->eq('t.tenant_id', 'u.tenant_id'))
           ->where($qb->expr()->eq('u.nc_uid', $qb->createNamedParameter($ncUid)));

        $result = $qb->executeQuery();
        $rows   = $result->fetchAll();
        $result->closeCursor();

        return $rows;
    }

    private function findErpUserId(string $ncUid): string {
        $qb = $this->db->getQueryBuilder();
        $qb->select('erp_user_id')
           ->from('kerp_user_map')
           ->where($qb->expr()->eq('nc_uid', $qb->createNamedParameter($ncUid)))
           ->setMaxResults(1);

        $result = $qb->executeQuery();
        $row    = $result->fetch();
        $result->closeCursor();

        return $row ? (string)$row['erp_user_id'] : $ncUid;
    }
}
