import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.appassov.grocerysync",
  appName: "GrocerySync",
  webDir: "build",
  ios: {
    // We handle safe areas in CSS via env(safe-area-inset-*) + viewport-fit=cover,
    // so let the web layer draw edge-to-edge and own all inset padding itself.
    contentInset: "never",
  },
  plugins: {
    SplashScreen: {
      // Keep the teal splash up until index.js calls SplashScreen.hide() after
      // React mounts — avoids a white flash while the web bundle boots.
      launchAutoHide: false,
      backgroundColor: "#0d9488",
      showSpinner: false,
    },
  },
};

export default config;
