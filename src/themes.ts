// Theme definitions for WZRD TUI

export interface Theme {
  name: string;
  background: string;
  surface: string;
  element: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  accentBlue: string;
  accentPurple: string;
  accentGreen: string;
  accentOrange: string;
  accentRed: string;
  accentYellow: string;
  accentGold: string;
  border: string;
  diffOld: string;
  diffNew: string;
}

// Dark theme (current)
export const darkTheme: Theme = {
  name: "dark",
  background: "#0a0a0a",
  surface: "#141414",
  element: "#1e1e1e",
  text: "#eeeeee",
  textMuted: "#808080",
  textDim: "#666666",
  primary: "#fab283",
  accentBlue: "#6ba4ff",
  accentPurple: "#d06efa",
  accentGreen: "#4cd964",
  accentOrange: "#ff9500",
  accentRed: "#ff6b6b",
  accentYellow: "#f4d03f",
  accentGold: "#ffd700",
  border: "#2a2a2a",
  diffOld: "#2d1f1f",
  diffNew: "#1f2d1f",
};

// Light theme
export const lightTheme: Theme = {
  name: "light",
  background: "#ffffff",
  surface: "#f5f5f5",
  element: "#e8e8e8",
  text: "#1a1a1a",
  textMuted: "#666666",
  textDim: "#999999",
  primary: "#e67e22",
  accentBlue: "#3498db",
  accentPurple: "#9b59b6",
  accentGreen: "#27ae60",
  accentOrange: "#e67e22",
  accentRed: "#e74c3c",
  accentYellow: "#f1c40f",
  accentGold: "#f39c12",
  border: "#d0d0d0",
  diffOld: "#ffe5e5",
  diffNew: "#e5ffe5",
};

// All themes
export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme,
};

// Default theme
export const defaultTheme = darkTheme;
