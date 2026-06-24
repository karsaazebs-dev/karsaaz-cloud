<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Middleware;

use OCA\KarsaazErpBridge\Attribute\RequireApiKey;
use OCA\KarsaazErpBridge\Service\TenantService;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Middleware;
use OCP\IRequest;

/**
 * Reads X-ERP-API-Key, hashes it, looks up the tenant, and injects the
 * tenant context into the request attributes for downstream controllers.
 */
class ApiKeyMiddleware extends Middleware {
    public function __construct(
        private readonly IRequest     $request,
        private readonly TenantService $tenants,
    ) {
    }

    public function beforeController($controller, string $methodName): void {
        $reflection = new \ReflectionMethod($controller, $methodName);
        if (empty($reflection->getAttributes(RequireApiKey::class))) {
            return;
        }

        $apiKey = $this->request->getHeader('X-ERP-API-Key');
        if ($apiKey === '') {
            throw new \OCP\AppFramework\OCS\OCSForbiddenException('Missing X-ERP-API-Key header');
        }

        $tenant = $this->tenants->findByApiKey($apiKey);
        if ($tenant === null) {
            throw new \OCP\AppFramework\OCS\OCSForbiddenException('Invalid API key');
        }

        // Store tenant in request for controller use
        $this->request->setParam('_erp_tenant', $tenant);
    }
}
