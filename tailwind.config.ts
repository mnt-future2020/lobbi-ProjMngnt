import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          active: "#334155",
        },
        brand: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          dark: "#4f46e5",
        },
      },
    },
  },
  safelist: [
    "bg-red-50/60", "border-red-200", "bg-red-500",
    "bg-green-50/60", "border-green-200", "bg-green-500",
    "bg-blue-50/60", "border-blue-200", "bg-blue-500",
    "bg-yellow-50/60", "border-yellow-200", "bg-yellow-400",
    "bg-purple-50/60", "border-purple-200", "bg-purple-500",
    "bg-orange-50/60", "border-orange-200", "bg-orange-500",
  ],
  plugins: [],
};
export default config;
