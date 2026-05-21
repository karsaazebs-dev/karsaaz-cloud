// Backend alignment smoke-test. Hits the live Karsaaz Cloud server directly with
// Basic auth and verifies every endpoint the React app depends on, including the
// ones added recently. Run:
//
//   KARSAAZ_TEST_USER=alice KARSAAZ_TEST_PASS=secret node tests/smoke-backend.mjs
//
// Optional: KARSAAZ_BACKEND_URL (default http://localhost:3030),
//           KARSAAZ_TEST_FILEID (a fileId to test reminders/comments),
//           KARSAAZ_TEST_SHARE_TOKEN (a public share token).

const BASE = process.env.KARSAAZ_BACKEND_URL || "http://localhost:3030";
const USER = process.env.KARSAAZ_TEST_USER;
const PASS = process.env.KARSAAZ_TEST_PASS;
const FILEID = process.env.KARSAAZ_TEST_FILEID;
const SHARE_TOKEN = process.env.KARSAAZ_TEST_SHARE_TOKEN;

if (!USER || !PASS) {
  console.error("Set KARSAAZ_TEST_USER and KARSAAZ_TEST_PASS env vars.");
  process.exit(2);
}

const AUTH = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");
const ocsHeaders = { Authorization: AUTH, "OCS-APIREQUEST": "true", Accept: "application/json" };

let pass = 0, fail = 0;
const results = [];

function ok(name, detail) { pass++; results.push(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`); }
function bad(name, detail) { fail++; results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }

async function jsonOcs(name, path, { method = "GET", body, headers } = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...ocsHeaders, ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    return { res, data, text };
  } catch (e) {
    bad(name, `request error: ${e.message}`);
    return { res: null, data: null, text: "" };
  }
}

async function expectOcs(name, path, validate) {
  const { res, data } = await jsonOcs(name, path);
  if (!res) return;
  if (!res.ok) return bad(name, `HTTP ${res.status}`);
  const d = data?.ocs?.data;
  if (d === undefined) return bad(name, "missing ocs.data envelope");
  try {
    const msg = validate ? validate(d) : "ok";
    ok(name, msg);
  } catch (e) {
    bad(name, e.message);
  }
}

async function fetchInitialState(name, page, id) {
  try {
    const res = await fetch(`${BASE}${page}`, { headers: { Authorization: AUTH } });
    if (!res.ok) return bad(name, `page HTTP ${res.status}`);
    const html = await res.text();
    const m = html.match(new RegExp(`id="initial-state-${id}"\\s+value="([^"]*)"`));
    if (!m) return bad(name, `initial-state-${id} not found on page`);
    let json;
    try { json = JSON.parse(Buffer.from(m[1], "base64").toString("utf8")); }
    catch { return bad(name, "value not base64-json"); }
    ok(name, Array.isArray(json) ? `${json.length} item(s)` : `keys: ${Object.keys(json).join(",")}`);
    return json;
  } catch (e) {
    bad(name, e.message);
  }
}

async function main() {
  console.log(`\nKarsaaz backend smoke-test → ${BASE} as ${USER}\n`);

  // 1. status
  {
    const res = await fetch(`${BASE}/status.php`);
    const d = await res.json();
    d?.productname ? ok("status.php", `${d.productname} ${d.versionstring}`) : bad("status.php");
  }

  // 2. current user
  await expectOcs("OCS cloud/user", "/ocs/v2.php/cloud/user?format=json", (d) => `id=${d.id}`);

  // 3. capabilities
  await expectOcs("OCS capabilities", "/ocs/v2.php/cloud/capabilities?format=json", (d) => `v=${d?.version?.string}`);

  // 4. user_status
  await expectOcs("user_status get", "/ocs/v2.php/apps/user_status/api/v1/user_status?format=json",
    (d) => { if (!("status" in d)) throw new Error("no status field"); return `status=${d.status}`; });
  await expectOcs("user_status predefined (trailing slash)", "/ocs/v2.php/apps/user_status/api/v1/predefined_statuses/?format=json",
    (d) => { if (!Array.isArray(d)) throw new Error("not array"); return `${d.length} presets`; });

  // 5. weather
  await expectOcs("weather location", "/ocs/v2.php/apps/weather_status/api/v1/location?format=json",
    (d) => `mode=${d?.mode}`);
  // Forecast may legitimately 404 in an air-gapped deployment (no upstream
  // met.no access). Treat that as an expected "unavailable" state, not a failure.
  {
    const { res, data } = await jsonOcs("weather forecast", "/ocs/v2.php/apps/weather_status/api/v1/forecast?format=json");
    if (!res) { /* request error already recorded */ }
    else if (res.status === 404) ok("weather forecast", "404 — unavailable (expected when offline)");
    else if (res.ok && Array.isArray(data?.ocs?.data)) ok("weather forecast", `${data.ocs.data.length} points`);
    else bad("weather forecast", `HTTP ${res.status}`);
  }

  // 6. appconfig (admin)
  await expectOcs("appconfig getValue core/shareapi_enabled",
    "/ocs/v2.php/apps/provisioning_api/api/v1/config/apps/core/shareapi_enabled?format=json&defaultValue=yes",
    (d) => `value=${JSON.stringify(d)}`);

  // 7. reminders (needs a fileId)
  if (FILEID) {
    await expectOcs("reminder get", `/ocs/v2.php/apps/files_reminders/api/v1/${FILEID}?format=json`,
      (d) => `dueDate=${d?.dueDate}`);
  } else {
    results.push("  SKIP  reminder get (set KARSAAZ_TEST_FILEID)");
  }

  // 8. comments DAV REPORT (needs a fileId)
  if (FILEID) {
    try {
      const res = await fetch(`${BASE}/remote.php/dav/comments/files/${FILEID}`, {
        method: "REPORT",
        headers: { Authorization: AUTH, "Content-Type": "application/xml" },
        body: `<?xml version="1.0"?><oc:filter-comments xmlns:oc="http://owncloud.org/ns"><oc:limit>10</oc:limit><oc:offset>0</oc:offset></oc:filter-comments>`,
      });
      res.ok || res.status === 207 ? ok("comments REPORT", `HTTP ${res.status}`) : bad("comments REPORT", `HTTP ${res.status}`);
    } catch (e) { bad("comments REPORT", e.message); }
  } else {
    results.push("  SKIP  comments REPORT (set KARSAAZ_TEST_FILEID)");
  }

  // 9. workflows (admin OCS)
  await expectOcs("workflows global", "/ocs/v2.php/apps/workflowengine/api/v1/workflows/global?format=json",
    (d) => `${Object.keys(d || {}).length} class group(s)`);

  // 10. external storage (admin, non-OCS JSON array)
  {
    const res = await fetch(`${BASE}/index.php/apps/files_external/globalstorages`, { headers: ocsHeaders });
    if (res.ok) {
      const arr = await res.json().catch(() => null);
      Array.isArray(arr) ? ok("external storages list", `${arr.length} mount(s)`) : bad("external storages list", "not array");
    } else bad("external storages list", `HTTP ${res.status}`);
  }

  // 11. initial-state lists
  await fetchInitialState("app tokens (initial-state)", "/index.php/settings/user/security", "settings-app_tokens");
  await fetchInitialState("2FA backup state (initial-state)", "/index.php/settings/user/security", "twofactor_backupcodes-state");
  await fetchInitialState("oauth2 clients (initial-state)", "/index.php/settings/admin/security", "oauth2-clients");

  // 12. public share (needs a token)
  if (SHARE_TOKEN) {
    try {
      const res = await fetch(`${BASE}/public.php/dav/files/${SHARE_TOKEN}/`, {
        method: "PROPFIND",
        headers: { Depth: "1", "Content-Type": "application/xml" },
        body: `<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/><d:getcontentlength/></d:prop></d:propfind>`,
      });
      res.status === 207 || res.ok ? ok("public share PROPFIND", `HTTP ${res.status}`) : bad("public share PROPFIND", `HTTP ${res.status}`);
    } catch (e) { bad("public share PROPFIND", e.message); }
  } else {
    results.push("  SKIP  public share PROPFIND (set KARSAAZ_TEST_SHARE_TOKEN)");
  }

  console.log(results.join("\n"));
  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
