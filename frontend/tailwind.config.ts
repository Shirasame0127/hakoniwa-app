import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#10b981",
        secondary: "#8b5cf6",
        accent: "#f59e0b",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};
export default config;
