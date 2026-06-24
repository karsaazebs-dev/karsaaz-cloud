<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\BackgroundJob;

use OCA\KarsaazErpBridge\Service\ExternalDbService;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\TimedJob;

/**
 * Flushes Redis-buffered chat messages into each tenant's external DB.
 * Runs every 60 seconds via NC cron. Only has work to do when external DB
 * was temporarily unavailable and messages were buffered.
 */
class ExternalDbFlushJob extends TimedJob {
    public function __construct(
        ITimeFactory                      $time,
        private readonly ExternalDbService $extDb,
    ) {
        parent::__construct($time);
        $this->setInterval(60);
    }

    protected function run($argument): void {
        $tenantIds = $this->extDb->getTenantIdsWithBuffer();
        foreach ($tenantIds as $tenantId) {
            $this->extDb->flushBuffer($tenantId);
        }
    }
}
