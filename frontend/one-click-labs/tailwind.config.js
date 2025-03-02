/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './node_modules/novel/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card-background)",
        "border-color": "var(--border-color)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
      },
      novel: {
        prose: 'prose dark:prose-invert max-w-none',
        border: 'border-gray-200 dark:border-gray-700'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
