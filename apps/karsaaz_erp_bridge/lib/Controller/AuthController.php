<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Controller;

use OCA\KarsaazErpBridge\Attribute\RequireApiKey;
use OCA\KarsaazErpBridge\Service\AuthBridgeService;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCS\OCSBadRequestException;
use OCP\AppFramework\OCS\OCSForbiddenException;
use OCP\AppFramework\OCSController;
use OCP\IRequest;
use OCP\IURLGenerator;

class AuthController extends OCSController {
    public function __construct(
        string                              $appName,
        IRequest                            $request,
        private readonly AuthBridgeService  $authBridge,
        private readonly IURLGenerator      $urlGenerator,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * Exchange an ERP JWT for Nextcloud credentials.
     * Required header: X-ERP-API-Key
     * Body: { erp_jwt: string }
     *
     * @NoCSRFRequired
     * @NoAdminRequired
     */
    #[NoCSRFRequired]
    #[NoAdminRequired]
    #[RequireApiKey]
    public function token(): DataResponse {
        $tenant = $this->request->getParam('_erp_tenant');
        $erpJwt = trim((string)$this->request->getParam('erp_jwt', ''));

        if ($erpJwt === '') {
            throw new OCSBadRequestException('erp_jwt is required');
        }

        // Enforce CORS based on registered allowed_origins
        $this->enforceCors($tenant['allowed_origins']);

        try {
            $ncBaseUrl   = $this->urlGenerator->getBaseUrl();
            $credentials = $this->authBridge->exchangeToken($tenant, $erpJwt, $ncBaseUrl);
        } catch (\InvalidArgumentException $e) {
            throw new OCSForbiddenException($e->getMessage());
        }

        return new DataResponse($credentials);
    }

    // ── CORS helpers ───────────────────────────────────────────────────────────

    private function enforceCors(array $allowedOrigins): void {
        if (empty($allowedOrigins)) {
            return;
        }

        $requestOrigin = $this->request->getHeader('Origin');
        if ($requestOrigin === '') {
            return; // non-browser request — allow through
        }

        // Normalize: scheme://host (strip trailing slash, lowercase scheme+host)
        $normalizedRequest = $this->normalizeOrigin($requestOrigin);

        foreach ($allowedOrigins as $allowed) {
            if ($this->normalizeOrigin($allowed) === $normalizedRequest) {
                header("Access-Control-Allow-Origin: $requestOrigin");
                header('Access-Control-Allow-Headers: X-ERP-API-Key, Content-Type');
                header('Access-Control-Allow-Methods: POST, OPTIONS');
                return;
            }
        }

        throw new OCSForbiddenException("Origin not allowed: $requestOrigin");
    }

    private function normalizeOrigin(string $origin): string {
        $parsed = parse_url($origin);
        $scheme = strtolower($parsed['scheme'] ?? '');
        $host   = strtolower($parsed['host'] ?? '');
        $port   = isset($parsed['port']) ? ':' . $parsed['port'] : '';
        return "$scheme://$host$port";
    }
}
