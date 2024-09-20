import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

const hexToRgb = (hex: string) => {
  hex = hex.replace('#', '')
  hex = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

export default {
  content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      typography: (theme: any) => ({
        // Default mode style for the markdown component.
        DEFAULT: {
          css: {
            '--tw-prose-links': theme('colors.blue.500'), // links of the form [foo](https://bar)
            '--tw-prose-pre-code': theme('colors.gray.100'), // code in ```these brackets```
            '--tw-prose-pre-bg': theme('colors.gray.600'), // the background color for the code in ```these brackets```
          },
        },

        // Dark mode style for the markdown component.
        // Please note: the actual standard text color cannot be defined here but needs
        //              to be defined as `dark:text-gray-100` in the 'className' where also the
        //              'dark:prose-dark' is used.
        dark: {
          css: {
            '--tw-prose-body': theme('colors.gray.100'),
            '--tw-prose-headings': theme('colors.gray.100'), // #, ##, etc.
            '--tw-prose-lead': theme('colors.gray.100'),
            '--tw-prose-links': theme('colors.blue.400'), // links of the form [foo](https://bar)
            '--tw-prose-bold': theme('colors.gray.100'),
            '--tw-prose-counters': theme('colors.gray.100'), // the numbers in a numbered list
            '--tw-prose-bullets': theme('colors.gray.100'), // bullet points (only the dots)
            '--tw-prose-hr': theme('colors.gray.100'),
            '--tw-prose-quotes': theme('colors.gray.100'),
            '--tw-prose-quote-borders': theme('colors.gray.100'),
            '--tw-prose-captions': theme('colors.gray.100'),
            '--tw-prose-kbd': theme('colors.gray.100'),
            '--tw-prose-kbd-shadows': hexToRgb(theme('colors.gray.100')),
            '--tw-prose-code': theme('colors.gray.100'), // code in `these brackets`
            '--tw-prose-pre-code': theme('colors.gray.100'), // code in ```these brackets```
            '--tw-prose-pre-bg': theme('colors.gray.500'), // the background color for the code in ```these brackets```
            '--tw-prose-th-borders': theme('colors.gray.100'),
            '--tw-prose-td-borders': theme('colors.gray.100'),
            '--tw-prose-invert-counters': theme('colors.gray.100'),
            '--tw-prose-invert-bullets': theme('colors.gray.100'),
            '--tw-prose-invert-hr': theme('colors.gray.100'),
            '--tw-prose-invert-quotes': theme('colors.gray.100'),
            '--tw-prose-invert-quote-borders': theme('colors.gray.100'),
            '--tw-prose-invert-captions': theme('colors.gray.100'),
            '--tw-prose-invert-kbd': theme('colors.gray.100'),
            '--tw-prose-invert-kbd-shadows': hexToRgb(theme('colors.gray.100')),
            '--tw-prose-invert-code': theme('colors.gray.900'),
            '--tw-prose-invert-pre-code': theme('colors.gray.100'),
            '--tw-prose-invert-pre-bg': 'rgb(0 0 0 / 50%)',
            '--tw-prose-invert-th-borders': theme('colors.gray.100'),
            '--tw-prose-invert-td-borders': theme('colors.gray.100'),
          },
        },
      }),
    },
  },
  darkMode: 'class',
  plugins: [typography],
} satisfies Config
