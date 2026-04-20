/** @type {import('tailwindcss').Config} */
// Tokens in this file are the source of truth referenced by DESIGN_SYSTEM.md.
// Colors, radii, shadows, and motion live here; `brand-*` is preserved as an
// alias of `primary-*` so existing components keep working while new code can
// adopt the full token names.

const primary = {
  50:  '#EEF1FF',
  100: '#DCE3FE',
  200: '#BBC8FC',
  300: '#91A6F9',
  400: '#6682F3',
  500: '#4762E9',
  600: '#3548D0',
  700: '#2B3AA6',
  800: '#222E80',
  900: '#1A2460',
};

const secondary = {
  50:  '#EEFBFA',
  100: '#CEF4F0',
  200: '#A7EBE2',
  300: '#6DDDCE',
  400: '#36CAB6',
  500: '#13B5A1',
  600: '#0F9383',
  700: '#0B6E63',
  800: '#094F47',
  900: '#06332E',
};

const accent = {
  50:  '#FFF1EC',
  100: '#FFDECF',
  200: '#FFC6A9',
  300: '#FFAF93',
  400: '#FF8F6E',
  500: '#FF6B3D',
  600: '#E54F22',
  700: '#B63B17',
  800: '#852910',
  900: '#551808',
};

const neutral = {
  0:   '#FFFFFF',
  50:  '#F8F8F7',
  100: '#F1F0EE',
  200: '#E5E3DF',
  300: '#D2D0CB',
  400: '#A09E98',
  500: '#6B6963',
  600: '#4B4945',
  700: '#34332F',
  800: '#1F1E1C',
  850: '#1A1A18',
  900: '#0F0F0E',
};

const success = { 50: '#EAFBF0', 100: '#CBF3D8', 500: '#1DB954', 600: '#159744', 700: '#12793A' };
const warning = { 50: '#FFF8E6', 100: '#FEEBBF', 500: '#F5A623', 600: '#D48612', 700: '#A86D0E' };
const error   = { 50: '#FDECEC', 100: '#F8CED1', 500: '#E5484D', 600: '#C43338', 700: '#A52A2F' };
const info    = { 50: '#EAF4FF', 100: '#C9E2FC', 500: '#2E86F5', 600: '#1E6BD1', 700: '#1554A6' };

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary,
        secondary,
        accent,
        neutral,
        success,
        warning,
        error,
        info,
        brand: primary, // legacy alias, kept for backwards compatibility
      },
      fontFamily: {
        display: ['"Fraunces"', '"Source Serif Pro"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-1': ['4rem', { lineHeight: '4.25rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1':        ['2.5rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2':        ['2rem',   { lineHeight: '2.25rem', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3':        ['1.5rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h4':        ['1.25rem',{ lineHeight: '1.5rem',  fontWeight: '600' }],
        'h5':        ['1.125rem',{ lineHeight: '1.5rem', fontWeight: '600' }],
        'h6':        ['1rem',   { lineHeight: '1.25rem', fontWeight: '600' }],
        'body-lg':   ['1.125rem',{ lineHeight: '1.75rem' }],
        'body':      ['1rem',   { lineHeight: '1.5rem' }],
        'body-sm':   ['0.875rem',{ lineHeight: '1.25rem' }],
        'caption':   ['0.75rem',{ lineHeight: '1rem' }],
        'label':     ['0.75rem',{ lineHeight: '1rem', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '20px',
        '2xl': '28px',
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(16, 18, 36, 0.04)',
        'sm': '0 1px 3px rgba(16, 18, 36, 0.06), 0 1px 2px rgba(16, 18, 36, 0.04)',
        'md': '0 8px 24px -8px rgba(16, 18, 36, 0.12), 0 2px 6px rgba(16, 18, 36, 0.06)',
        'lg': '0 20px 40px -16px rgba(16, 18, 36, 0.18), 0 4px 12px rgba(16, 18, 36, 0.08)',
        'xl': '0 28px 64px -24px rgba(16, 18, 36, 0.24), 0 8px 20px rgba(16, 18, 36, 0.10)',
        'ring-primary': '0 0 0 3px rgba(71, 98, 233, 0.30)',
      },
      transitionDuration: {
        instant: '80ms',
        fast: '150ms',
        base: '220ms',
        slow: '320ms',
        lazy: '500ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
        decel:    'cubic-bezier(0, 0, 0.2, 1)',
        accel:    'cubic-bezier(0.4, 0, 1, 1)',
        spring:   'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      spacing: {
        '0.5': '2px',
      },
    },
  },
  plugins: [],
};
