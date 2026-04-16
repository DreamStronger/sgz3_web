/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 三国志经典配色
        'wei-blue': '#2563eb',      // 魏国蓝
        'shu-green': '#16a34a',     // 蜀国绿
        'wu-red': '#dc2626',        // 吴国红
      },
      fontFamily: {
        'pixel': ['Courier New', 'monospace'],
      },
      boxShadow: {
        'pixel': '4px 4px 0px rgba(255, 255, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -10px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translate(-50%, 0)' },
          '100%': { opacity: '0', transform: 'translate(-50%, -10px)' },
        },
      },
    },
  },
  plugins: [],
}
