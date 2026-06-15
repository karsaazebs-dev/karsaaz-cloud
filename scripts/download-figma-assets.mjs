/**
 * Downloads Figma MCP asset URLs into assets/figma/ (run after MCP export).
 * SPDX-FileCopyrightText: 2026 Karsaaz
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const assets = [
  ["brand/logo.png", "https://www.figma.com/api/mcp/asset/94368409-1f3f-48dc-b22b-603331b666e2"],
  ["home/bell.png", "https://www.figma.com/api/mcp/asset/ba1c5174-39c6-4c0c-86e1-dcd4eab5536d"],
  ["home/folder-icon.png", "https://www.figma.com/api/mcp/asset/bca2a5e9-707a-4074-8906-fb175ea4b154"],
  ["home/folder-menu.png", "https://www.figma.com/api/mcp/asset/6aaac428-a112-4f73-9f6a-726ce91b82d7"],
  ["home/pdf-file.png", "https://www.figma.com/api/mcp/asset/a583139e-a107-42ef-9a6d-4d2e2369041a"],
  ["home/video-icon.png", "https://www.figma.com/api/mcp/asset/e71db6a8-10d6-4189-8b8c-cf7cf78eab5b"],
  ["home/file-menu.png", "https://www.figma.com/api/mcp/asset/e4eb5e84-d0fb-4d3b-bef6-339eb79c6eff"],
  ["home/download.png", "https://www.figma.com/api/mcp/asset/e94cd377-eb37-4c42-8f09-4cb5ed9525d2"],
  ["home/search.png", "https://www.figma.com/api/mcp/asset/8ad23f23-9430-4c1f-9436-227b3ed788cb"],
  ["home/menu.png", "https://www.figma.com/api/mcp/asset/a2d2dab3-c0ae-4e9f-8c21-8cd877652649"],
  ["home/home-tab.png", "https://www.figma.com/api/mcp/asset/a9fe1ba5-cfbb-412c-9340-c0206a4a6642"],
  ["home/gallery-tab.png", "https://www.figma.com/api/mcp/asset/a2eb9f11-edaf-4356-bb24-5b7b74145654"],
  ["home/excel.png", "https://www.figma.com/api/mcp/asset/bd3b317c-2835-4036-b7c8-2b7faf74f6c3"],
  ["home/docs-quick.png", "https://www.figma.com/api/mcp/asset/89e9f630-d047-4378-994d-78c1a8ecc3e2"],
  ["home/favourites-quick.png", "https://www.figma.com/api/mcp/asset/957177f0-b2f7-44ab-808c-98b867d353a2"],
  ["home/shared-quick.png", "https://www.figma.com/api/mcp/asset/02ef2d17-0028-453f-a474-98cdc0b1f8cc"],
  ["home/videos-quick.png", "https://www.figma.com/api/mcp/asset/bfdb79b5-320b-47ee-8dc4-9e06a12d4d80"],
  ["home/pdf-quick.png", "https://www.figma.com/api/mcp/asset/a583139e-a107-42ef-9a6d-4d2e2369041a"],
  ["home/fab-add.png", "https://www.figma.com/api/mcp/asset/3e0babf4-80c1-4804-a697-45c316f646c3"],
  ["create-new/upload.png", "https://www.figma.com/api/mcp/asset/65fff47e-3c53-4945-8c63-aae08b3cb82d"],
  ["create-new/upload-other.png", "https://www.figma.com/api/mcp/asset/0a4560be-8470-43de-b53c-7f0cb7af2fb0"],
  ["create-new/camera.png", "https://www.figma.com/api/mcp/asset/75569f47-44d5-432a-a129-a3476084c832"],
  ["create-new/folder.png", "https://www.figma.com/api/mcp/asset/8682bd68-140d-49a6-b24d-755d18428d42"],
  ["create-new/doc.png", "https://www.figma.com/api/mcp/asset/663a399f-b522-4388-8030-582edde61900"],
  ["create-new/spreadsheet.png", "https://www.figma.com/api/mcp/asset/da43343b-1178-41f5-adbe-da9867f53e3f"],
  ["create-new/presentation.png", "https://www.figma.com/api/mcp/asset/8f881249-20ae-4b9b-adad-6cc27d508ece"],
  ["create-new/text-doc.png", "https://www.figma.com/api/mcp/asset/99277f8d-e6d3-4e3a-be1a-b7d070577cfc"],
  ["login/globe.png", "https://www.figma.com/api/mcp/asset/408fb940-6b4d-4136-9d12-536bbbe6d9f7"],
  ["login/link.png", "https://www.figma.com/api/mcp/asset/3c5fa048-3a6b-49dd-aa78-8baa77b151e4"],
  ["login/check-detected.png", "https://www.figma.com/api/mcp/asset/7132f939-9ab2-4902-8122-43f265e99623"],
  ["login/shield-white.png", "https://www.figma.com/api/mcp/asset/7c781164-f6cb-450d-90be-b4ba64a179f7"],
  ["login/lock.png", "https://www.figma.com/api/mcp/asset/ec23707f-e7cd-4a79-9730-be8d0307f79e"],
  ["login/recent-clock.png", "https://www.figma.com/api/mcp/asset/e59a192f-b977-4573-ad3d-bde05c4e6d71"],
  ["login/chevron-right.png", "https://www.figma.com/api/mcp/asset/c795b0a4-4284-4da9-8137-bb84b5e78a6a"],
  ["login/back.png", "https://www.figma.com/api/mcp/asset/14309d78-07f6-4425-903e-1f5519cafd70"],
  ["login/continue-arrow.png", "https://www.figma.com/api/mcp/asset/90264453-403d-4112-b47a-e8e2657f8b4d"],
  ["onboarding/uk-flag.png", "https://www.figma.com/api/mcp/asset/16ae9612-ac1c-4379-ad36-faac1a0408af"],
  ["onboarding/share-icon.png", "https://www.figma.com/api/mcp/asset/6e8ff54e-a900-41c4-9346-eab34317ea78"],
];

async function download(relPath, url) {
  const dest = path.join(root, "assets", "figma", relPath);
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${relPath}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log(`OK ${relPath} (${buf.length} bytes)`);
}

let failed = 0;
for (const [rel, url] of assets) {
  try {
    await download(rel, url);
  } catch (e) {
    failed += 1;
    console.error(`FAIL ${rel}:`, e.message);
  }
}
process.exit(failed > 0 ? 1 : 0);
