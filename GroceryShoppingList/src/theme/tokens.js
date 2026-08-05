// src/theme/tokens.js
//
// Single source of truth for the "Retuned teal" redesign. Colors, radii, and
// motion timings live here and nowhere else — components reference these tokens
// instead of hard-coding values.

export const tokens = {
  color: {
    bg: "#F6F8F7", // screen background
    surface: "#FFFFFF", // cards, header, compose bar
    ink: "#12201C", // primary text
    inkMuted: "#7C8985", // completed item text
    textSecondary: "#5F6E69", // section labels
    textTertiary: "#9BA7A2", // quantity / placeholder
    textQuaternary: "#AFBAB5", // resting icon color
    accent: "#0E7C66", // brand teal (accent only, never a large fill)
    accentPressed: "#0A6553",
    accentSoft: "#E3F1EC", // pinned-state background, section chip
    danger: "#B4483A", // muted; delete on press only
    hairline: "rgba(18,32,28,0.055)", // row dividers
    border: "rgba(18,32,28,0.07)", // header / footer borders
    track: "#E7EDEA", // progress bar track
    checkboxBorder: "#CBD5D1",
    dragDot: "#CFD8D4",
    composeField: "#F1F4F3",
    strikethrough: "rgba(124,137,133,0.55)",
    pressEditBg: "rgba(18,32,28,0.05)",
    pressDeleteBg: "rgba(180,72,58,0.08)",
  },
  radius: { card: 16, control: 8, check: 7, pill: 999 },
  shadow: {
    card: "0 1px 2px rgba(18,32,28,0.05)",
    ring: "0 0 0 1px rgba(18,32,28,0.04)",
  },
  font: {
    family: "'Outfit', 'Segoe UI', sans-serif",
    weight: { regular: 400, medium: 500, semibold: 600 },
  },
  // Durations in seconds (framer-motion), plus the check-spring easing curve.
  motion: {
    progress: 0.45,
    reorder: 0.25,
    dim: 0.3,
    checkmarkFade: 0.15,
    pinFade: 0.18,
    checkSpringDur: 0.18,
    checkSpringEase: [0.34, 1.7, 0.5, 1],
  },
};
