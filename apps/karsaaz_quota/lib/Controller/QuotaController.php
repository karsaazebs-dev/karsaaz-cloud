<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazQuota\Controller;

use OCA\KarsaazQuota\Service\AllocationService;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\IGroupManager;
use OCP\IRequest;

class QuotaController extends OCSController {
    public function __construct(
        string                $appName,
        IRequest              $request,
        private AllocationService $service,
        private IGroupManager $groupManager,
        private ?string       $userId,
    ) {
        parent::__construct($appName, $request);
    }

    // ── GET /api/v1/pool ──────────────────────────────────────────────────────

    /**
     * Return the calling admin's pool summary.
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function getPool(): DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $total       = $this->service->getTotalPool($this->userId);
        $distributed = $this->service->getDistributedBytes($this->userId);

        return new DataResponse([
            'total_bytes'       => $total,
            'distributed_bytes' => $distributed,
            'available_bytes'   => max(0, $total - $distributed),
        ]);
    }

    // ── GET /api/v1/users ─────────────────────────────────────────────────────

    /**
     * List all users managed by the calling admin, with their quota data.
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function getUsers(): DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $users = $this->service->getManagedUsers($this->userId);
        return new DataResponse(['users' => $users]);
    }

    // ── PUT /api/v1/allocate/{uid} ────────────────────────────────────────────

    /**
     * Set a user's storage quota.  Body: { "bytes": <int> }
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function allocate(string $uid): DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $bytes = (int) $this->request->getParam('bytes', 0);
        if ($bytes <= 0) {
            return new DataResponse(['error' => 'bytes must be a positive integer'], Http::STATUS_BAD_REQUEST);
        }

        try {
            $this->service->allocate($this->userId, $uid, $bytes);
            return new DataResponse([
                'uid'   => $uid,
                'bytes' => $bytes,
            ]);
        } catch (\RuntimeException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_FORBIDDEN);
        } catch (\InvalidArgumentException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
        }
    }

    // ── GET /api/v1/requests ──────────────────────────────────────────────────

    /**
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function getRequests(): DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $requests = $this->service->getRequests($this->userId);
        return new DataResponse(['requests' => $requests]);
    }

    // ── POST /api/v1/requests ─────────────────────────────────────────────────

    /**
     * Body: { "current_bytes": <int>, "requested_bytes": <int>, "reason": <string> }
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function createRequest(): DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $currentBytes   = (int) $this->request->getParam('current_bytes', 0);
        $requestedBytes = (int) $this->request->getParam('requested_bytes', 0);
        $reason         = (string) $this->request->getParam('reason', '');

        if ($requestedBytes <= $currentBytes) {
            return new DataResponse(
                ['error' => 'requested_bytes must be greater than current_bytes'],
                Http::STATUS_BAD_REQUEST
            );
        }

        $id = $this->service->createRequest($this->userId, $currentBytes, $requestedBytes, $reason);
        return new DataResponse(['id' => $id], Http::STATUS_CREATED);
    }

    // ── PUT /api/v1/requests/{id} ─────────────────────────────────────────────

    /**
     * Admin approves or rejects a request. Body: { "status": "approved"|"rejected" }
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function reviewRequest(string $id): DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }

        $status = (string) $this->request->getParam('status', '');
        try {
            $this->service->reviewRequest($this->userId, $id, $status);
            return new DataResponse(['id' => $id, 'status' => $status]);
        } catch (\RuntimeException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_NOT_FOUND);
        } catch (\InvalidArgumentException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
        }
    }
}
