/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lightbg: '#f5f7fa', // soft bluish background
        lightcard: '#e6f0ff', // chat bubbles etc.
        darkbg: '#1e1e2fa',
        darkcard: '#1e293b',
        chatblue: '#3b82f6',
        primary: '#0f766e', // teal-800
        secondary: '#fbbf24', // amber-400
        accent: '#38bdf8', // sky-400
        bgSoft: '#f9fafb', // light background
        bgDark: '#1f2937' // slate-800
      },
      animation: {
        floating: 'floating 8s ease-in-out infinite',
      },
      keyframes: {
        floating: {
          '0%': { transform: 'translateY(0px) translateX(0px) scale(1)' },
          '50%': { transform: 'translateY(-20px) translateX(10px) scale(1.1)' },
          '100%': { transform: 'translateY(0px) translateX(0px) scale(1)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, fill, stroke',
      },
    },
  },
  plugins: [require('tailwind-scrollbar-hide')],
}

