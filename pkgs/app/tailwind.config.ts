import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0E16",
        surface: "#0F1420",
        panel: "#141A28",
        border: "#232B3D",
        cyan: {
          DEFAULT: "#2FA9B8",
          bright: "#4FC3D0",
          dim: "#1F7A85",
        },
        emerald: {
          DEFAULT: "#34B37A",
          dim: "#1F7A52",
        },
        amber: "#C9974C",
        rose: "#C4574F",
        ink: {
          DEFAULT: "#E8EBF0",
          dim: "#9AA4B8",
          faint: "#5C6478",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
