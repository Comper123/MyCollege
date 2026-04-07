import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        unbounded: ["var(--font-unbounded)", "sans-serif"],
        golos: ["var(--font-golos)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;