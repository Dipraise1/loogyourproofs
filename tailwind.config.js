/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 2025 Design Trend Colors - Dark theme with purple accents
        'dark': {
          900: '#0a0a0b',
          800: '#111113',
          700: '#1a1a1d',
          600: '#2d2d30',
          500: '#404043',
        },
        'purple': {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa', // Digital Lavender trend
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        'mocha': '#a47864', // Pantone 2025 Color of the Year
        'neon': {
          purple: '#bf7fff',
          blue: '#00f5ff',
          green: '#4CAF50',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // 2025 trend: smaller, refined text
        'xs': ['0.65rem', { lineHeight: '1rem' }],
        'sm': ['0.75rem', { lineHeight: '1.25rem' }],
        'base': ['0.825rem', { lineHeight: '1.375rem' }],
        'lg': ['0.925rem', { lineHeight: '1.5rem' }],
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],
      },
      boxShadow: {
        // Clean shadows without glow
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-in',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-up': {
          'from': { 
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(rgba(168, 139, 250, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 139, 250, 0.1) 1px, transparent 1px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 