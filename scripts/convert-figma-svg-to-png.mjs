// Converts mislabeled SVG files in assets/figma (recursive .png) to real PNGs.
// Figma MCP exports often save SVG markup with a .png extension.

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const figmaDir = path.join(root, "assets", "figma");

function normalizeSvg(svg) {
  return svg.replace(/var\(--[^,]+,\s*([^)]+)\)/g, "$1");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name.endsWith(".png")) files.push(full);
  }
  return files;
}

async function convertFile(filePath) {
  const buf = await readFile(filePath);
  const isPng = buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
    buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A;

  if (isPng) {
    return { filePath, skipped: true };
  }

  const head = buf.subarray(0, 64).toString("utf8").trimStart();
  let convertedBuf;
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    const svg = normalizeSvg(buf.toString("utf8"));
    convertedBuf = await sharp(Buffer.from(svg), { density: 192 })
      .png()
      .toBuffer();
  } else {
    convertedBuf = await sharp(buf)
      .png()
      .toBuffer();
  }

  await writeFile(filePath, convertedBuf);
  const before = buf.length;
  return { filePath, skipped: false, before, after: convertedBuf.length };
}

const files = await walk(figmaDir);
let converted = 0;
let skipped = 0;

for (const filePath of files) {
  const result = await convertFile(filePath);
  const rel = path.relative(root, result.filePath);
  if (result.skipped) {
    skipped += 1;
    console.log(`skip ${rel}`);
  } else {
    converted += 1;
    console.log(`ok   ${rel} (${result.before} → ${result.after} bytes)`);
  }
}

console.log(`\nDone: ${converted} converted, ${skipped} already PNG`);
