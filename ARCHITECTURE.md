# Desktop client layout (Karsaaz Sync)

Fork of Nextcloud Desktop (Qt 6 / C++17). Build with CMake from this directory.

## Structure

| Path | Role |
|------|------|
| `NEXTCLOUD.cmake` | `APPLICATION_NAME`, executable `karsaaz-sync`, domain, colors |
| `src/libsync/`, `src/csync/` | Sync engine |
| `src/gui/` | Qt UI |
| `src/common/utility.cpp` | User-Agent `Karsaaz-Sync/...` |
| `theme/colored/KarsaazSync/` | Tray/status SVG icons |

## Build

```bash
mkdir build && cd build
cmake -S .. -B . -DNEXTCLOUD_DEV=ON -DAPPLICATION_SERVER_URL=http://192.168.18.61:3030
cmake --build . --parallel
```

See [`docs/local-development.md`](../../docs/local-development.md).
