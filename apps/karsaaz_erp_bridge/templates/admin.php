<?php
/** @var array $_ Template variables injected by AdminSettings::getForm() */
$tenants = $_['tenants'] ?? [];
?>
<div id="karsaaz-erp-bridge-admin" style="padding:20px;font-family:system-ui,sans-serif;max-width:900px">
  <h2 style="font-size:1.3rem;margin-bottom:4px">Karsaaz ERP Integration</h2>
  <p style="color:#666;margin-bottom:24px">
    Register external ERP systems, manage webhook connections, and monitor delivery health.
  </p>

  <!-- Register new tenant -->
  <section style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:28px">
    <h3 style="margin-bottom:14px;font-size:1rem">Register New ERP Tenant</h3>
    <form id="kerp-register-form" style="display:grid;gap:10px">
      <label>
        <span style="font-size:.85rem;color:#374151">Tenant Name</span>
        <input name="name" type="text" placeholder="My ERP System"
               style="display:block;width:100%;margin-top:4px;padding:7px 10px;border:1px solid #d1d5db;border-radius:6px">
      </label>
      <label>
        <span style="font-size:.85rem;color:#374151">Webhook URL (HTTPS)</span>
        <input name="webhook_url" type="url" placeholder="https://erp.example.com/webhooks/chat"
               style="display:block;width:100%;margin-top:4px;padding:7px 10px;border:1px solid #d1d5db;border-radius:6px">
      </label>
      <label>
        <span style="font-size:.85rem;color:#374151">ERP JWT Secret (min 32 chars)</span>
        <input name="erp_jwt_secret" type="password"
               style="display:block;width:100%;margin-top:4px;padding:7px 10px;border:1px solid #d1d5db;border-radius:6px">
      </label>
      <label>
        <span style="font-size:.85rem;color:#374151">Allowed Origins (one per line, scheme://host)</span>
        <textarea name="allowed_origins" rows="3" placeholder="https://erp.example.com"
                  style="display:block;width:100%;margin-top:4px;padding:7px 10px;border:1px solid #d1d5db;border-radius:6px"></textarea>
      </label>
      <button type="submit"
              style="background:#2B7FFF;color:#fff;border:none;border-radius:6px;padding:9px 20px;cursor:pointer;font-size:.9rem;width:max-content">
        Register
      </button>
    </form>
    <pre id="kerp-register-result" style="display:none;margin-top:14px;padding:12px;background:#f9fafb;border-radius:6px;font-size:.8rem;overflow:auto"></pre>
  </section>

  <!-- Tenant list -->
  <section>
    <h3 style="margin-bottom:14px;font-size:1rem">Registered Tenants (<?= count($tenants) ?>)</h3>

    <?php if (empty($tenants)): ?>
      <p style="color:#9ca3af;font-size:.9rem">No tenants registered yet.</p>
    <?php else: ?>
      <?php foreach ($tenants as $t): ?>
        <?php
        $statusColor = match($t['last_delivery_status']) {
            'delivered'  => '#16a34a',
            'failed'     => '#dc2626',
            'dead'       => '#7f1d1d',
            default      => '#9ca3af',
        };
        ?>
        <div class="kerp-tenant-card" data-tenant-id="<?= htmlspecialchars($t['tenant_id'], ENT_QUOTES) ?>"
             style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:14px;background:#fff">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <strong><?= htmlspecialchars($t['name'], ENT_QUOTES) ?></strong>
            <span style="font-size:.75rem;color:<?= $statusColor ?>;border:1px solid <?= $statusColor ?>;border-radius:99px;padding:2px 10px">
              <?= htmlspecialchars($t['last_delivery_status'], ENT_QUOTES) ?>
            </span>
          </div>

          <div style="font-size:.82rem;color:#6b7280;margin-bottom:10px">
            <div>ID: <code><?= htmlspecialchars($t['tenant_id'], ENT_QUOTES) ?></code></div>
            <div>Webhook: <code><?= htmlspecialchars($t['webhook_url'], ENT_QUOTES) ?></code></div>
            <div>Origins: <?= htmlspecialchars(implode(', ', $t['allowed_origins']), ENT_QUOTES) ?></div>
            <div>Registered: <?= date('Y-m-d H:i', (int)$t['created_at']) ?> UTC</div>
          </div>

          <!-- Embed snippet -->
          <details style="margin-bottom:10px">
            <summary style="cursor:pointer;font-size:.83rem;color:#2B7FFF">Show embed snippet</summary>
            <pre style="margin-top:8px;padding:10px;background:#f9fafb;border-radius:6px;font-size:.75rem;overflow:auto;white-space:pre-wrap">&lt;script src="<?= htmlspecialchars(
                \OC::$server->getURLGenerator()->getBaseUrl()
                . '/apps/karsaaz_erp_bridge/js/loader.js', ENT_QUOTES)
            ?>"
        data-api-key="YOUR_API_KEY"
        data-tenant-id="<?= htmlspecialchars($t['tenant_id'], ENT_QUOTES) ?>"
        data-room="ROOM_TOKEN"
        data-token="ERP_JWT_FOR_CURRENT_USER"&gt;
&lt;/script&gt;</pre>
          </details>

          <!-- Action buttons -->
          <div style="display:flex;gap:8px">
            <button onclick="kerpTestWebhook('<?= htmlspecialchars($t['tenant_id'], ENT_QUOTES) ?>')"
                    style="font-size:.8rem;padding:5px 12px;border:1px solid #d1d5db;border-radius:5px;background:#fff;cursor:pointer">
              Test Webhook
            </button>
            <button onclick="kerpViewLogs('<?= htmlspecialchars($t['tenant_id'], ENT_QUOTES) ?>')"
                    style="font-size:.8rem;padding:5px 12px;border:1px solid #d1d5db;border-radius:5px;background:#fff;cursor:pointer">
              View Logs (<?= (int)$t['log_count'] ?>)
            </button>
            <button onclick="kerpRevoke('<?= htmlspecialchars($t['tenant_id'], ENT_QUOTES) ?>','<?= htmlspecialchars($t['name'], ENT_QUOTES) ?>')"
                    style="font-size:.8rem;padding:5px 12px;border:1px solid #fca5a5;color:#dc2626;border-radius:5px;background:#fff;cursor:pointer">
              Revoke
            </button>
          </div>

          <!-- Log panel (hidden by default) -->
          <div id="kerp-logs-<?= htmlspecialchars($t['tenant_id'], ENT_QUOTES) ?>"
               style="display:none;margin-top:12px"></div>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </section>
</div>

<script>
(function () {
  var BASE = <?= json_encode(\OC::$server->getURLGenerator()->getBaseUrl()) ?>;
  var OCS  = BASE + '/ocs/v2.php/apps/karsaaz_erp_bridge/api/v1';

  // ── Register form ──────────────────────────────────────────────────────────
  document.getElementById('kerp-register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var origins = (fd.get('allowed_origins') || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    fetch(OCS + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'OCS-APIRequest': 'true' },
      body: JSON.stringify({
        name: fd.get('name'),
        webhook_url: fd.get('webhook_url'),
        erp_jwt_secret: fd.get('erp_jwt_secret'),
        allowed_origins: origins,
      }),
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var result = document.getElementById('kerp-register-result');
      result.style.display = 'block';
      result.textContent = JSON.stringify(data.ocs && data.ocs.data || data, null, 2);
      e.target.reset();
    })
    .catch(function (err) { alert('Error: ' + err.message); });
  });

  // ── Test Webhook ───────────────────────────────────────────────────────────
  window.kerpTestWebhook = function (tenantId) {
    var apiKey = prompt('Enter your API key for this tenant:');
    if (!apiKey) return;
    fetch(OCS + '/webhook/test', {
      method: 'POST',
      headers: { 'OCS-APIRequest': 'true', 'X-ERP-API-Key': apiKey },
    })
    .then(function (r) { return r.json(); })
    .then(function (d) { alert(JSON.stringify(d.ocs && d.ocs.data || d, null, 2)); })
    .catch(function (err) { alert('Error: ' + err.message); });
  };

  // ── View Logs ──────────────────────────────────────────────────────────────
  window.kerpViewLogs = function (tenantId) {
    var panel = document.getElementById('kerp-logs-' + tenantId);
    if (panel.style.display !== 'none') { panel.style.display = 'none'; return; }
    panel.innerHTML = '<em style="font-size:.8rem;color:#9ca3af">Loading…</em>';
    panel.style.display = 'block';
    fetch(OCS + '/admin/logs?tenant_id=' + encodeURIComponent(tenantId) + '&limit=20', {
      headers: { 'OCS-APIRequest': 'true' },
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var rows = (d.ocs && d.ocs.data) || [];
      if (!rows.length) { panel.innerHTML = '<em style="font-size:.8rem;color:#9ca3af">No delivery events yet.</em>'; return; }
      var html = '<table style="width:100%;font-size:.78rem;border-collapse:collapse;margin-top:4px">'
        + '<tr style="text-align:left;border-bottom:1px solid #e5e7eb">'
        + '<th style="padding:4px 8px">Event</th><th>Status</th><th>Attempts</th><th>Last Attempt</th></tr>';
      rows.forEach(function (r) {
        var color = r.status === 'delivered' ? '#16a34a' : r.status === 'dead' ? '#7f1d1d' : '#dc2626';
        html += '<tr style="border-bottom:1px solid #f3f4f6">'
          + '<td style="padding:4px 8px">' + r.event_type + '</td>'
          + '<td style="color:' + color + '">' + r.status + '</td>'
          + '<td>' + r.attempt_count + '</td>'
          + '<td>' + new Date(r.last_attempt_at * 1000).toLocaleString() + '</td>'
          + '</tr>';
      });
      panel.innerHTML = html + '</table>';
    });
  };

  // ── Revoke ─────────────────────────────────────────────────────────────────
  window.kerpRevoke = function (tenantId, name) {
    if (!confirm('Revoke tenant "' + name + '"?\n\nThis removes the API key and webhook registration. NC users created for this tenant are kept.')) return;
    fetch(OCS + '/admin/tenants/' + encodeURIComponent(tenantId), {
      method: 'DELETE',
      headers: { 'OCS-APIRequest': 'true' },
    })
    .then(function (r) { return r.json(); })
    .then(function () {
      var card = document.querySelector('[data-tenant-id="' + tenantId + '"]');
      if (card) card.remove();
    })
    .catch(function (err) { alert('Error: ' + err.message); });
  };
}());
</script>
