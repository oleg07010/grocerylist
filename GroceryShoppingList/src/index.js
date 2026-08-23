import React from "react";
import ReactDOM from "react-dom/client";
import { configureNativeUI } from "./lib/nativeSetup";
import App from "./App";

// Load Google Font
const link = document.createElement("link");
link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap";
link.rel = "stylesheet";
document.head.appendChild(link);

// Native-only UI setup (no-op on web): dark status-bar icons over the light
// header + hide the launch splash once React is mounting.
configureNativeUI();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
