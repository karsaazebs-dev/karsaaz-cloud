<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazQuota\Service;

use OCP\AppFramework\Utility\ITimeFactory;
use OCP\IConfig;
use OCP\IGroupManager;
use OCP\IUserManager;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\IDBConnection;

/**
 * Core business logic for hierarchical storage allocation.
 *
 * Hierarchy:
 *   Super Admin (admin group) → pool = karsaaz_quota/super_admin_bytes (default 2 TB)
 *   Admin (sub-admin)        → pool = their row in kz_quota_alloc
 *   User                     → quota = their row in kz_quota_alloc (default 10 GB)
 */
class AllocationService {
    private const DEFAULT_SUPER_ADMIN_BYTES = 2_199_023_255_552; // 2 TB
    private const DEFAULT_USER_BYTES        =        10_737_418_240; // 10 GB

    /** @var list<string> */
    private const STORAGE_TYPES = ['general', 'documents', 'media'];

    public function __construct(
        private IDBConnection $db,
        private IConfig       $config,
        private IGroupManager $groupManager,
        private IUserManager  $userManager,
        private ITimeFactory  $timeFactory,
    ) {
    }

    // ── Pool queries ──────────────────────────────────────────────────────────

    /**
     * Return the total bytes a uid is authorised to distribute.
     * Super-admins: global cap from config.
     * Everyone else: their row in kz_quota_alloc.
     */
    public function getTotalPool(string $uid): int {
        if ($this->groupManager->isAdmin($uid)) {
            return (int) $this->config->getAppValue(
                'karsaaz_quota',
                'super_admin_bytes',
                (string) self::DEFAULT_SUPER_ADMIN_BYTES
            );
        }
        return $this->getAllocatedBytes($uid);
    }

    /**
     * Return the sum of bytes already handed out by uid to their direct reports.
     */
    public function getDistributedBytes(string $uid): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->func()->sum('allocated_bytes'))
           ->from('kz_quota_alloc')
           ->where($qb->expr()->eq('grantor_uid', $qb->createNamedParameter($uid)));
        $result = $qb->executeQuery();
        return (int) ($result->fetchOne() ?? 0);
    }

    /**
     * Convenience: pool - distributed.
     */
    public function getAvailableBytes(string $uid): int {
        return max(0, $this->getTotalPool($uid) - $this->getDistributedBytes($uid));
    }

    /**
     * How many bytes have been allocated TO a specific uid (not by them).
     */
    public function getAllocatedBytes(string $uid): int {
        $qb = $this->db->getQueryBuilder();
        $qb->select('allocated_bytes')
           ->from('kz_quota_alloc')
           ->where($qb->expr()->eq('grantee_uid', $qb->createNamedParameter($uid)));
        $result = $qb->executeQuery();
        $row    = $result->fetchOne();
        return $row !== false ? (int) $row : 0;
    }

    // ── Allocation management ─────────────────────────────────────────────────

    /**
     * Set the quota for a grantee.  Validates that the grantor has sufficient
     * available space (accounting for any existing grant to this grantee).
     *
     * @throws \RuntimeException on insufficient pool or permission denied
     */
    public function allocate(string $grantorUid, string $granteeUid, int $bytes): void {
        if ($bytes < 0) {
            throw new \InvalidArgumentException('Allocated bytes must be non-negative.');
        }

        $existing  = $this->getAllocatedBytes($granteeUid);
        $delta     = $bytes - $existing;          // positive = increasing grant
        $available = $this->getAvailableBytes($grantorUid) + $existing; // available counting the existing grant

        // Re-check: the grantor must own the current grantee's allocation
        $grantorOfGrant = $this->getGrantorOf($granteeUid);
        if ($grantorOfGrant !== null && $grantorOfGrant !== $grantorUid && !$this->groupManager->isAdmin($grantorUid)) {
            throw new \RuntimeException('You do not manage this user\'s quota.');
        }

        if ($delta > 0 && $bytes > ($this->getAvailableBytes($grantorUid) + $existing)) {
            throw new \RuntimeException('Insufficient pool: you cannot allocate more storage than you have available.');
        }

        $now = $this->timeFactory->getTime();

        if ($existing > 0) {
            $qb = $this->db->getQueryBuilder();
            $qb->update('kz_quota_alloc')
               ->set('allocated_bytes', $qb->createNamedParameter($bytes, IQueryBuilder::PARAM_INT))
               ->set('grantor_uid',     $qb->createNamedParameter($grantorUid))
               ->set('updated_at',      $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT))
               ->where($qb->expr()->eq('grantee_uid', $qb->createNamedParameter($granteeUid)));
            $qb->executeStatement();
        } else {
            $qb = $this->db->getQueryBuilder();
            $qb->insert('kz_quota_alloc')
               ->values([
                   'grantee_uid'     => $qb->createNamedParameter($granteeUid),
                   'grantor_uid'     => $qb->createNamedParameter($grantorUid),
                   'allocated_bytes' => $qb->createNamedParameter($bytes, IQueryBuilder::PARAM_INT),
                   'created_at'      => $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT),
                   'updated_at'      => $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT),
               ]);
            $qb->executeStatement();
        }

        // Sync to Nextcloud's native quota field so enforcement is immediate.
        $this->config->setUserValue($granteeUid, 'files', 'quota', $this->humanBytes($bytes));
    }

    /**
     * Assign the system default quota to a brand-new user.
     * Called from UserCreatedListener.
     */
    public function assignDefaultQuota(string $uid): void {
        $defaultBytes = (int) $this->config->getAppValue(
            'karsaaz_quota',
            'default_user_bytes',
            (string) self::DEFAULT_USER_BYTES
        );

        $now = $this->timeFactory->getTime();
        $qb  = $this->db->getQueryBuilder();
        $qb->insert('kz_quota_alloc')
           ->values([
               'grantee_uid'     => $qb->createNamedParameter($uid),
               'grantor_uid'     => $qb->createNamedParameter('system'),
               'allocated_bytes' => $qb->createNamedParameter($defaultBytes, IQueryBuilder::PARAM_INT),
               'created_at'      => $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT),
               'updated_at'      => $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT),
           ]);
        $qb->executeStatement();

        $this->config->setUserValue($uid, 'files', 'quota', $this->humanBytes($defaultBytes));
    }

    // ── User listing ──────────────────────────────────────────────────────────

    /**
     * Return all users whose quota is managed by grantorUid, with quota data.
     */
    public function getManagedUsers(string $grantorUid): array {
        if ($this->groupManager->isAdmin($grantorUid)) {
            return $this->getAllUsersWithQuota($grantorUid);
        }

        $qb = $this->db->getQueryBuilder();
        $qb->select('grantee_uid', 'allocated_bytes', 'updated_at')
           ->from('kz_quota_alloc')
           ->where($qb->expr()->eq('grantor_uid', $qb->createNamedParameter($grantorUid)))
           ->orderBy('grantee_uid');

        $result = $qb->executeQuery();
        $rows   = $result->fetchAll();
        $result->closeCursor();

        return array_map(function (array $row) {
            $uid  = $row['grantee_uid'];
            $user = $this->userManager->get($uid);
            $used = (int) $this->config->getUserValue($uid, 'files', 'files_used', '0');
            return [
                'uid'              => $uid,
                'displayName'      => $user?->getDisplayName() ?? $uid,
                'allocated_bytes'  => (int) $row['allocated_bytes'],
                'used_bytes'       => $used,
                'updated_at'       => (int) $row['updated_at'],
            ];
        }, $rows);
    }

    // ── Request management ────────────────────────────────────────────────────

    public function createRequest(
        string $uid,
        int $currentBytes,
        int $requestedBytes,
        string $reason,
        string $storageType = 'general'
    ): string {
        if (!in_array($storageType, self::STORAGE_TYPES, true)) {
            throw new \InvalidArgumentException(
                'storage_type must be one of: ' . implode(', ', self::STORAGE_TYPES)
            );
        }

        $id  = bin2hex(random_bytes(16));
        $now = $this->timeFactory->getTime();

        $qb = $this->db->getQueryBuilder();
        $qb->insert('kz_quota_requests')
           ->values([
               'id'              => $qb->createNamedParameter($id),
               'requester_uid'   => $qb->createNamedParameter($uid),
               'current_bytes'   => $qb->createNamedParameter($currentBytes, IQueryBuilder::PARAM_INT),
               'requested_bytes' => $qb->createNamedParameter($requestedBytes, IQueryBuilder::PARAM_INT),
               'reason'          => $qb->createNamedParameter($reason),
               'storage_type'    => $qb->createNamedParameter($storageType),
               'status'          => $qb->createNamedParameter('pending'),
               'reviewer_uid'    => $qb->createNamedParameter(null, IQueryBuilder::PARAM_NULL),
               'created_at'      => $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT),
               'updated_at'      => $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT),
           ]);
        $qb->executeStatement();
        return $id;
    }

    /**
     * Returns requests visible to the caller:
     * - Admins see pending requests from their managed users.
     * - Regular users see their own requests.
     */
    public function getRequests(string $uid): array {
        $isAdmin = $this->groupManager->isAdmin($uid);

        $qb = $this->db->getQueryBuilder();
        $qb->select('*')->from('kz_quota_requests');

        if ($isAdmin) {
            // Super-admin sees everything
        } else {
            // Managed admin sees their users' requests
            $managedUids = array_column($this->getManagedUsers($uid), 'uid');
            if (empty($managedUids)) {
                // Regular user — own requests only
                $qb->where($qb->expr()->eq('requester_uid', $qb->createNamedParameter($uid)));
            } else {
                $managedUids[] = $uid;
                $qb->where($qb->expr()->in(
                    'requester_uid',
                    $qb->createNamedParameter($managedUids, IQueryBuilder::PARAM_STR_ARRAY)
                ));
            }
        }

        $qb->orderBy('created_at', 'DESC');
        $result = $qb->executeQuery();
        $rows   = $result->fetchAll();
        $result->closeCursor();
        return $rows;
    }

    /**
     * Admin approves or rejects a storage request.
     * On approval, the user's quota is immediately updated.
     */
    public function reviewRequest(string $reviewerUid, string $requestId, string $status): void {
        if (!in_array($status, ['approved', 'rejected'], true)) {
            throw new \InvalidArgumentException('Status must be approved or rejected.');
        }

        if (!$this->groupManager->isAdmin($reviewerUid)) {
            throw new \RuntimeException('Only an administrator can review storage requests.');
        }

        $request = $this->getRequestById($requestId);
        if ($request === null) {
            throw new \RuntimeException('Request not found.');
        }

        $now = $this->timeFactory->getTime();
        $qb  = $this->db->getQueryBuilder();
        $qb->update('kz_quota_requests')
           ->set('status',       $qb->createNamedParameter($status))
           ->set('reviewer_uid', $qb->createNamedParameter($reviewerUid))
           ->set('updated_at',   $qb->createNamedParameter($now, IQueryBuilder::PARAM_INT))
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($requestId)));
        $qb->executeStatement();

        if ($status === 'approved') {
            $this->allocate($reviewerUid, $request['requester_uid'], (int) $request['requested_bytes']);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * @return list<array{uid: string, displayName: string, allocated_bytes: int, used_bytes: int, updated_at: int}>
     */
    private function getAllUsersWithQuota(string $excludeUid): array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('grantee_uid', 'allocated_bytes', 'updated_at')
           ->from('kz_quota_alloc')
           ->orderBy('grantee_uid');

        $result = $qb->executeQuery();
        $rows   = $result->fetchAll();
        $result->closeCursor();

        $byUid = [];
        foreach ($rows as $row) {
            $byUid[$row['grantee_uid']] = $row;
        }

        $users = [];
        foreach ($this->userManager->search('') as $user) {
            $uid = $user->getUID();
            if ($uid === $excludeUid) {
                continue;
            }
            $row  = $byUid[$uid] ?? null;
            $used = (int) $this->config->getUserValue($uid, 'files', 'files_used', '0');
            $users[] = [
                'uid'             => $uid,
                'displayName'     => $user->getDisplayName(),
                'allocated_bytes' => $row !== null ? (int) $row['allocated_bytes'] : 0,
                'used_bytes'      => $used,
                'updated_at'      => $row !== null ? (int) $row['updated_at'] : 0,
            ];
        }

        return $users;
    }

    private function getGrantorOf(string $uid): ?string {
        $qb = $this->db->getQueryBuilder();
        $qb->select('grantor_uid')
           ->from('kz_quota_alloc')
           ->where($qb->expr()->eq('grantee_uid', $qb->createNamedParameter($uid)));
        $result = $qb->executeQuery();
        $row    = $result->fetchOne();
        return $row !== false ? (string) $row : null;
    }

    private function getRequestById(string $id): ?array {
        $qb = $this->db->getQueryBuilder();
        $qb->select('*')
           ->from('kz_quota_requests')
           ->where($qb->expr()->eq('id', $qb->createNamedParameter($id)));
        $result = $qb->executeQuery();
        $row    = $result->fetch();
        $result->closeCursor();
        return $row !== false ? $row : null;
    }

    /** Convert bytes to Nextcloud human-readable quota string (e.g. "10 GB"). */
    private function humanBytes(int $bytes): string {
        if ($bytes >= 1_099_511_627_776) {
            return round($bytes / 1_099_511_627_776, 2) . ' TB';
        }
        if ($bytes >= 1_073_741_824) {
            return round($bytes / 1_073_741_824, 2) . ' GB';
        }
        if ($bytes >= 1_048_576) {
            return round($bytes / 1_048_576, 2) . ' MB';
        }
        return $bytes . ' B';
    }
}
