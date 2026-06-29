<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\AppInfo;

use OCA\KarsaazErpBridge\Listener\TalkMessageListener;
use OCA\KarsaazErpBridge\Middleware\ApiKeyMiddleware;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;

class Application extends App implements IBootstrap {
    public const APP_ID = 'karsaaz_erp_bridge';

    public function __construct(array $urlParams = []) {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void {
        $context->registerMiddleware(ApiKeyMiddleware::class);

        // Talk message listener — registered only when Talk is available
        $context->registerEventListener(
            \OCA\Talk\Events\MessageSentEvent::class,
            TalkMessageListener::class
        );
    }

    public function boot(IBootContext $context): void {
    }
}
