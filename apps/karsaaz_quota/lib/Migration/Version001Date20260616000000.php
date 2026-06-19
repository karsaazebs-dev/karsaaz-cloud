<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazQuota\Migration;

use Closure;
use OCP\DB\ISchemaWrapper;
use OCP\DB\Types;
use OCP\Migration\IOutput;
use OCP\Migration\SimpleMigrationStep;

class Version001Date20260616000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        // ── Quota allocations ─────────────────────────────────────────────────
        // Stores how many bytes each user/admin was given by their parent admin.
        if (!$schema->hasTable('kz_quota_alloc')) {
            $table = $schema->createTable('kz_quota_alloc');
            $table->addColumn('id', Types::BIGINT, [
                'autoincrement' => true,
                'notnull'       => true,
            ]);
            $table->addColumn('grantee_uid', Types::STRING, [
                'notnull' => true,
                'length'  => 64,
            ]);
            $table->addColumn('grantor_uid', Types::STRING, [
                'notnull' => true,
                'length'  => 64,
                'default' => 'system',
            ]);
            $table->addColumn('allocated_bytes', Types::BIGINT, [
                'notnull' => true,
                'default' => 0,
            ]);
            $table->addColumn('created_at', Types::BIGINT, [
                'notnull' => true,
                'default' => 0,
            ]);
            $table->addColumn('updated_at', Types::BIGINT, [
                'notnull' => true,
                'default' => 0,
            ]);
            $table->setPrimaryKey(['id']);
            $table->addUniqueIndex(['grantee_uid'], 'kz_quota_grantee_uniq');
            $table->addIndex(['grantor_uid'], 'kz_quota_grantor_idx');
        }

        // ── Storage increase requests ─────────────────────────────────────────
        if (!$schema->hasTable('kz_quota_requests')) {
            $table = $schema->createTable('kz_quota_requests');
            $table->addColumn('id', Types::STRING, [
                'notnull' => true,
                'length'  => 64,
            ]);
            $table->addColumn('requester_uid', Types::STRING, [
                'notnull' => true,
                'length'  => 64,
            ]);
            $table->addColumn('current_bytes', Types::BIGINT, [
                'notnull' => true,
                'default' => 0,
            ]);
            $table->addColumn('requested_bytes', Types::BIGINT, [
                'notnull' => true,
                'default' => 0,
            ]);
            $table->addColumn('reason', Types::TEXT, [
                'notnull' => false,
                'default' => null,
            ]);
            $table->addColumn('status', Types::STRING, [
                'notnull' => true,
                'length'  => 20,
                'default' => 'pending',
            ]);
            $table->addColumn('reviewer_uid', Types::STRING, [
                'notnull' => false,
                'length'  => 64,
                'default' => null,
            ]);
            $table->addColumn('created_at', Types::BIGINT, [
                'notnull' => true,
                'default' => 0,
            ]);
            $table->addColumn('updated_at', Types::BIGINT, [
                'notnull' => true,
                'default' => 0,
            ]);
            $table->setPrimaryKey(['id']);
            $table->addIndex(['requester_uid'], 'kz_qreq_uid_idx');
            $table->addIndex(['status'],        'kz_qreq_status_idx');
        }

        return $schema;
    }
}
