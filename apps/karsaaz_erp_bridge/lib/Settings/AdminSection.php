<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Karsaaz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\KarsaazErpBridge\Settings;

use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Settings\IIconSection;

class AdminSection implements IIconSection {
    public function __construct(
        private readonly IL10N         $l,
        private readonly IURLGenerator $url,
    ) {
    }

    public function getID(): string    { return 'karsaaz_erp_bridge'; }
    public function getName(): string  { return $this->l->t('ERP Integration'); }
    public function getPriority(): int { return 75; }
    public function getIcon(): string  {
        return $this->url->imagePath('karsaaz_erp_bridge', 'app.svg');
    }
}
