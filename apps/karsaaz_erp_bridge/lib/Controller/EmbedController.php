<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Controller;

use OCA\KarsaazErpBridge\Service\AuthBridgeService;
use OCA\KarsaazErpBridge\Service\TenantService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\AppFramework\Http\Response;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;
use OCP\IURLGenerator;

class EmbedController extends Controller {
    public function __construct(
        string                              $appName,
        IRequest                            $request,
        private readonly TenantService      $tenants,
        private readonly AuthBridgeService  $authBridge,
        private readonly IURLGenerator      $urlGenerator,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * Embeddable chat page.
     * Usage: GET /apps/karsaaz_erp_bridge/embed?token={ERP_JWT}&tenant={TENANT_ID}&room={ROOM_TOKEN}
     *
     * @PublicPage
     * @NoCSRFRequired
     * @NoAdminRequired
     */
    #[PublicPage]
    #[NoCSRFRequired]
    #[NoAdminRequired]
    public function show(): Response {
        // HTTPS enforcement
        if (!$this->isHttps()) {
            $httpsUrl = str_replace('http://', 'https://', $this->request->getRequestUri());
            $redirect = new Response();
            $redirect->addHeader('Location', $httpsUrl);
            $redirect->addHeader('Strict-Transport-Security', 'max-age=31536000');
            $redirect->setStatus(Http::STATUS_MOVED_PERMANENTLY);
            return $redirect;
        }

        $token    = trim((string)$this->request->getParam('token', ''));
        $tenantId = trim((string)$this->request->getParam('tenant', ''));
        $room     = trim((string)$this->request->getParam('room', ''));

        // If token passed in URL — validate immediately and render auto-login page
        if ($token !== '' && $tenantId !== '') {
            return $this->renderWithToken($tenantId, $token, $room);
        }

        // No token in URL — render page that waits for postMessage from parent ERP
        return $this->renderPostMessageWait($tenantId, $room);
    }

    private function renderWithToken(string $tenantId, string $token, string $room): Response {
        $tenant = $this->tenants->findById($tenantId);
        if ($tenant === null) {
            return $this->errorResponse('Tenant not found', Http::STATUS_NOT_FOUND);
        }

        // Enforce CORS
        $allowedOrigins = $tenant['allowed_origins'];
        $this->setCorsHeaders($allowedOrigins);

        try {
            $ncBaseUrl   = $this->urlGenerator->getBaseUrl();
            $credentials = $this->authBridge->exchangeToken($tenant, $token, $ncBaseUrl);
        } catch (\InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), Http::STATUS_FORBIDDEN);
        }

        $talkUrl = $this->buildTalkUrl($ncBaseUrl, $room);

        $response = new TemplateResponse(
            'karsaaz_erp_bridge',
            'embed',
            [
                'nc_username' => $credentials['nc_username'],
                'nc_password' => $credentials['nc_password'],
                'nc_base_url' => $ncBaseUrl,
                'talk_url'    => $talkUrl,
                'room'        => $room,
                'mode'        => 'auto-login',
            ],
            TemplateResponse::RENDER_AS_BLANK
        );
        $response->addHeader('Strict-Transport-Security', 'max-age=31536000');
        $response->addHeader('X-Frame-Options', 'ALLOWALL'); // embed allows iframe
        $response->addHeader('Content-Security-Policy', "frame-ancestors *");

        return $response;
    }

    private function renderPostMessageWait(string $tenantId, string $room): Response {
        $response = new TemplateResponse(
            'karsaaz_erp_bridge',
            'embed',
            [
                'nc_username' => '',
                'nc_password' => '',
                'nc_base_url' => $this->urlGenerator->getBaseUrl(),
                'talk_url'    => '',
                'room'        => $room,
                'mode'        => 'postmessage',
                'tenant_id'   => $tenantId,
            ],
            TemplateResponse::RENDER_AS_BLANK
        );
        $response->addHeader('Strict-Transport-Security', 'max-age=31536000');
        $response->addHeader('X-Frame-Options', 'ALLOWALL');
        $response->addHeader('Content-Security-Policy', "frame-ancestors *");

        return $response;
    }

    private function buildTalkUrl(string $baseUrl, string $room): string {
        if ($room === '') {
            return rtrim($baseUrl, '/') . '/apps/spreed/';
        }
        return rtrim($baseUrl, '/') . '/call/' . urlencode($room);
    }

    private function isHttps(): bool {
        return $this->request->getServerProtocol() === 'https'
            || ($this->request->getHeader('X-Forwarded-Proto') === 'https');
    }

    private function setCorsHeaders(array $allowedOrigins): void {
        if (empty($allowedOrigins)) {
            return;
        }
        $origin = $this->request->getHeader('Origin');
        if ($origin === '') {
            return;
        }
        foreach ($allowedOrigins as $allowed) {
            if (rtrim($allowed, '/') === rtrim($origin, '/')) {
                header("Access-Control-Allow-Origin: $origin");
                return;
            }
        }
    }

    private function errorResponse(string $message, int $status): Response {
        $r = new Response();
        $r->setStatus($status);
        $r->setContentType('application/json');
        // Write body directly — TemplateResponse not needed for errors
        ob_start();
        echo json_encode(['error' => $message]);
        $r->setBody((string)ob_get_clean());
        return $r;
    }
}
