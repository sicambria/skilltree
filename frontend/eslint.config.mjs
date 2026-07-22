import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'build/**', 'dist/**', '*.config.*'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    settings: {
      react: { version: '18.3' },
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
      },
    },
    rules: {
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'warn',
      'react/require-default-props': 'off',
      'react/self-closing-comp': ['error', { component: true, html: true }],

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // JSX A11y
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',

      // Import ordering (FSD layers)
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            { pattern: '@/**', group: 'internal', position: 'before' },
            { pattern: '@/shared/**', group: 'internal', position: 'before' },
            { pattern: '@/entities/**', group: 'internal', position: 'before' },
            { pattern: '@/features/**', group: 'internal', position: 'before' },
            { pattern: '@/widgets/**', group: 'internal', position: 'before' },
            { pattern: '@/pages/**', group: 'internal', position: 'before' },
            { pattern: '@/app/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['builtin', 'external'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
      'import/no-unresolved': ['error', { ignore: ['^@/.*'] }],
      'import/no-cycle': 'error',
      'import/no-deprecated': 'warn',
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/vitest.setup.ts', '**/playwright.config.ts'] },
      ],

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
]);