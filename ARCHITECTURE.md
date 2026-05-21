# Server architecture (reference mirror)

This tree mirrors `github.com/nextcloud/server` at **v30.0.17**. **Production does not build from here** — Karsaaz Cloud runs `nextcloud:31-apache` from Docker Hub with overlays in `karsaaz-cloud-main/karsaaz-cloud-main/`.

## Runtime vs source

| Concern | Production | This repository |
|---------|------------|-----------------|
| Server binary | Docker image `nextcloud:31-apache` | Not built |
| Branding | `themes/karsaaz/defaults.php` overlay | `themes/` upstream examples only |
| Lockdown | `airgap.config.php` overlay | `config/config.sample.php` reference |
| Version | 31.0.14 (deployed) | 30.0.17 (mirror) |

## Conceptual zones (documented seam — no physical move)

Per `investigate.txt` Phase 3, PHP autoload and app discovery require fixed paths. Use this map instead of relocating folders:

### Backend (API and business logic)

| Path | Role |
|------|------|
| `lib/private/`, `lib/public/` | Core kernel (`OC\`, `OCP\`) |
| `core/Controller/`, `core/Command/`, `core/Db/` | Core HTTP and CLI |
| `apps/*/lib/` | Per-app PHP (controllers, services, DAV) |
| `apps/*/appinfo/` | App manifest, routes, `Application.php` |
| `ocs/`, `ocs-provider/` | OCS REST dispatch |
| `remote.php`, `index.php`, `public.php`, `cron.php` | HTTP/CLI entry points |
| `occ` | CLI wrapper → `console.php` |

### Frontend (UI assets)

| Path | Role |
|------|------|
| `core/src/`, `apps/*/src/` | Vue/TypeScript sources |
| `core/js/`, `apps/*/js/` | Built or legacy JS served to browsers |
| `core/css/`, `apps/*/css/` | Styles |
| `core/templates/`, `apps/*/templates/` | PHP templates |
| `dist/` | Webpack output chunks |

Most apps with a modern UI already ship `package.json` + webpack config under `apps/<name>/`.

## Client integration

Desktop and Android clients talk to the **deployed** server over:

- WebDAV — `/remote.php/dav/files/{user}/`
- OCS — `/ocs/v2.php/...`
- Login Flow v2 — `/index.php/login/flow`

See [`API_CONTRACT.md`](API_CONTRACT.md) and workspace [`docs/api/API_CONTRACT.md`](../../docs/api/API_CONTRACT.md).

## Karsaaz brand (production)

Server product name, colors, and URLs are overridden at runtime by:

`karsaaz-cloud-main/karsaaz-cloud-main/themes/karsaaz/defaults.php`

Canonical metadata: workspace `brand/brand.json` and `AGENTS.md` §3.
