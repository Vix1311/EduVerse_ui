/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: ['bg-red-400', 'bg-blue-400', 'bg-purple-400', 'bg-yellow-400', 'bg-green-400'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      screens: {
        'md-915-1000': { min: '915px', max: '1000px' },
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3840px',
        '6xl': '5120px',
      },
      colors: {},
    },
  },
  plugins: [require('tailwindcss-animate'), '@tailwindcss/line-clamp'],
};
