import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#111827',
        accent: '#38bdf8',
        subtle: '#1f2937'
      }
    }
  },
  plugins: []
};

export default config;
