/**
 * Rasterize public/rehab360-logo.svg to public/rehab360-og.png for Open Graph / WhatsApp.
 * Run: node scripts/generate-og-image.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "rehab360-logo.svg");
const outPath = join(root, "public", "rehab360-og.png");

const svg = readFileSync(svgPath);
const width = 1200;
const height = 630;

const logoBuf = await sharp(svg)
  .resize(520, 520, { fit: "inside" })
  .png()
  .toBuffer();

await sharp({
  create: {
    width,
    height,
    channels: 3,
    background: { r: 248, g: 250, b: 252 },
  },
})
  .composite([{ input: logoBuf, gravity: "center" }])
  .png()
  .toFile(outPath);

console.log("Wrote", outPath);
