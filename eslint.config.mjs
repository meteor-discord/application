import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import regexpPlugin from 'eslint-plugin-regexp';
import importSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

export default defineConfig(
  {
    files: ['**/*.{ts,tsx,js,mjs,jsx}'],
  },
  {
    ignores: ['node_modules/**'],
  },
  eslint.configs.recommended,
  regexpPlugin.configs['flat/recommended'],
  {
    plugins: {
      'simple-import-sort': importSort,
      'unused-imports': unusedImports,
    },
    rules: {
      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',

      // General ESLint rules
      'dot-notation': 'error',
      eqeqeq: 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-extra-bind': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      'unicode-bom': ['error', 'never'],
    },
  }
);
