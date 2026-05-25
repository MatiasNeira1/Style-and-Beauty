/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#a93454',
        'primary-strong': '#7a1e38',
        ink: '#191417',
        'ink-soft': '#51474c',
        muted: '#84777d',
        brandBg: '#fff8f4',
        'brandBg-deep': '#171215',
        'rose-soft': '#f4c9cf',
        champagne: '#d7ad66',
        sage: '#8ea18b',
        smoke: '#f1ece8',
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};