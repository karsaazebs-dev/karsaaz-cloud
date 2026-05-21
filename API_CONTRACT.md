# API contract — Karsaaz Cloud clients

Stable HTTP surface that **Karsaaz Sync** (desktop + Android) depends on against the deployed server (`nextcloud:31-apache` + `airgap.config.php`). The server mirror in this repo is reference-only; the live API is whatever NC 31 ships, minus features disabled in the airgap overlay.

**Canonical copy:** `docs/api/API_CONTRACT.md` at workspace root.

## Base URL

- LAN default: `http://192.168.18.61:3030`
- WebDAV files root: `/remote.php/dav/files/{username}/`

## Required client behavior

| Requirement | Value |
|-------------|--------|
| User-Agent | `Karsaaz-Sync/<version> (...)` — must **not** contain `mirall`, `Nextcloud-android`, or `ownCloud-*` |
| Auth | App password or session from Login Flow v2 |
| Push | Disabled — clients use polling only |

## Endpoints

### Discovery

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/status.php` | none | Version, maintenance, `productname` |
| GET | `/ocs/v2.php/cloud/capabilities?format=json` | basic | Feature flags before sync |
| GET | `/ocs/v2.php/cloud/user?format=json` | basic | Profile, quota |

### Login Flow v2

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/index.php/login/flow` | session |
| POST | `/index.php/login/v2/poll` | none |
| GET/POST | `/index.php/login/v2/grant` | session |

### WebDAV (primary sync)

| Methods | Path pattern | Auth |
|---------|--------------|------|
| PROPFIND, GET, PUT, DELETE, MKCOL, MOVE, REPORT, LOCK, UNLOCK | `/remote.php/dav/files/{user}/...` | basic + app-password |
| PROPFIND | `/remote.php/dav/systemtags/` | basic |
| PROPPATCH | `/remote.php/dav/files/{user}/...` | basic |

WebDAV property namespaces `http://owncloud.org/ns:` and `http://nextcloud.org/ns:` are protocol literals (not fetched URLs).

### OCS REST

| Path prefix | Purpose |
|-------------|---------|
| `/ocs/v2.php/apps/files_sharing/api/v1/shares` | Shares CRUD |
| `/ocs/v2.php/apps/files_sharing/api/v1/sharees` | Share recipient search |
| `/ocs/v2.php/apps/comments/...` | Comments |
| `/ocs/v2.php/cloud/users/{id}` | User profile |
| `/ocs/v2.php/apps/notifications/api/v2/notifications` | Notifications (polling) |
| `/ocs/v1.php/cloud/activity` | Activity feed |
| `/ocs/v2.php/apps/files_versions/api/v1/...` | File versions |
| `/ocs/v2.php/apps/dav/api/v1/direct` | Direct editing / Collabora bridge |

### Public shares (unauthenticated)

| Path | Purpose |
|------|---------|
| `/index.php/s/{token}` | Share landing |
| `/public.php/dav/files/{token}/` | Public WebDAV |

## Disabled on Karsaaz Cloud (expect empty/error; gate on capabilities)

- Federated sharing — `gs.federation=internal`
- App store — `appstoreenabled=false`
- Updater — `updatechecker=false`
- Push proxy — empty; polling only

## Verification checklist (Phase 6)

1. GET `/status.php` → `productname` contains `Karsaaz Cloud`
2. Login Flow v2 from desktop and Android
3. PROPFIND user files root → 207
4. Upload and download a test file both directions
5. Server logs show `Karsaaz-Sync/` User-Agent, not blocked UAs
