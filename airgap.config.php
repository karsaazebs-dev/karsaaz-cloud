<?php
/**
 * Lockdown overlay for local sandbox.
 *
 * Effect: this Karsaaz Cloud instance will not initiate ANY outbound connection to
 * Nextcloud-owned servers or third-party services EXCEPT:
 *   - update checker (read-only security update banner)
 *   - knowledge base (in-app help links)
 *
 * App store is disabled by default. To install apps temporarily,
 * flip 'appstoreenabled' to true, install via occ, then flip back.
 */
$CONFIG = [
    // ── HARD AIRGAP — zero outbound to Nextcloud GmbH ──
    // Master switch OFF: nothing phones home, ever.
    // We manage updates manually via `docker compose pull`.
    // Flip to true ONLY when installing apps from appstore, then flip back.
    'has_internet_connection'       => false,

    // Update checker disabled — auto-update pings are disabled (we manage updates manually via `docker compose pull`).
    'updatechecker'                 => false,

    // Knowledge base disabled — help button pings are disabled (self-hosted, no external doc calls).
    'knowledgebaseenabled'          => false,

    // App store stays OFF — flip on temporarily to install apps, then flip back.
    'appstoreenabled'               => false,

    // Karsaaz custom theme — overrides all upstream UI strings with Karsaaz branding.
    'theme'                         => 'karsaaz',

    // Hard-locked phone-home features (privacy / SSRF risk).
    'lookup_server'                 => '',
    'gs.enabled'                    => false,
    'gs.federation'                 => 'internal',
    'reference_opengraph'           => false,
    'connectivity_check_domains'    => [],
    'simpleSignUpLink.shown'        => false,
    'check_for_working_wellknown_setup' => false,

    // CRITICAL SSRF guard — never enable.
    'allow_local_remote_servers'    => false,

    // ── Karsaaz branding overrides ─────────────────────────────────
    'productName'                   => 'Karsaaz Cloud',
    'defaultapp'                    => 'dashboard,files',
    'default_language'              => 'en',
    'default_locale'                => 'en_US',
    'default_timezone'              => 'Asia/Karachi',
    'default_phone_region'          => 'PK',
    
    // ── Trusted domains (allow clients from these IPs) ──
    'trusted_domains'               => [
        0 => 'localhost',
        1 => '192.168.18.97',          // ← CORRECT PC IP
        2 => '192.168.18.61',          // ← (kept for reference, unused)
        3 => '127.0.0.1',
    ],
    
    'mail_from_address'             => 'tameem.karsaaz',
    'mail_domain'                   => 'gmail.com',

    // ── SMTP via Gmail (real delivery) ──
    'mail_smtpmode'                 => 'smtp',
    'mail_sendmailmode'             => 'smtp',
    'mail_smtphost'                 => 'smtp.gmail.com',
    'mail_smtpport'                 => 587,
    'mail_smtpsecure'               => 'tls',
    'mail_smtpauth'                 => true,
    'mail_smtpauthtype'             => 'LOGIN',
    'mail_smtpname'                 => 'tameem.karsaaz@gmail.com',
    'mail_smtppassword'             => 'yebfbcookpiiijar',
    'mail_smtptimeout'              => 30,
];
