import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#163C3C',
          dark: '#0F2A2A',
          light: '#1F4F4F',
        },
        secondary: {
          DEFAULT: '#ACC9A6',
          light: '#EBFDCF',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
export default config;

