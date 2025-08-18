/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 400: "#22d3ee", 500: "#06b6d4" },
        grape: { 400: "#a78bfa", 500: "#8b5cf6" },
      },
    },
  },
  plugins: [],
};
