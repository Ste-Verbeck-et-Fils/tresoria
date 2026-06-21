import neostandard from 'neostandard'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import globals from 'globals'

export default [
  ...neostandard({
    globals: globals.browser,
  }),
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      camelcase: 'error',
      'react/jsx-pascal-case': 'error',
      'no-unused-vars': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-undef': 'off',
      '@stylistic/multiline-ternary': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'no-useless-escape': 'off',
      'no-return-assign': 'off',
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: ['dist'],
  },
]
