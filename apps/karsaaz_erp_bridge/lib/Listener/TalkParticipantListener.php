<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Listener;

use OCA\KarsaazErpBridge\Service\WebhookDeliveryService;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\IDBConnection;

abstract class AbstractTalkParticipantListener implements IEventListener {
    public function __construct(
        protected readonly WebhookDeliveryService $delivery,
        protected readonly IDBConnection          $db,
    ) {
    }

    abstract protected function eventType(): string;

    public function handle(Event $event): void {
        $roomToken = $this->extractRoomToken($event);
        $ncUid     = $this->extractParticipantUid($event);
        if ($roomToken === '' || $ncUid === '' || !str_starts_with($ncUid, 'erp_')) {
            return;
        }

        $tenantRows = $this->findTenantsForNcUser($ncUid);
        if ($tenantRows === []) {
            return;
        }

        $payload = [
            'room_token'         => $roomToken,
            'participant_nc_uid' => $ncUid,
            'participant_erp_id' => $this->findErpUserId($ncUid),
        ];

        foreach ($tenantRows as $tenant) {
            $this->delivery->deliver($tenant, $this->eventType(), $payload);
        }
    }

    private function extractRoomToken(Event $event): string {
        if (method_exists($event, 'getRoom') && $event->getRoom() !== null) {
            return (string)$event->getRoom()->getToken();
        }
        return '';
    }

    private function extractParticipantUid(Event $event): string {
        if (method_exists($event, 'getParticipant')) {
            $participant = $event->getParticipant();
            if ($participant !== null && method_exists($participant, 'getAttendee')) {
                $attendee = $participant->getAttendee();
                if ($attendee !== null && method_exists($attendee, 'getActorId')) {
                    return (string)$attendee->getActorId();
                }
            }
        }
        if (method_exists($event, 'getUserId')) {
            return (string)$event->getUserId();
        }
        return '';
    }

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

class TalkAttendeeAddedListener extends AbstractTalkParticipantListener {
    protected function eventType(): string {
        return 'cloud.user.joined';
    }
}

class TalkAttendeeRemovedListener extends AbstractTalkParticipantListener {
    protected function eventType(): string {
        return 'cloud.user.left';
    }
}
