/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./frontend/index.html",
    "./frontend/src/**/*.{js,jsx,ts,tsx}", // Include all JS/JSX/TS/TSX files in frontend/src
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui"), // Add Daisy UI as a plugin
  ],
}