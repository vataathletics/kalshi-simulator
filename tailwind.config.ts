import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0b1220',
        panel: '#111a2b',
        border: '#25314a',
        accent: '#38bdf8',
        profit: '#22c55e',
        loss: '#f43f5e'
      }
    }
  },
  plugins: [],
};

export default config;
