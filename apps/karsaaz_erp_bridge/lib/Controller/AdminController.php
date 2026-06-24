<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Controller;

use OCA\KarsaazErpBridge\Service\ExternalDbService;
use OCA\KarsaazErpBridge\Service\TenantService;
use OCA\KarsaazErpBridge\Service\WebhookDeliveryService;
use OCP\AppFramework\Http\Attribute\AuthorizedAdminSetting;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\IRequest;

class AdminController extends OCSController {
    public function __construct(
        string                                 $appName,
        IRequest                               $request,
        private readonly TenantService         $tenants,
        private readonly WebhookDeliveryService $delivery,
        private readonly ExternalDbService      $extDb,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * List all registered ERP tenants (admin view — secrets omitted).
     *
     * @NoCSRFRequired
     */
    #[NoCSRFRequired]
    #[AuthorizedAdminSetting(settings: \OCA\KarsaazErpBridge\Settings\AdminSettings::class)]
    public function listTenants(): DataResponse {
        return new DataResponse($this->tenants->listAll());
    }

    /**
     * Get webhook delivery logs (optionally filtered by tenant_id).
     *
     * @NoCSRFRequired
     */
    #[NoCSRFRequired]
    #[AuthorizedAdminSetting(settings: \OCA\KarsaazErpBridge\Settings\AdminSettings::class)]
    public function getLogs(): DataResponse {
        $tenantId = (string)$this->request->getParam('tenant_id', '');
        $limit    = min(200, max(1, (int)$this->request->getParam('limit', 50)));

        if ($tenantId !== '') {
            $logs = $this->delivery->getLogsForTenant($tenantId, $limit);
        } else {
            // Return logs for all tenants (up to $limit most recent)
            $logs = [];
            foreach ($this->tenants->listAll() as $tenant) {
                $tenantLogs = $this->delivery->getLogsForTenant($tenant['tenant_id'], $limit);
                foreach ($tenantLogs as $log) {
                    $log['tenant_name'] = $tenant['name'];
                    $logs[] = $log;
                }
            }
            usort($logs, static fn ($a, $b) => (int)$b['last_attempt_at'] - (int)$a['last_attempt_at']);
            $logs = array_slice($logs, 0, $limit);
        }

        return new DataResponse($logs);
    }

    /**
     * Test external DB connectivity for a tenant.
     *
     * @NoCSRFRequired
     */
    #[NoCSRFRequired]
    #[AuthorizedAdminSetting(settings: \OCA\KarsaazErpBridge\Settings\AdminSettings::class)]
    public function testDb(): DataResponse {
        $tenantId = (string)$this->request->getParam('tenant_id', '');
        $result   = $this->extDb->testConnection($tenantId);
        return new DataResponse($result);
    }

    /**
     * Revoke (delete) a tenant by UUID.
     *
     * @NoCSRFRequired
     */
    #[NoCSRFRequired]
    #[AuthorizedAdminSetting(settings: \OCA\KarsaazErpBridge\Settings\AdminSettings::class)]
    public function revokeTenant(string $id): DataResponse {
        $tenant = $this->tenants->findById($id);
        if ($tenant === null) {
            return new DataResponse(['error' => 'Tenant not found'], 404);
        }
        $this->tenants->revoke($id);
        return new DataResponse(['status' => 'revoked', 'tenant_id' => $id]);
    }
}
