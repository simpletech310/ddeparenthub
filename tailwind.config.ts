import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DDE brand: warm, compassionate teal + soft accent
        brand: {
          50: "#eef9f8",
          100: "#d6f0ee",
          200: "#aee0dd",
          300: "#7accc8",
          400: "#46b0ad",
          500: "#2a9794",
          600: "#1f7977",
          700: "#1d6160",
          800: "#1b4e4d",
          900: "#194241",
        },
        accent: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#fec8aa",
          300: "#fda174",
          400: "#fb6f3c",
          500: "#f94d16",
          600: "#ea350c",
          700: "#c2240c",
          800: "#9a1f12",
          900: "#7c1d12",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
