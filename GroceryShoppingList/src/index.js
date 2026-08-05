import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import App from "./App";

// Load Google Font
const link = document.createElement("link");
link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap";
link.rel = "stylesheet";
document.head.appendChild(link);

// Native-only setup (no-ops on web). The header is now light (#F6F8F7), so the
// status bar needs dark content. In Capacitor's (counterintuitive) enum,
// Style.Light = "dark text for light backgrounds". Hide the splash once mounted.
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  SplashScreen.hide().catch(() => {});
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
