import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Data Driven Educators brand (sampled from datadrivenedu.com) ----
        // Primary: sky blue #00a2e8 · Secondary: teal-green #019e7c · Ink: navy #1e2132
        brand: {
          50: "#ecf8ff",
          100: "#d6efff",
          200: "#aee0ff",
          300: "#76ccff",
          400: "#36b3f7",
          500: "#00a2e8",
          600: "#0084c7",
          700: "#0a679c",
          800: "#115780",
          900: "#123f5c",
          950: "#0a2638",
        },
        teal: {
          50: "#e9faf3",
          100: "#c8f1e1",
          200: "#93e4c9",
          300: "#56d1ac",
          400: "#21b88f",
          500: "#019e7c",
          600: "#008066",
          700: "#066552",
          800: "#0a5044",
          900: "#0b4239",
        },
        ink: {
          50: "#f4f7fa",
          100: "#e7edf3",
          200: "#d3dce6",
          300: "#b3c0cf",
          400: "#8595a8",
          500: "#647385",
          600: "#4a5667",
          700: "#354052",
          800: "#262e3d",
          900: "#1e2132",
          950: "#14161f",
        },
        // Warm coral accent — used sparingly for delight + key highlights.
        accent: {
          50: "#fff3ef",
          100: "#ffe3da",
          200: "#ffc7b5",
          300: "#ffa284",
          400: "#ff7a59",
          500: "#f85a32",
          600: "#e2421c",
          700: "#bb3216",
          800: "#952a17",
          900: "#792817",
        },
        sun: { 400: "#ffd24d", 500: "#ffc220" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20,33,50,.04), 0 6px 20px -6px rgba(20,33,50,.10)",
        card: "0 1px 3px rgba(20,33,50,.05), 0 16px 30px -18px rgba(20,33,50,.18)",
        lift: "0 18px 40px -16px rgba(0,124,199,.35)",
        glow: "0 0 0 1px rgba(0,162,232,.12), 0 12px 30px -10px rgba(0,162,232,.30)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #00a2e8 0%, #019e7c 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #36b3f7 0%, #21b88f 100%)",
        "sky-fade": "linear-gradient(180deg, #f4f9fd 0%, #eef6fb 100%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.22,.61,.36,1) both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
