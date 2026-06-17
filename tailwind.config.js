/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2B7FFF',
          dark: '#1a6fe8',
          light: '#5899FF'
        },
        surface: '#FFFFFF',
        bg: '#F5F5F7',
        border: '#E5E5E5',
        text: {
          DEFAULT: '#09090B',
          muted: '#71717B',
          placeholder: '#A1A1AA'
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Geist', 'Inter', 'sans-serif']
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        pill: '30px'
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
      },
      width: {
        sidebar: '240px'
      },
      height: {
        header: '64px'
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      },
      animation: {
        slideIn: 'slideIn 0.2s ease-out'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
