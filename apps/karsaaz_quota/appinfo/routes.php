<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

return [
    'ocs' => [
        // Pool info for the calling admin/super-admin
        ['name' => 'Quota#getPool',       'url' => '/api/v1/pool',               'verb' => 'GET'],
        // List users managed by the calling admin + their quotas
        ['name' => 'Quota#getUsers',      'url' => '/api/v1/users',              'verb' => 'GET'],
        // Set a specific user's allocated quota (admin only)
        ['name' => 'Quota#allocate',      'url' => '/api/v1/allocate/{uid}',     'verb' => 'PUT'],
        // Storage increase requests
        ['name' => 'Quota#getRequests',   'url' => '/api/v1/requests',           'verb' => 'GET'],
        ['name' => 'Quota#createRequest', 'url' => '/api/v1/requests',           'verb' => 'POST'],
        // Admin approves or rejects a request
        ['name' => 'Quota#reviewRequest', 'url' => '/api/v1/requests/{id}',      'verb' => 'PUT'],
    ],
];
