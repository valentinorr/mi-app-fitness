/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hallmark Sport theme tokens
        paper: {
          DEFAULT: 'oklch(98% 0.005 250)',
          2: 'oklch(95% 0.006 250)',
          3: 'oklch(91.5% 0.007 250)',
        },
        ink: {
          DEFAULT: 'oklch(16% 0.080 260)',
          2: 'oklch(22% 0.060 258)',
          muted: 'oklch(50% 0.020 250)',
        },
        rule: {
          DEFAULT: 'oklch(78% 0.008 250)',
          2: 'oklch(36% 0.060 255)',
        },
        accent: {
          DEFAULT: 'oklch(88% 0.200 120)',
          ink: 'oklch(16% 0.080 260)',
          deep: 'oklch(58% 0.145 125)',
        },
        focus: 'oklch(58% 0.145 125)',
        slot: 'oklch(76% 0.07 258)',
      },
      fontFamily: {
        display: ['Saira Condensed', 'sans-serif'],
        body: ['Albert Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        outlier: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-s': ['1.25rem', { lineHeight: '1.02', letterSpacing: '-0.015em', fontWeight: '800', textTransform: 'uppercase' }],
        'display-m': ['1.875rem', { lineHeight: '1.02', letterSpacing: '-0.015em', fontWeight: '800', textTransform: 'uppercase' }],
        'display-l': ['2.5rem', { lineHeight: '1.02', letterSpacing: '-0.015em', fontWeight: '800', textTransform: 'uppercase' }],
      },
      borderRadius: {
        card: '4px',
        pill: '4px',
      },
      borderWidth: {
        hair: '1px',
        bar: '2px',
      },
      boxShadow: {
        card: 'none',
      },
      letterSpacing: {
        display: '-0.015em',
      },
      fontWeight: {
        display: '800',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}