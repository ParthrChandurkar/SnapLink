/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0d1117",
        panel: "#161b22",
        line: "#30363d",
        accent: "#38bdf8",
      },
      boxShadow: {
        glow: "0 0 40px rgba(56, 189, 248, 0.12)",
      },
    },
  },
  plugins: [],
};

