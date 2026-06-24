<?php

$CONFIG = [
    'has_internet_connection'       => false,
    'updatechecker'                 => false,
    'knowledgebaseenabled'          => false,
    'appstoreenabled'               => false,
    'theme'                         => 'karsaaz',
    'reference_opengraph'           => false,
    'connectivity_check_domains'    => [],
    'allow_local_remote_servers'    => true,
    'productName'                   => 'Karsaaz Cloud',
    'defaultapp'                    => 'dashboard,files',
    'default_language'              => 'en',
    'default_locale'                => 'en_US',
    'default_timezone'              => 'Asia/Karachi',
    'default_phone_region'          => 'PK',
    'trusted_domains'               => [
        0 => 'localhost',
        1 => '192.168.18.97',
        2 => '192.168.18.61',
        3 => '127.0.0.1',
        4 => '192.168.100.25',
        5 => '192.168.18.118',
        6 => '0.0.0.0',
        7 => '192.168.18.78',
    ],
    
    // Self-hosted SMTP relay — mailpit catches all outgoing mail and shows it
    // at http://localhost:8025. No external relay; works fully airgapped.
    'mail_from_address'             => 'karsaaz',
    'mail_domain'                   => 'karsaaz.local',
    'mail_smtpmode'                 => 'smtp',
    'mail_sendmailmode'             => 'smtp',
    'mail_smtphost'                 => 'mailpit',
    'mail_smtpport'                 => 1025,
    'mail_smtpsecure'               => '',
    'mail_smtpauth'                 => false,
    'mail_smtptimeout'              => 10,
];
