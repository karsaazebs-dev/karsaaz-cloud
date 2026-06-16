// Downloads tab-bar assets from Figma node 18:136 (correct MCP URLs).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const TAB_ASSETS = [
  ["home/v2/home-tab.png", "https://www.figma.com/api/mcp/asset/267d66fd-cb24-48b9-b205-e30b4830f5fd"],
  ["home/v2/search-tab.png", "https://www.figma.com/api/mcp/asset/0756633a-35bc-437c-b6a0-c5c56a5b10b0"],
  ["home/v2/favorites-tab.png", "https://www.figma.com/api/mcp/asset/919e1613-7867-46f9-bd8e-330ef1c2bf41"],
  ["home/v2/gallery-tab.png", "https://www.figma.com/api/mcp/asset/5527db89-59e5-46c1-812f-27934fdb9245"],
  ["home/v2/menu-tab.png", "https://www.figma.com/api/mcp/asset/aea19cf3-22f2-43cf-9edc-2bb9683bf76f"],
  ["home/v2/fab-plus.png", "https://www.figma.com/api/mcp/asset/5ce36719-292c-4f85-96f1-7f02371a1c24"],
  ["home/v2/tab-bar-bg.png", "https://www.figma.com/api/mcp/asset/02be5872-b567-4c55-b143-4c62c98d7ba4"],
];

function normalizeTabSvg(svg) {
  return svg
    .replace(/var\(--[^,]+,\s*([^)]+)\)/g, "$1")
    .replace(/stroke="black"/g, 'stroke="white"')
    .replace(/fill="black"/g, 'fill="white"');
}

async function toPng(buf, dest) {
  const head = buf.subarray(0, 64).toString("utf8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    const svg = normalizeTabSvg(buf.toString("utf8"));
    const png = await sharp(Buffer.from(svg), { density: 192 }).png().toBuffer();
    await writeFile(dest, png);
    return png.length;
  }
  await writeFile(dest, buf);
  return buf.length;
}

for (const [rel, url] of TAB_ASSETS) {
  const dest = path.join(root, "assets", "figma", rel);
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed ${rel}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const size = await toPng(buf, dest);
  console.log(`ok ${rel} (${size} bytes)`);
}
