<?php
/**
 * Karsaaz Cloud — full brand override.
 *
 * This class extends the base server Defaults and overrides every
 * user-visible string the upstream code uses. Lives in /themes/karsaaz/
 * which is the OFFICIAL upgrade-safe override mechanism — survives
 * every `occ upgrade` and never modifies core code.
 *
 * Activated by `'theme' => 'karsaaz'` in config.php.
 */
class OC_Theme {

    /** Used in browser tab title and many UI labels. */
    public function getName() {
        return 'Karsaaz Cloud';
    }

    /** Short identifier used in HTML data attributes. */
    public function getHTMLName() {
        return 'Karsaaz Cloud';
    }

    /** Used in window.location titles, breadcrumbs, mobile app handshake. */
    public function getTitle() {
        return 'Karsaaz Cloud';
    }

    /** Used in copyright footers, legal pages. */
    public function getEntity() {
        return 'Karsaaz';
    }

    /** Returned by status.php — visible to federation peers and OCS clients. */
    public function getProductName() {
        return 'Karsaaz Cloud';
    }

    /** Strapline shown on login page and PWA install prompt. */
    public function getSlogan() {
        return 'Your private, secure ERP cloud';
    }

    /** Hyperlink target on the login page logo. */
    public function getBaseUrl() {
        return 'https://karsaaz.com';
    }

    /** Imprint / legal page link. */
    public function getImprintUrl() {
        return 'https://karsaaz.com/legal';
    }

    /** Privacy policy link. */
    public function getPrivacyUrl() {
        return 'https://karsaaz.com/privacy';
    }

    /** Default Karsaaz brand color (navy). */
    public function getColorPrimary() {
        return '#1e3a8a';
    }

    /** Documentation site link (replaces the upstream docs URL). */
    public function getDocBaseUrl() {
        return 'https://karsaaz.com/docs';
    }

    /** Mobile app store entries. Empty arrays hide them in admin/personal pages. */
    public function getiOSClientUrl() {
        return '';
    }

    public function getiTunesAppId() {
        return '';
    }

    public function getAndroidClientUrl() {
        return '';
    }

    public function getFDroidClientUrl() {
        return '';
    }

    /** Footer text shown on every page. */
    public function getShortFooter() {
        return '<a href="https://karsaaz.com" target="_blank" rel="noreferrer noopener">Karsaaz Cloud</a> — Your private, secure ERP cloud · '
            . '<a href="https://karsaaz.com/legal" target="_blank" rel="noreferrer noopener">Legal</a> · '
            . '<a href="https://karsaaz.com/privacy" target="_blank" rel="noreferrer noopener">Privacy</a>';
    }

    public function getLongFooter() {
        return $this->getShortFooter();
    }

    /** Synced-folder default name on desktop client. */
    public function getDefaultClientName() {
        return 'Karsaaz Cloud';
    }

    /** Used by some plugins for sender display. */
    public function getMailHeaderColor() {
        return '#1e3a8a';
    }
}
