/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Override all border radius to 0
    borderRadius: {
      'none': '0',
      'DEFAULT': '0',
    },
    extend: {
      colors: {
        // Premium gradient color system - only black and white
        black: '#000000',
        white: '#FFFFFF',
        // Remove all other color palettes for bold, modern aesthetic
      },
      backgroundImage: {
        // Primary brand gradient - 135deg diagonal
        'gradient-primary': 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 20%, #47cf73 40%, #00c6ff 60%, #845ec2 80%, #d65db1 100%)',
        // Gradient variants for different use cases
        'gradient-text': 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 20%, #47cf73 40%, #00c6ff 60%, #845ec2 80%, #d65db1 100%)',
        'gradient-button': 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 20%, #47cf73 40%, #00c6ff 60%, #845ec2 80%, #d65db1 100%)',
        'gradient-border': 'linear-gradient(135deg, #ff5f6d 0%, #ffc371 20%, #47cf73 40%, #00c6ff 60%, #845ec2 80%, #d65db1 100%)',
      },
      // Sharp-corner design system with gradient theme
      boxShadow: {
        'sharp-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sharp': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'sharp-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'sharp-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'sharp-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'sharp-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'sharp-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'gradient-glow': '0 0 0 1px rgba(255, 95, 109, 0.1), 0 4px 16px rgba(255, 95, 109, 0.12)',
        'gradient-glow-lg': '0 0 0 1px rgba(255, 95, 109, 0.2), 0 8px 32px rgba(255, 95, 109, 0.15)',
        'gradient-border': '0 0 0 1px transparent, 0 0 0 1px rgba(255, 95, 109, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      fontFamily: {
        sans: ['var(--font-krub)', 'system-ui', 'sans-serif'],
        raleway: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
        krub: ['var(--font-krub)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'ripple': 'ripple 0.6s linear',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'press': 'press 0.1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 95, 109, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 95, 109, 0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(255, 95, 109, 0.7)',
            transform: 'scale(1)'
          },
          '70%': { 
            boxShadow: '0 0 0 10px rgba(255, 95, 109, 0)',
            transform: 'scale(1.02)'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'sharp': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'sharp-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'sharp-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'sharp-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
