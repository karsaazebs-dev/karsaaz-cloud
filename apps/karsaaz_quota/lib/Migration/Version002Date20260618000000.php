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

class Version002Date20260618000000 extends SimpleMigrationStep {
    public function changeSchema(IOutput $output, Closure $schemaClosure, array $options): ?ISchemaWrapper {
        /** @var ISchemaWrapper $schema */
        $schema = $schemaClosure();

        if ($schema->hasTable('kz_quota_requests')) {
            $table = $schema->getTable('kz_quota_requests');
            if (!$table->hasColumn('storage_type')) {
                $table->addColumn('storage_type', Types::STRING, [
                    'notnull' => true,
                    'length'  => 32,
                    'default' => 'general',
                ]);
            }
        }

        return $schema;
    }
}
