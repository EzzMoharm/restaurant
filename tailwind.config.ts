// tailwind.config.ts
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
        // Core 5-color system for the UI
        primary: "#F59E0B",   // Amber (Calls to action, buttons)
        secondary: "#10B981", // Emerald (Success states, fresh items)
        accent: "#EF4444",    // Red (Highlights, hot deals)
        neutral: "#1F2937",   // Dark Gray (Text, heavy borders)
        background: "#F9FAFB",// Off-white (App background)
      },
    },
  },
  plugins: [],
};
export default config;