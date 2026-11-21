/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Light/dark follows the system setting (prefers-color-scheme).
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Named after the Figma palette.
        bright: '#F6F2F1', // Bright White
        whisper: '#EAE2D3', // Whisper White
        bokara: '#2A2725', // Bokara Grey
        hunter: '#3A4A3F', // Dark Hunter Green
        lime: '#91A673', // Lucious Lime
        sage: '#C3CCB2', // light text gradient end (dark mode)
        mud: '#AE8F60', // palette swatch, swirl tone
      },
      fontFamily: {
        sans: ['Comfortaa', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        input: '15px',
        card: '30px',
      },
      boxShadow: {
        card: '0px 0px 40px 15px rgba(0,0,0,0.03)',
        button: 'inset 0px -3px 2px 0px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
