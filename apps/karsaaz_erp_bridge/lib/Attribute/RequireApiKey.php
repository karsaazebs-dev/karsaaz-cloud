<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Attribute;

use Attribute;

/** Apply to controller methods that require a valid X-ERP-API-Key header. */
#[Attribute(Attribute::TARGET_METHOD)]
class RequireApiKey {
}
