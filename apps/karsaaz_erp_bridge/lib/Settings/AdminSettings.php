<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Settings;

use OCA\KarsaazErpBridge\Service\TenantService;
use OCA\KarsaazErpBridge\Service\WebhookDeliveryService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IL10N;
use OCP\Settings\ISettings;

class AdminSettings implements ISettings {
    public function __construct(
        private readonly IL10N                  $l,
        private readonly TenantService          $tenants,
        private readonly WebhookDeliveryService $delivery,
    ) {
    }

    public function getForm(): TemplateResponse {
        $tenantList = $this->tenants->listAll();

        // Enrich each tenant with last delivery status and log count
        $tenants = array_map(function (array $t): array {
            $logs = $this->delivery->getLogsForTenant($t['tenant_id'], 50);
            $lastStatus = !empty($logs) ? $logs[0]['status'] : 'no_events';
            return array_merge($t, [
                'last_delivery_status' => $lastStatus,
                'log_count'            => count($logs),
            ]);
        }, $tenantList);

        return new TemplateResponse(
            'karsaaz_erp_bridge',
            'admin',
            ['tenants' => $tenants],
            TemplateResponse::RENDER_AS_BLANK
        );
    }

    public function getSection(): string  { return 'karsaaz_erp_bridge'; }
    public function getPriority(): int    { return 10; }
}
