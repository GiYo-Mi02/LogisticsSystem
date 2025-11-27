import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          black: '#050505',
          blue: '#0B0E14',
          dark: '#0B1026',
        },
        nasa: {
          blue: '#0B3D91',
          red: '#FC3D21',
          white: '#FFFFFF',
        },
        nebula: {
          purple: '#A855F7',
          pink: '#EC4899',
        },
        cyan: {
          glow: '#00D9FF',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'conic-gradient': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'space-gradient': 'radial-gradient(circle at 50% 50%, rgba(11, 61, 145, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 30%)',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-space)'],
      },
    },
  },
  plugins: [],
};
export default config;
