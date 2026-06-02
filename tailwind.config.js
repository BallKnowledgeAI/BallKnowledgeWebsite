/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light': {
          'bg': 'rgb(245 249 252 / <alpha-value>)',
          'surface': 'rgb(255 255 255 / <alpha-value>)',
          'surface-elevated': 'rgb(235 243 252 / <alpha-value>)',
          'primary': 'rgb(31 60 136 / <alpha-value>)',
          'secondary': 'rgb(59 167 240 / <alpha-value>)',
          'pitch-green': 'rgb(39 174 96 / <alpha-value>)',
          'text': {
            'primary': 'rgb(28 28 30 / <alpha-value>)',
            'muted': 'rgb(138 148 166 / <alpha-value>)',
          },
          'border': 'rgba(31, 60, 136, 0.1)',
        },
        'dark': {
          'bg': 'rgb(10 14 26 / <alpha-value>)',
          'surface': 'rgb(17 24 39 / <alpha-value>)',
          'surface-elevated': 'rgb(26 34 54 / <alpha-value>)',
          'primary': 'rgb(59 167 240 / <alpha-value>)',
          'secondary': 'rgb(31 60 136 / <alpha-value>)',
          'pitch-green': 'rgb(46 204 113 / <alpha-value>)',
          'text': {
            'primary': 'rgb(255 255 255 / <alpha-value>)',
            'muted': 'rgb(138 148 166 / <alpha-value>)',
          },
          'border': 'rgba(59, 167, 240, 0.12)',
        },
      },
      fontFamily: {
        barlow: 'var(--font-barlow-condensed)',
        inter: 'var(--font-inter)',
      },
    },
  },
  plugins: [],
}
