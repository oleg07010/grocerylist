// src/lib/nativeSetup.js
//
// One-time native UI setup, run once at startup from src/index.js:
//   - dark status-bar icons over the light (#FFFFFF) header
//   - hide the launch splash once the web layer is ready
// No-op on the web. Dynamically imports the Capacitor plugins so they stay out
// of the web bundle's code path, mirroring src/lib/haptics.js.
//
// Android edge-to-edge (targetSdk 36 draws behind the system bars) is handled by
// @capawesome/capacitor-android-edge-to-edge-support via capacitor.config
// (plugins.EdgeToEdge) — it applies the insets and paints the bar areas, so no
// extra JS is needed here for either platform.

import { Capacitor } from "@capacitor/core";

export async function configureNativeUI() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Capacitor's enum is inverted: Style.Light = dark content for light backgrounds.
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    /* status-bar styling is best-effort; ignore failures */
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch {
    /* splash hide is best-effort; ignore failures */
  }
}
