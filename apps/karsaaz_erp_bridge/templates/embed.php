<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Karsaaz Chat</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; width: 100%; overflow: hidden; background: #fff; }
  #chat-frame { width: 100%; height: 100%; border: none; }
  #loading {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    font-family: system-ui, sans-serif; color: #555;
  }
  #loading .spinner {
    width: 32px; height: 32px; border: 3px solid #e5e5e5;
    border-top-color: #2B7FFF; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>

<?php if ($_['mode'] === 'auto-login'): ?>
<!-- Auto-login mode: post credentials to NC login, then redirect to Talk -->
<div id="loading">
  <div class="spinner"></div>
  <span>Connecting to chat…</span>
</div>

<form id="login-form" method="POST"
      action="<?= htmlspecialchars($_['nc_base_url'], ENT_QUOTES) ?>/index.php/login"
      style="display:none">
  <input type="hidden" name="user"
         value="<?= htmlspecialchars($_['nc_username'], ENT_QUOTES) ?>">
  <input type="hidden" name="password"
         value="<?= htmlspecialchars($_['nc_password'], ENT_QUOTES) ?>">
  <input type="hidden" name="redirect_url"
         value="<?= htmlspecialchars($_['talk_url'], ENT_QUOTES) ?>">
</form>

<script>
  // Submit login form immediately — browser stores session cookie
  document.getElementById('login-form').submit();
</script>

<?php else: ?>
<!-- postMessage mode: wait for parent to send auth token -->
<div id="loading">
  <div class="spinner"></div>
  <span>Waiting for authentication…</span>
</div>
<iframe id="chat-frame" style="display:none" title="Karsaaz Chat"></iframe>

<script>
(function () {
  var TENANT_ID = <?= json_encode($_['tenant_id'] ?? '') ?>;
  var ROOM      = <?= json_encode($_['room'] ?? '') ?>;
  var BASE_URL  = <?= json_encode($_['nc_base_url'] ?? '') ?>;

  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'karsaaz:auth') return;
    var token = e.data.token;
    if (!token) return;

    // Exchange the ERP JWT for NC credentials via the auth endpoint
    fetch(BASE_URL + '/ocs/v2.php/apps/karsaaz_erp_bridge/api/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OCS-APIRequest': 'true',
        'X-ERP-API-Key': e.data.apiKey || '',
      },
      body: JSON.stringify({ erp_jwt: token, tenant_id: TENANT_ID }),
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var creds = data.ocs && data.ocs.data;
      if (!creds || !creds.nc_username) throw new Error('auth failed');
      return loginAndLoad(creds);
    })
    .catch(function (err) {
      document.getElementById('loading').querySelector('span').textContent =
        'Authentication failed: ' + err.message;
    });
  }, false);

  function loginAndLoad(creds) {
    // Create a temporary form to post login, then redirect to Talk
    var form = document.createElement('form');
    form.method = 'POST';
    form.action = creds.nc_base_url + '/index.php/login';
    var fields = {
      user: creds.nc_username,
      password: creds.nc_password,
      redirect_url: ROOM
        ? creds.nc_base_url + '/call/' + encodeURIComponent(ROOM)
        : creds.nc_base_url + '/apps/spreed/',
    };
    Object.keys(fields).forEach(function (k) {
      var i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = fields[k];
      form.appendChild(i);
    });
    document.body.appendChild(form);
    form.submit();
  }

  // Notify parent frame that we're ready for tokens
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'karsaaz:ready' }, '*');
  }
}());
</script>
<?php endif; ?>

</body>
</html>
