/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coupang: {
          blue: '#0074E9',
          darkBlue: '#005bb5',
          lightBlue: '#EAF3FF',
          red: '#E61E2A',
          yellow: '#FFB800',
          dark: '#111827',
          grayBg: '#F8FAFC',
          card: '#FFFFFF'
        }
      }
    },
  },
  plugins: [],
}
