<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazQuota\Listener;

use OCA\KarsaazQuota\Service\AllocationService;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\User\Events\UserCreatedEvent;
use Psr\Log\LoggerInterface;

/** @template-implements IEventListener<UserCreatedEvent> */
class UserCreatedListener implements IEventListener {
    public function __construct(
        private AllocationService $service,
        private LoggerInterface   $logger,
    ) {
    }

    public function handle(Event $event): void {
        if (!($event instanceof UserCreatedEvent)) {
            return;
        }

        $uid = $event->getUid();
        try {
            $this->service->assignDefaultQuota($uid);
        } catch (\Throwable $e) {
            $this->logger->error(
                'karsaaz_quota: failed to assign default quota for user {uid}: {msg}',
                ['uid' => $uid, 'msg' => $e->getMessage()]
            );
        }
    }
}
