/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 8px grid spacing system
      spacing: {
        '0.5': '4px',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '6': '48px',
        '8': '64px',
        '12': '96px',
        '16': '128px',
      },
      colors: {
        // Semantic colors for status indicators - WCAG AA compliant (4.5:1 on white)
        semantic: {
          success: '#15803d', // green-700
          warning: '#a16207', // yellow-700
          error: '#b91c1c',   // red-700
          info: '#1d4ed8',    // blue-700
        },
      },
      // Transition durations
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      // Touch target minimum sizes
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
}
