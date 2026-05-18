# Karsaaz Cloud — Post-Hardening SAST + DAST Re-scan

**Date:** 2026-05-06
**Scope:** Local stack at `http://localhost:3030`, image `nextcloud:31-apache`

---

## 1. SAST (Trivy CRITICAL + HIGH)

| Image | CRITICAL | HIGH | Total |
|---|---:|---:|---:|
| `nextcloud:30-apache` (before) | **60** | **504** | **564** |
| `nextcloud:31-apache` (after)  | **7**  | **273** | **280** |
| **Delta** | **−53** | **−231** | **−284 (−50%)** |

### Remaining CRITICAL (7)
| CVSS | CVE | Package | Fix available? |
|---:|---|---|---|
| 9.8 | CVE-2026-20884 | libraw23t64 | upstream — none yet |
| 9.8 | CVE-2026-24450 | libraw23t64 | upstream — none yet |
| 9.8 | CVE-2026-24660 | libraw23t64 | upstream — none yet |
| 9.8 | CVE-2026-31789 | openssl / libssl3t64 | **yes — `3.5.5-1~deb13u2`** |
| 9.1 | CVE-2026-33845 | libgnutls30t64 | upstream — none yet |

**Action:** Schedule weekly `docker compose pull && docker compose up -d` to pick up the openssl fix when Docker Hub publishes a refreshed `nextcloud:31-apache` tag. The libraw and gnutls items are upstream-blocked — track via Debian security tracker.

### App-layer (composer)
3 HIGH in PHP dependencies (down from 4). Same vendor pins shipped by Nextcloud — fixed by future NC point releases.

---

## 2. DAST (live probes)

| Probe | Before | After | Verdict |
|---|---|---|---|
| `Server` header | `Apache/2.4.66 (Debian)` | `Apache` | ✅ version stripped |
| `X-Powered-By` | `PHP/8.3.x` | (gone) | ✅ stripped |
| `Permissions-Policy` | absent | `interest-cohort=()` | ✅ added |
| Path traversal `?dir=../../etc/passwd` | 401 | 401 | ✅ |
| WebDAV `../../etc/passwd` | 404 | 404 | ✅ |
| Open-redirect via `redirect_url=` | safe | 200, no Location set | ✅ validated |
| CSRF POST without token | 405 | 405 | ✅ |
| WebDAV anonymous PROPFIND | 401 | 401 | ✅ |
| `/.htaccess`, `/.git/config`, `/.env`, `/config/config.php` | 404 | 404 | ✅ |
| SSRF preview to `169.254.169.254` | blocked | 404 | ✅ airgap holding |
| 5× wrong-password login | 303 each (uniform) | 303 each | ✅ no oracle |

`status.php` still discloses NC version — by design (federation/monitoring use it). For an internal-only deployment this is acceptable; if exposed publicly, block via reverse-proxy ACL.

---

## 3. Hardening Applied This Round

| Change | File |
|---|---|
| NC 30.0.17 → **31.0.14** | `docker-compose.yml` (`image: nextcloud:31-apache`) |
| Container hardening: `cap_drop ALL` + minimal `cap_add`, `no-new-privileges`, `mem_limit`, `pids_limit` on db, redis, app | `docker-compose.yml` |
| PHP: `expose_php=Off`, hardened session cookies, `allow_url_include=Off` | `php-hardening.ini` |
| Apache: `ServerTokens Prod`, `ServerSignature Off`, `TraceEnable Off`, security headers | `apache-hardening.conf` |

## 4. Deferred (with reasoning)
- **Switch to fpm-alpine + nginx** — cosmetic CVE win not worth the architectural cost (extra nginx sidecar to maintain). See task 18 evaluation.
- **HTTPS / TLS termination** — requires reverse-proxy decision (Caddy vs Traefik vs nginx). Plan separately when binding to public DNS.
- **Move `.env` to Docker secrets** — explicitly skipped per user request; current `.env` is local-only and gitignored.

## 5. Recommended Recurring Tasks
- Weekly: `docker compose pull && docker compose up -d` (auto-picks security patches)
- Monthly: re-run Trivy and diff against this report
- Per release: re-run the DAST probe block in section 2

---

**Stack score after rescan:** 8.5 / 10
(was 8.0 / 10 before; improvement from upgrade + container hardening + header cleanup. Ceiling capped at 9.5 until HTTPS is in front.)
