/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* ---------------------------------------------------------------
         * Brand - the ISCS indigo-blue.
         * Hue is carried over from the original palette so it still sits
         * with the logo; the ramp is rebuilt so each step is a usable
         * contrast level rather than an even gradient. 600 is the action
         * colour, 700 its hover, 50/100 the tints behind icons and chips.
         * ------------------------------------------------------------- */
        brand: {
          50: '#eef3ff',
          100: '#dce6ff',
          200: '#c0d2ff',
          300: '#97b4ff',
          400: '#6c8bfc',
          500: '#4a66f5',
          600: '#3147e6',
          700: '#2636c7',
          800: '#2431a1',
          900: '#233080',
          950: '#171e4e',
        },
        /* Secondary accent. Used sparingly - a stat tile, a chart series -
         * so rows of tiles are not five copies of the same blue. */
        accent: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        /* Sidebar - deep navy, slightly warmer than pure slate so the
         * brand blue stays distinguishable against it. */
        sidebar: {
          DEFAULT: '#0f1729',
          raised: '#161f35',
          hover: '#1d2740',
          active: '#3147e6',
          border: '#1f2a44',
          muted: '#8593ad',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        /* Display sizes get negative tracking - Inter is loose at scale. */
        'display-lg': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em', fontWeight: '680' }],
        'display': ['1.75rem', { lineHeight: '2.125rem', letterSpacing: '-0.025em', fontWeight: '680' }],
        'display-sm': ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '-0.02em', fontWeight: '650' }],
        'title': ['1.0625rem', { lineHeight: '1.5rem', letterSpacing: '-0.011em', fontWeight: '620' }],
        'body': ['0.875rem', { lineHeight: '1.375rem' }],
        'caption': ['0.8125rem', { lineHeight: '1.125rem' }],
        'micro': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        /* Containers get the large radii; controls stay tighter so a
         * button inside a card still reads as a separate object. */
        card: '14px',
        panel: '18px',
        control: '9px',
      },
      boxShadow: {
        /* Low-opacity layered shadows - lift without a grey halo.
         * `card` and `pop` keep their original names so nothing breaks. */
        xs: '0 1px 2px 0 rgb(16 24 40 / 0.05)',
        card: '0 1px 3px 0 rgb(16 24 40 / 0.07), 0 1px 2px -1px rgb(16 24 40 / 0.04)',
        raised: '0 4px 8px -2px rgb(16 24 40 / 0.08), 0 2px 4px -2px rgb(16 24 40 / 0.04)',
        float: '0 12px 16px -4px rgb(16 24 40 / 0.07), 0 4px 6px -2px rgb(16 24 40 / 0.03)',
        pop: '0 20px 28px -8px rgb(16 24 40 / 0.14), 0 8px 10px -6px rgb(16 24 40 / 0.05)',
        'brand-glow': '0 6px 16px -4px rgb(49 71 230 / 0.32)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.97)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 160ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
