import type { Config } from 'tailwindcss';

/**
 * Every token is a CSS variable declared in app/globals.css, so light and dark
 * share one component layer and a theme change never touches a component.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        sunken: 'rgb(var(--sunken) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        rail: 'rgb(var(--rail) / <alpha-value>)',
        'rail-strong': 'rgb(var(--rail-strong) / <alpha-value>)',
        folder: 'rgb(var(--folder) / <alpha-value>)',
        'folder-wash': 'rgb(var(--folder-wash) / <alpha-value>)',
        file: 'rgb(var(--file) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'danger-wash': 'rgb(var(--danger-wash) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        'success-wash': 'rgb(var(--success-wash) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        // Quieter scale: 12 / 13 / 14 / 16 / 18 / 24 / 30
        '2xs': ['0.75rem', { lineHeight: '1.1rem' }],
        xs: ['0.8125rem', { lineHeight: '1.2rem' }],
        sm: ['0.875rem', { lineHeight: '1.4rem' }],
        base: ['1rem', { lineHeight: '1.6rem' }],
        lg: ['1.125rem', { lineHeight: '1.65rem', letterSpacing: '-0.01em' }],
        xl: ['1.5rem', { lineHeight: '1.9rem', letterSpacing: '-0.018em' }],
        '2xl': ['1.875rem', { lineHeight: '2.2rem', letterSpacing: '-0.022em' }],
      },
      borderRadius: {
        control: '3px',
        panel: '3px',
      },
      maxWidth: {
        prose: '68ch',
        shell: '1320px',
      },
    },
  },
  plugins: [],
};

export default config;
