import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import regexpPlugin from 'eslint-plugin-regexp';
import importSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default defineConfig(
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
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
      eqeqeq: 'warn',
      'no-case-declarations': 'warn',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-dupe-keys': 'error',
      'no-empty': 'warn',
      'no-extra-bind': 'error',
      'no-irregular-whitespace': 'warn',
      'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'warn',
      'no-undef': 'warn',
      'no-undef-init': 'error',
      'no-unreachable': 'warn',
      'no-unused-vars': 'warn',
      'no-useless-escape': 'warn',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'warn',
      'prefer-object-spread': 'error',
      'unicode-bom': ['error', 'never'],
    },
  }
);
