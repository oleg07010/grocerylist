// scripts/generate-android-icon-sources.mjs
//
// Prepares the source images that @capacitor/assets needs to generate Android
// launcher icons (incl. adaptive) and splash screens, derived from the single
// resources/icon.png. Run once (or whenever the icon changes):
//
//   node scripts/generate-android-icon-sources.mjs
//   npx @capacitor/assets@latest generate --android
//   npx cap sync android
//
// It samples the icon's own corner color so the adaptive-icon background and the
// splash field match the icon seamlessly (no visible square edge under the mask).
// Uses the existing `sharp` devDependency — no new packages.

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const resDir = path.resolve(dir, "..", "resources");
const SRC = path.join(resDir, "icon.png");

const ICON = 1024; // icon source size
const SPLASH = 2732; // splash source size (square, per @capacitor/assets)
const SPLASH_LOGO = Math.round(SPLASH * 0.4); // centered logo ~40% of the field

async function main() {
  // Exact top-left pixel = the icon's flat teal background (not an average).
  const { data } = await sharp(SRC)
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bg = { r: data[0], g: data[1], b: data[2] };
  const hex =
    "#" + [bg.r, bg.g, bg.b].map((v) => v.toString(16).padStart(2, "0")).join("");
  console.log("Sampled icon background:", hex);

  // Normalize the icon to an opaque 1024² square.
  const icon = await sharp(SRC)
    .resize(ICON, ICON, { fit: "cover" })
    .flatten({ background: bg })
    .png()
    .toBuffer();

  // icon-only (iOS + Android legacy) and icon-foreground (Android adaptive) are
  // the full-bleed icon; the launcher mask rounds the corners and the cart's
  // wide margins keep it clear of any circular/squircle crop.
  await sharp(icon).toFile(path.join(resDir, "icon-only.png"));
  await sharp(icon).toFile(path.join(resDir, "icon-foreground.png"));

  // icon-background: solid brand teal (sits behind the opaque foreground, but
  // @capacitor/assets requires it for adaptive icons).
  await sharp({ create: { width: ICON, height: ICON, channels: 3, background: bg } })
    .png()
    .toFile(path.join(resDir, "icon-background.png"));

  // splash (light + dark): teal field with the logo centered.
  const logo = await sharp(icon).resize(SPLASH_LOGO, SPLASH_LOGO).toBuffer();
  for (const name of ["splash.png", "splash-dark.png"]) {
    await sharp({ create: { width: SPLASH, height: SPLASH, channels: 3, background: bg } })
      .composite([{ input: logo }])
      .png()
      .toFile(path.join(resDir, name));
  }

  console.log(
    "Wrote icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png to resources/"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
