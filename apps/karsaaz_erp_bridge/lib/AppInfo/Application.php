<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\AppInfo;

use OCA\KarsaazErpBridge\Listener\FileShareListener;
use OCA\KarsaazErpBridge\Listener\TalkAttendeeAddedListener;
use OCA\KarsaazErpBridge\Listener\TalkAttendeeRemovedListener;
use OCA\KarsaazErpBridge\Listener\TalkMessageListener;
use OCA\KarsaazErpBridge\Middleware\ApiKeyMiddleware;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Share\Events\ShareCreatedEvent;

class Application extends App implements IBootstrap {
    public const APP_ID = 'karsaaz_erp_bridge';

    public function __construct(array $urlParams = []) {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void {
        $context->registerMiddleware(ApiKeyMiddleware::class);

        $context->registerEventListener(ShareCreatedEvent::class, FileShareListener::class);

        if (class_exists(\OCA\Talk\Events\MessageSentEvent::class)) {
            $context->registerEventListener(
                \OCA\Talk\Events\MessageSentEvent::class,
                TalkMessageListener::class,
            );
        }

        if (class_exists(\OCA\Talk\Events\AAttendeeAddedEvent::class)) {
            $context->registerEventListener(
                \OCA\Talk\Events\AAttendeeAddedEvent::class,
                TalkAttendeeAddedListener::class,
            );
        }

        if (class_exists(\OCA\Talk\Events\AAttendeeRemovedEvent::class)) {
            $context->registerEventListener(
                \OCA\Talk\Events\AAttendeeRemovedEvent::class,
                TalkAttendeeRemovedListener::class,
            );
        }
    }

    public function boot(IBootContext $context): void {
    }
}
