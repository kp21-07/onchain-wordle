/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wordle: {
          green: "#538d4e",
          yellow: "#b59f3b",
          gray: "#3a3a3c",
          dark: "#121213",
          card: "#1a1a1b",
          border: "#3a3a3c",
        }
      }
    },
  },
  plugins: [],
}
