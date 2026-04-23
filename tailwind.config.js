/** @type {import('tailwindcss').Config} */
export default {
  content: ["./popup.html", "./popup.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#e94560",
        "accent-hover": "#cf3a53",
      },
    },
  },
  plugins: [],
};