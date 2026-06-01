import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF6EE",
        ink: "#1C2A4A",
        ochre: "#B8862C",
        parchment: {
          deep: "#F0E8D8",
          DEFAULT: "#FAF6EE",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        btn: "6px",
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
