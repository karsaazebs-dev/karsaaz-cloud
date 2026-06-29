<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Controller;

use OCA\KarsaazErpBridge\Attribute\RequireApiKey;
use OCA\KarsaazErpBridge\Service\TenantService;
use OCA\KarsaazErpBridge\Service\WebhookDeliveryService;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSBadRequestException;
use OCP\AppFramework\OCSController;
use OCP\IRequest;

class ApiController extends OCSController {
    public function __construct(
        string                                 $appName,
        IRequest                               $request,
        private readonly TenantService         $tenants,
        private readonly WebhookDeliveryService $delivery,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * @PublicPage
     * @NoCSRFRequired
     * @NoAdminRequired
     */
    #[PublicPage]
    #[NoCSRFRequired]
    #[NoAdminRequired]
    public function register(): DataResponse {
        $name           = trim((string)$this->request->getParam('name', ''));
        $webhookUrl     = trim((string)$this->request->getParam('webhook_url', ''));
        $erpJwtSecret   = (string)$this->request->getParam('erp_jwt_secret', '');
        $allowedOrigins = (array)$this->request->getParam('allowed_origins', []);

        // Validate inputs
        $errors = [];
        if ($name === '') {
            $errors['name'] = 'required';
        }
        if (!filter_var($webhookUrl, FILTER_VALIDATE_URL)) {
            $errors['webhook_url'] = 'webhook_url must be a valid URL';
        } elseif (!str_starts_with($webhookUrl, 'https://') && !self::isLocalUrl($webhookUrl)) {
            $errors['webhook_url'] = 'webhook_url must use HTTPS';
        }
        if (strlen($erpJwtSecret) < 32) {
            $errors['erp_jwt_secret'] = 'erp_jwt_secret must be at least 32 characters';
        }
        foreach ($allowedOrigins as $origin) {
            $parsed = parse_url((string)$origin);
            if (empty($parsed['scheme']) || empty($parsed['host']) || !empty($parsed['path']) || !empty($parsed['query'])) {
                $errors['allowed_origins'] = 'each origin must be scheme://host only (no path or query)';
                break;
            }
        }

        if (!empty($errors)) {
            throw new OCSBadRequestException(json_encode($errors));
        }

        $credentials = $this->tenants->register($name, $webhookUrl, $erpJwtSecret, $allowedOrigins);

        return new DataResponse($credentials);
    }

    private static function isLocalUrl(string $url): bool {
        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');
        return in_array($host, ['localhost', '127.0.0.1', 'host.docker.internal'], true)
            || str_starts_with($host, '192.168.')
            || str_starts_with($host, '10.');
    }

    /**
     * @NoCSRFRequired
     * @NoAdminRequired
     */
    #[NoCSRFRequired]
    #[NoAdminRequired]
    #[RequireApiKey]
    public function revoke(): DataResponse {
        $tenant = $this->request->getParam('_erp_tenant');
        $this->tenants->revoke($tenant['tenant_id']);
        return new DataResponse(['status' => 'revoked']);
    }

    /**
     * @NoCSRFRequired
     * @NoAdminRequired
     */
    #[NoCSRFRequired]
    #[NoAdminRequired]
    #[RequireApiKey]
    public function webhookTest(): DataResponse {
        $tenant = $this->request->getParam('_erp_tenant');
        $result = $this->delivery->sendTest($tenant);
        return new DataResponse($result);
    }
}
