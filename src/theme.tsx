// Exact Opencode theme colors from opencode.json
export const OpencodeTheme = {
  // Dark Mode Colors (from opencode.json)
  darkStep1: "#0a0a0a",   // Main background
  darkStep2: "#141414",   // Chat background / Panel
  darkStep3: "#1e1e1e",   // Element background
  darkStep4: "#282828",   // 
  darkStep5: "#323232",   // 
  darkStep6: "#3c3c3c",   // Subtle border
  darkStep7: "#484848",   // Regular border
  darkStep8: "#606060",   // Active border
  darkStep9: "#fab283",   // Primary color
  darkStep10: "#c8c8c8",  // 
  darkStep11: "#808080",  // Muted text
  darkStep12: "#eeeeee",  // Text color
  
  // Accent colors
  darkPrimary: "#fab283",
  darkSecondary: "#5c9cf5",
  darkAccent: "#9d7cd8",
  darkError: "#e06c75",
  darkWarning: "#f5a742",
  darkSuccess: "#7fd88f",
  darkInfo: "#56b6c2",
  darkYellow: "#e5c07b",
  
  // UI color mappings (like Opencode theme.tsx)
  background: "#0a0a0a",
  backgroundPanel: "#141414",
  backgroundElement: "#1e1e1e",
  backgroundMenu: "#1e1e1e",
  text: "#eeeeee",
  textMuted: "#808080",
  border: "#484848",
  borderActive: "#606060",
  primary: "#fab283",
  secondary: "#5c9cf5",
  accent: "#9d7cd8",
  error: "#e06c75",
  warning: "#f5a742",
  success: "#7fd88f",
  info: "#56b6c2",
};

// Agent colors for left border cycling (like Opencode)
export const AgentColors = [
  OpencodeTheme.secondary,  // Blue
  OpencodeTheme.accent,     // Purple
  OpencodeTheme.success,    // Green
  OpencodeTheme.warning,    // Orange
  OpencodeTheme.primary,    // Peach
  OpencodeTheme.error,      // Red
  OpencodeTheme.info,       // Cyan
];