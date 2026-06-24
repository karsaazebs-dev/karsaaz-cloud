<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version001Date20260624000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── Registered ERP tenants ────────────────────────────────────────────
        if (!$schema->hasTable('kerp_tenants')) {
            $t = $schema->createTable('kerp_tenants');
            $t->addColumn('tenant_id', Types::STRING, ['notnull' => true, 'length' => 36]);
            $t->addColumn('name', Types::STRING, ['notnull' => true, 'length' => 255]);
            $t->addColumn('api_key_hash', Types::STRING, ['notnull' => true, 'length' => 64]);
            $t->addColumn('hmac_secret', Types::STRING, ['notnull' => true, 'length' => 64]);
            $t->addColumn('webhook_url', Types::TEXT, ['notnull' => true]);
            // erp_jwt_secret is AES-256-GCM encrypted; stored as base64 blob
            $t->addColumn('erp_jwt_secret_enc', Types::TEXT, ['notnull' => true]);
            // JSON array of allowed CORS origins e.g. ["https://erp.example.com"]
            $t->addColumn('allowed_origins', Types::TEXT, ['notnull' => true, 'default' => '[]']);
            // Optional external DB credentials (AES-256-GCM encrypted)
            $t->addColumn('ext_db_dsn_enc', Types::TEXT, ['notnull' => false, 'default' => null]);
            $t->addColumn('ext_db_user_enc', Types::TEXT, ['notnull' => false, 'default' => null]);
            $t->addColumn('ext_db_pass_enc', Types::TEXT, ['notnull' => false, 'default' => null]);
            $t->addColumn('created_at', Types::BIGINT, ['notnull' => true, 'default' => 0]);
            $t->setPrimaryKey(['tenant_id']);
            $t->addUniqueIndex(['api_key_hash'], 'kerp_tenant_key_uniq');
            $t->addIndex(['name'], 'kerp_tenant_name_idx');
        }

        // ── ERP user → NC user mapping ────────────────────────────────────────
        if (!$schema->hasTable('kerp_user_map')) {
            $t = $schema->createTable('kerp_user_map');
            $t->addColumn('id', Types::BIGINT, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('tenant_id', Types::STRING, ['notnull' => true, 'length' => 36]);
            $t->addColumn('erp_user_id', Types::STRING, ['notnull' => true, 'length' => 255]);
            $t->addColumn('nc_uid', Types::STRING, ['notnull' => true, 'length' => 64]);
            $t->addColumn('created_at', Types::BIGINT, ['notnull' => true, 'default' => 0]);
            $t->setPrimaryKey(['id']);
            $t->addUniqueIndex(['tenant_id', 'erp_user_id'], 'kerp_umap_tenant_user_uniq');
            $t->addIndex(['nc_uid'], 'kerp_umap_nc_uid_idx');
        }

        // ── Webhook delivery log ──────────────────────────────────────────────
        if (!$schema->hasTable('kerp_webhook_log')) {
            $t = $schema->createTable('kerp_webhook_log');
            $t->addColumn('id', Types::BIGINT, ['autoincrement' => true, 'notnull' => true]);
            $t->addColumn('tenant_id', Types::STRING, ['notnull' => true, 'length' => 36]);
            $t->addColumn('event_type', Types::STRING, ['notnull' => true, 'length' => 64]);
            $t->addColumn('payload_hash', Types::STRING, ['notnull' => true, 'length' => 64]);
            // delivered | failed | dead
            $t->addColumn('status', Types::STRING, ['notnull' => true, 'length' => 16, 'default' => 'failed']);
            $t->addColumn('attempt_count', Types::SMALLINT, ['notnull' => true, 'default' => 0]);
            $t->addColumn('last_attempt_at', Types::BIGINT, ['notnull' => true, 'default' => 0]);
            // Stores serialized payload for retry
            $t->addColumn('payload', Types::TEXT, ['notnull' => false, 'default' => null]);
            $t->setPrimaryKey(['id']);
            $t->addIndex(['tenant_id'], 'kerp_wlog_tenant_idx');
            $t->addIndex(['status'], 'kerp_wlog_status_idx');
            $t->addIndex(['last_attempt_at'], 'kerp_wlog_attempt_idx');
        }

        return $schema;
    }
}
