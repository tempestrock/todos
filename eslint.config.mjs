/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

// see also https://typescript-eslint.io/getting-started

import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import imprt from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Turn on eslint's recommended config.
  eslint.configs.recommended,

  // Turn on Typescript rules that utilize the power of TypeScript's type checking APIs.
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Plugins that extend the standard eslint functionality.
  {
    plugins: {
      import: imprt,
    },
  },

  // Switch off type checking for all .js files.
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Switch off linting for specific files.
  {
    ignores: ['assets/*.js', 'build/**', 'eslint.config.mjs', '.eslintrc.cjs'],
  },

  // Define custom rules.
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': [
        // allow to use unused variables with an '_' prefix
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external', 'internal']],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },

  // Make sure that eslint and prettier are working in line with each other.
  eslintConfigPrettier
)
