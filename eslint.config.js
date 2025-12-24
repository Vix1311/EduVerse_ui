import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default tseslint.config(
  { ignores: ['dist', 'ignores'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    globals: {
      Atomics: 'readonly',
      SharedArrayBuffer: 'readonly',
    },
    env: {
      browser: true,
      es6: true,
      jest: true,
      node: true,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': [
        'warn',
        {
          quoteProps: 'as-needed',
          singleQuote: true,
          arrowParens: 'avoid',
          tabWidth: 2,
          endOfLine: 'auto',
          useTabs: false,
          printWidth: 100,
          proseWrap: 'always',
          bracketSpacing: true,
          trailingComma: 'all',
          semi: true,
          jsxSingleQuote: false,
          jsxBracketSameLine: false,
        },
      ],
      'no-console': 'error', // error on console.log
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
