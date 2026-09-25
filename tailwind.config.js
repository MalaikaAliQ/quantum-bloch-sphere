import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Brighter mid-greys so secondary/caption text stays readable on the dark glass panels
        slate: {
          ...colors.slate,
          300: '#dbe4ef',
          400: '#bac6d6',
          500: '#9eabbe',
        },
      },
    },
  },
  plugins: [],
}
