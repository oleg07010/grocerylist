// src/lib/haptics.js
//
// Light haptic tap on native iOS, no-op on the web. Dynamically imports the
// Capacitor plugin so it stays out of the web code path, mirroring the guarded
// native init in src/index.js.

import { Capacitor } from "@capacitor/core";

export async function lightImpact() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics are best-effort; ignore failures */
  }
}
