<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\BackgroundJob;

use OCA\KarsaazErpBridge\Service\TenantService;
use OCA\KarsaazErpBridge\Service\WebhookDeliveryService;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\TimedJob;

/**
 * Runs every 60 seconds via NC cron.
 * Picks up failed webhook deliveries and retries them according to the
 * exponential backoff schedule defined in WebhookDeliveryService.
 */
class WebhookRetryJob extends TimedJob {
    public function __construct(
        ITimeFactory                           $time,
        private readonly WebhookDeliveryService $delivery,
        private readonly TenantService          $tenants,
    ) {
        parent::__construct($time);
        $this->setInterval(60); // run every 60 seconds
    }

    protected function run($argument): void {
        $pending = $this->delivery->getPendingRetries();

        foreach ($pending as $logRow) {
            $tenant = $this->tenants->findById($logRow['tenant_id']);
            if ($tenant === null) {
                continue; // tenant was revoked — skip
            }
            $this->delivery->retry($logRow, $tenant);
        }
    }
}
