// scripts/generate-play-listing-graphics.mjs
//
// Generates the two required Google Play listing graphics from resources/icon.png
// into play-assets/:
//   - play-store-icon-512.png    (512×512, the store icon)
//   - feature-graphic-1024x500.png (1024×500, required feature graphic)
//
//   node scripts/generate-play-listing-graphics.mjs
//
// (Phone screenshots are captured from a running device/emulator separately, so
// they reflect real UI; they are not committed because they contain list data.)

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..");
const SRC = path.join(root, "resources", "icon.png");
const OUT = path.join(root, "play-assets");

const TEAL = "#0d9488";

async function main() {
  // 1) Store icon: 512×512, 32-bit PNG (with alpha channel, per Play spec).
  await sharp(SRC).resize(512, 512, { fit: "cover" }).flatten({ background: TEAL })
    .ensureAlpha().png()
    .toFile(path.join(OUT, "play-store-icon-512.png"));

  // 2) Feature graphic: 1024×500 teal field, icon tile on the left, wordmark + tagline.
  const tile = await sharp(SRC).resize(300, 300).png().toBuffer();
  const svg = Buffer.from(`
    <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="500" fill="${TEAL}"/>
      <text x="470" y="238" font-family="Arial, Helvetica, sans-serif" font-size="82"
            font-weight="700" fill="#FFFFFF">GrocerySync</text>
      <text x="472" y="300" font-family="Arial, Helvetica, sans-serif" font-size="34"
            font-weight="400" fill="#DCEFEA">Your shared grocery list, in sync</text>
    </svg>`);
  await sharp(svg)
    .composite([{ input: tile, left: 100, top: 100 }])
    .flatten({ background: TEAL })
    .removeAlpha() // 24-bit RGB, no alpha channel (Play spec for feature graphic)
    .png()
    .toFile(path.join(OUT, "feature-graphic-1024x500.png"));

  console.log("Wrote play-assets/play-store-icon-512.png and feature-graphic-1024x500.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
