import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

// ---------------------------------------------------------------------------
// Themeable palette: every colour class resolves to a CSS variable, so the
// same markup renders in dark (default) and light (<html data-theme="light">).
// ---------------------------------------------------------------------------
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Dark theme slate: brighter mid-greys so secondary text stays readable on glass panels
const slateDark = { ...colors.slate, 300: '#dbe4ef', 400: '#bac6d6', 500: '#9eabbe' };

// Light theme slate: the scale is flipped — "950" backgrounds become pale, "100" text becomes ink
const slateLight = {
  50: '#020617', 100: '#0b1324', 200: '#1e293b', 300: '#334155', 400: '#475569',
  500: '#56667c', 600: '#94a3b8', 700: '#cbd5e1', 800: '#dfe5ee', 900: '#f1f4f9', 950: '#e8edf4',
};

// Accents in light mode: pale text shades map to deep ones (300 -> 800) so text clears 4.5:1 on white; solid 600/700 fills stay put
const ACCENT_LIGHT_MAP = { 50: 950, 100: 950, 200: 900, 300: 800, 400: 700, 500: 600, 600: 600, 700: 700, 800: 200, 900: 100, 950: 50 };
const ACCENTS = ['cyan', 'emerald', 'amber', 'rose', 'violet', 'purple'];

const toChannels = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

function buildVars(theme) {
  const vars = {};
  SHADES.forEach((s) => {
    vars[`--c-slate-${s}`] = toChannels((theme === 'dark' ? slateDark : slateLight)[s]);
  });
  ACCENTS.forEach((name) => {
    SHADES.forEach((s) => {
      const src = theme === 'dark' ? s : ACCENT_LIGHT_MAP[s];
      vars[`--c-${name}-${s}`] = toChannels(colors[name][src]);
    });
  });
  return vars;
}

const varPalette = (name) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--c-${name}-${s}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: Object.fromEntries(['slate', ...ACCENTS].map((n) => [n, varPalette(n)])),
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': buildVars('dark'),
        ':root[data-theme="light"]': buildVars('light'),
      });
    }),
  ],
}
