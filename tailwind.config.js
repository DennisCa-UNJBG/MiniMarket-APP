/** @type {import('tailwindcss').Config} */
export default {
  // 'class' = el modo oscuro se activa agregando la clase 'dark' al <html>
  // Esto permite un botón de toggle manual en vez de depender del sistema
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'main-bg': 'var(--bg-main)',
      },
    },
  },
  plugins: [],
}

