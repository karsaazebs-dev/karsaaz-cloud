<?php
/**
 * Karsaaz Cloud override — shown when someone reaches the server through
 * a hostname that isn't in trusted_domains. Replaces the upstream version
 * which mentions Nextcloud by name (replaced by this Karsaaz-branded version).
 */
/** @var array $_ */
?>
<div class="error">
    <h2><?php p($l->t('Access through untrusted domain')); ?></h2>
    <p>
        <?php p($l->t('Please contact your Karsaaz Cloud administrator. If you are an administrator, edit the "trusted_domains" setting in config/config.php to allow access from this address.')); ?>
    </p>
    <p>
        <?php p($l->t('Further information on how to configure this can be found in the Karsaaz Cloud documentation.')); ?>
    </p>
</div>
