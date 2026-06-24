<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

return [
    'ocs' => [
        // ── Tenant registration (no auth required) ────────────────────────────
        ['name' => 'Api#register',      'url' => '/api/v1/register',          'verb' => 'POST'],

        // ── Tenant management (X-ERP-API-Key required) ────────────────────────
        ['name' => 'Api#revoke',        'url' => '/api/v1/revoke',            'verb' => 'DELETE'],
        ['name' => 'Api#webhookTest',   'url' => '/api/v1/webhook/test',      'verb' => 'POST'],

        // ── Auth bridge (X-ERP-API-Key required) ─────────────────────────────
        ['name' => 'Auth#token',        'url' => '/api/v1/auth/token',        'verb' => 'POST'],

        // ── Admin (NC admin only) ─────────────────────────────────────────────
        ['name' => 'Admin#listTenants', 'url' => '/api/v1/admin/tenants',     'verb' => 'GET'],
        ['name' => 'Admin#getLogs',     'url' => '/api/v1/admin/logs',        'verb' => 'GET'],
        ['name' => 'Admin#testDb',      'url' => '/api/v1/admin/db/test',     'verb' => 'POST'],
        ['name' => 'Admin#revokeTenant','url' => '/api/v1/admin/tenants/{id}','verb' => 'DELETE'],
    ],
    'routes' => [
        // ── Embeddable chat page (JWT via query param) ────────────────────────
        ['name' => 'Embed#show',        'url' => '/embed',                    'verb' => 'GET'],
        ['name' => 'Embed#assets',      'url' => '/js/{file}',                'verb' => 'GET'],
    ],
];
