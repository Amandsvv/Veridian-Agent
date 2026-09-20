import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        veridian: {
          50: "#f0f7f4",
          100: "#dbeef5",
          500: "#1b4d3e",
          600: "#163e32",
          700: "#112f26",
          800: "#0b201a",
          900: "#06120e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
