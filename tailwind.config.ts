import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary, #ffffff)',
        foreground: 'var(--text-primary, #111827)',
        primary: {
          DEFAULT: 'var(--primary, #2563eb)',
          foreground: 'var(--primary-foreground, #ffffff)',
          hover: 'var(--primary-hover, #1d4ed8)',
        },
        secondary: {
          DEFAULT: 'var(--secondary, #f3f4f6)',
          foreground: 'var(--secondary-foreground, #111827)',
          hover: 'var(--secondary-hover, #e5e7eb)',
        },
        muted: {
          DEFAULT: 'var(--muted, #f9fafb)',
          foreground: 'var(--text-muted, #4b5563)',
        },
        accent: {
          DEFAULT: 'var(--accent, #2563eb)',
          foreground: 'var(--accent-foreground, #ffffff)',
          hover: 'var(--accent-hover, #1d4ed8)',
        },
        card: {
          DEFAULT: 'var(--bg-card, #ffffff)',
          foreground: 'var(--text-primary, #111827)',
          hover: 'var(--bg-card-hover, #f9fafb)',
        },
        border: 'var(--border, #111827)',
        input: 'var(--border, #111827)',
        ring: 'var(--primary, #2563eb)',
        error: {
          DEFAULT: 'var(--error, #dc2626)',
          foreground: '#ffffff',
          bg: '#fee2e2',
          border: 'rgba(220, 38, 38, 0.35)',
        },
        destructive: {
          DEFAULT: 'var(--error, #dc2626)',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: 'var(--success, #059669)',
          foreground: '#ffffff',
          bg: '#dcfce7',
          border: 'rgba(5, 150, 105, 0.35)',
        },
        warning: {
          DEFAULT: 'var(--warning, #d97706)',
          foreground: '#ffffff',
          bg: '#fef3c7',
        },
        info: {
          DEFAULT: 'var(--info, #4f46e5)',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm, 8px)',
        md: 'var(--radius-md, 12px)',
        lg: 'var(--radius-lg, 16px)',
        xl: 'var(--radius-xl, 24px)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm, 2px 2px 0px #111827)',
        md: 'var(--shadow-md, 6px 6px 0px #111827)',
        lg: 'var(--shadow-lg, 10px 10px 0px #111827)',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
