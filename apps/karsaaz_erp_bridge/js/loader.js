/**
 * Karsaaz Chat Embed Loader
 * Drop this script tag into any ERP page:
 *
 *   <script src="https://your-karsaaz.cloud/apps/karsaaz_erp_bridge/js/loader.js"
 *           data-api-key="YOUR_API_KEY"
 *           data-tenant-id="YOUR_TENANT_ID"
 *           data-room="ROOM_TOKEN"
 *           data-token="ERP_JWT_FOR_CURRENT_USER"
 *           data-container="#chat-widget">
 *   </script>
 *
 * After the script runs, KarsaazChat is available on window.
 *
 * API:
 *   KarsaazChat.open()           — show the chat panel
 *   KarsaazChat.close()          — hide the chat panel
 *   KarsaazChat.on('message', cb) — called when a message arrives (via postMessage from iframe)
 *   KarsaazChat.off('message', cb)
 */
(function (global) {
  'use strict';

  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  }());

  var config = {
    apiKey:    currentScript.getAttribute('data-api-key')    || '',
    tenantId:  currentScript.getAttribute('data-tenant-id') || '',
    room:      currentScript.getAttribute('data-room')       || '',
    token:     currentScript.getAttribute('data-token')      || '',
    container: currentScript.getAttribute('data-container')  || null,
    baseUrl: (function () {
      var src = currentScript.src || '';
      var m   = src.match(/^(https?:\/\/[^/]+)/);
      return m ? m[1] : '';
    }()),
  };

  var listeners = {};
  var iframe    = null;
  var panel     = null;

  function buildEmbedUrl() {
    var url = config.baseUrl + '/apps/karsaaz_erp_bridge/embed'
      + '?tenant=' + encodeURIComponent(config.tenantId)
      + '&room='   + encodeURIComponent(config.room);
    if (config.token) {
      url += '&token=' + encodeURIComponent(config.token);
    }
    return url;
  }

  function createPanel() {
    var target = config.container ? document.querySelector(config.container) : null;

    if (!target) {
      // Floating panel in bottom-right corner
      panel = document.createElement('div');
      panel.id    = 'karsaaz-chat-panel';
      panel.style.cssText = [
        'position:fixed', 'bottom:0', 'right:24px', 'width:400px', 'height:600px',
        'z-index:2147483647', 'box-shadow:0 4px 24px rgba(0,0,0,0.18)',
        'border-radius:16px 16px 0 0', 'overflow:hidden', 'display:none',
      ].join(';');
      document.body.appendChild(panel);
    } else {
      panel = target;
    }

    iframe = document.createElement('iframe');
    iframe.src             = buildEmbedUrl();
    iframe.title           = 'Karsaaz Chat';
    iframe.allowFullscreen = true;
    iframe.style.cssText   = 'width:100%;height:100%;border:none;';
    panel.appendChild(iframe);

    // Handshake: send token via postMessage once iframe reports ready
    window.addEventListener('message', function (e) {
      if (!iframe.contentWindow || e.source !== iframe.contentWindow) return;

      if (e.data && e.data.type === 'karsaaz:ready' && config.token) {
        iframe.contentWindow.postMessage({
          type:   'karsaaz:auth',
          token:  config.token,
          apiKey: config.apiKey,
        }, config.baseUrl);
      }

      if (e.data && e.data.type === 'karsaaz:message') {
        emit('message', e.data.payload);
      }
    }, false);
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(function (cb) {
      try { cb(data); } catch (_) {}
    });
  }

  var KarsaazChat = {
    open: function () {
      if (!panel) createPanel();
      panel.style.display = 'block';
    },
    close: function () {
      if (panel) panel.style.display = 'none';
    },
    on: function (event, cb) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
      return KarsaazChat;
    },
    off: function (event, cb) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(function (f) { return f !== cb; });
      }
      return KarsaazChat;
    },
  };

  // Auto-init if container specified
  if (config.container || config.token) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { KarsaazChat.open(); });
    } else {
      KarsaazChat.open();
    }
  }

  global.KarsaazChat = KarsaazChat;
}(window));
