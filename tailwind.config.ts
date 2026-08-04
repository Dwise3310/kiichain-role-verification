import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "#08060D",
        obsidian: "#0F0B18",
        plum: "#1A1226",
        dusk: "#2D1B4E",
        violet: {
          DEFAULT: "#7C3AED",
          soft: "#A78BFA",
          glow: "#B388FF",
        },
        mist: "#F5F3FA",
        line: "rgba(179, 136, 255, 0.14)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(179, 136, 255, 0.45)",
        "glow-sm": "0 0 20px -6px rgba(179, 136, 255, 0.4)",
        panel: "0 8px 32px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(circle at 50% 0%, rgba(124,58,237,0.18), transparent 60%)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
