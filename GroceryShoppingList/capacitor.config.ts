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
    // Android targets API 36 (edge-to-edge is forced), so the WebView draws
    // behind the system bars. @capawesome/capacitor-android-edge-to-edge-support
    // applies the correct top/bottom insets and paints the bar areas. White
    // matches the header + compose bar (tokens.color.surface = #FFFFFF); the
    // status-bar icons stay dark (StatusBar Style.Light) for contrast.
    EdgeToEdge: {
      backgroundColor: "#FFFFFF",
    },
  },
};

export default config;
