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

    /** @return array<string, mixed> */
    private function bodyParams(): array {
        $params = $this->request->getParams();
        $contentType = $this->request->getHeader('Content-Type') ?? '';
        if (str_contains($contentType, 'application/json')) {
            $raw = file_get_contents('php://input');
            $json = json_decode($raw ?: '', true);
            if (is_array($json)) {
                return array_merge($params, $json);
            }
        }
        return $params;
    }

    private function requireAdmin(): ?DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }
        if (!$this->groupManager->isAdmin($this->userId)) {
            return new DataResponse(['error' => 'Administrator access required'], Http::STATUS_FORBIDDEN);
        }
        return null;
    }

    private function requireAuth(): ?DataResponse {
        if ($this->userId === null) {
            return new DataResponse(['error' => 'Not authenticated'], Http::STATUS_UNAUTHORIZED);
        }
        return null;
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function getPool(): DataResponse {
        if ($denied = $this->requireAdmin()) {
            return $denied;
        }

        $total       = $this->service->getTotalPool($this->userId);
        $distributed = $this->service->getDistributedBytes($this->userId);

        return new DataResponse([
            'total_bytes'       => $total,
            'distributed_bytes' => $distributed,
            'available_bytes'   => max(0, $total - $distributed),
        ]);
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function getUsers(): DataResponse {
        if ($denied = $this->requireAdmin()) {
            return $denied;
        }

        $users = $this->service->getManagedUsers($this->userId);
        return new DataResponse(['users' => $users]);
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function allocate(string $uid): DataResponse {
        if ($denied = $this->requireAdmin()) {
            return $denied;
        }

        $params = $this->bodyParams();
        try {
            $bytes = $this->service->resolveBytesFromParams($params);
        } catch (\InvalidArgumentException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
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

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function getRequests(): DataResponse {
        if ($denied = $this->requireAuth()) {
            return $denied;
        }

        $requests = $this->service->getRequests($this->userId);
        return new DataResponse(['requests' => $requests]);
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function createRequest(): DataResponse {
        if ($denied = $this->requireAuth()) {
            return $denied;
        }

        $params = $this->bodyParams();
        $currentBytes   = (int) ($params['current_bytes'] ?? 0);
        $requestedBytes = (int) ($params['requested_bytes'] ?? 0);
        $reason         = (string) ($params['reason'] ?? '');
        $storageType    = (string) ($params['storage_type'] ?? 'general');

        if ($requestedBytes <= 0) {
            return new DataResponse(
                ['error' => 'requested_bytes must be a positive integer'],
                Http::STATUS_BAD_REQUEST
            );
        }

        try {
            $id = $this->service->createRequest(
                $this->userId,
                $currentBytes,
                $requestedBytes,
                $reason,
                $storageType
            );
            return new DataResponse(['id' => $id], Http::STATUS_CREATED);
        } catch (\InvalidArgumentException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
        }
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function reviewRequest(string $id): DataResponse {
        if ($denied = $this->requireAdmin()) {
            return $denied;
        }

        $params = $this->bodyParams();
        $status = (string) ($params['status'] ?? '');
        $approvedBytes = isset($params['approved_bytes']) ? (int) $params['approved_bytes'] : null;
        $adminNotes = isset($params['admin_notes']) ? (string) $params['admin_notes'] : null;
        try {
            $this->service->reviewRequest($this->userId, $id, $status, $approvedBytes, $adminNotes);
            return new DataResponse(['id' => $id, 'status' => $status]);
        } catch (\RuntimeException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_NOT_FOUND);
        } catch (\InvalidArgumentException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
        }
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function getMe(): DataResponse {
        if ($denied = $this->requireAuth()) {
            return $denied;
        }

        $record = $this->service->getUserRecord($this->userId);
        if ($record === null) {
            return new DataResponse(['error' => 'User not found'], Http::STATUS_NOT_FOUND);
        }
        return new DataResponse($record);
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function provision(): DataResponse {
        if ($denied = $this->requireAdmin()) {
            return $denied;
        }

        $params = $this->bodyParams();
        try {
            $result = $this->service->provisionUser($this->userId, $params);
            return new DataResponse($result, Http::STATUS_CREATED);
        } catch (\RuntimeException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_CONFLICT);
        } catch (\InvalidArgumentException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
        }
    }

    #[NoAdminRequired]
    #[NoCSRFRequired]
    public function updateProfile(string $uid): DataResponse {
        if ($denied = $this->requireAdmin()) {
            return $denied;
        }

        $params = $this->bodyParams();
        try {
            $this->service->updateUserProfile($this->userId, $uid, $params);
            return new DataResponse(['uid' => $uid]);
        } catch (\RuntimeException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_NOT_FOUND);
        } catch (\InvalidArgumentException $e) {
            return new DataResponse(['error' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
        }
    }
}
