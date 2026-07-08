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
use OCP\Share\Events\ShareCreatedEvent;

/**
 * Emits file_shared when an ERP-provisioned NC user creates a share.
 */
class FileShareListener implements IEventListener {
    public function __construct(
        private readonly TenantService          $tenants,
        private readonly WebhookDeliveryService $delivery,
        private readonly IDBConnection          $db,
    ) {
    }

    public function handle(Event $event): void {
        if (!$event instanceof ShareCreatedEvent) {
            return;
        }

        $share = $event->getShare();
        $ncUid = (string)$share->getSharedBy();
        if ($ncUid === '' || !str_starts_with($ncUid, 'erp_')) {
            return;
        }

        $tenantRows = $this->findTenantsForNcUser($ncUid);
        if ($tenantRows === []) {
            return;
        }

        $erpUserId = $this->findErpUserId($ncUid);
        $payload = [
            'file_id'          => (int)$share->getNodeId(),
            'file_path'        => (string)$share->getTarget(),
            'shared_by_nc_uid' => $ncUid,
            'shared_by_erp_id' => $erpUserId,
            'share_type'       => (string)$share->getShareType(),
        ];

        foreach ($tenantRows as $tenant) {
            $this->delivery->deliver($tenant, 'cloud.file.shared', $payload);
        }
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
