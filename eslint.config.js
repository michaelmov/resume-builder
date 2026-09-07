import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

const bannedComponentType =
  'Declare the component as a function and let its return type be inferred, ' +
  'or annotate it as JSX.Element.';

export default [
  {
    ignores: [
      // Globbed with **/ so a build output anywhere — docs/dist, a nested
      // package — is skipped. A bare 'dist' only matches the repo root, which
      // let a stray docs/dist bundle through and produced thousands of errors.
      '**/dist',
      '**/node_modules',
      '*.config.js',
      '*.config.ts',
      'vite-env.d.ts',
      // Skill assets are templates meant to be copied into src/ before running,
      // so their relative imports don't resolve from here and linting them in
      // place only produces noise.
      '.agents',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      // Disallow console.log statements (but allow console.error and console.info)
      'no-console': ['error', { allow: ['error', 'info'] }],

      // Import ordering rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // External packages (npm modules)
            'internal', // Internal modules (your own code)
            'parent', // Parent directories
            'sibling', // Sibling files
            'index', // Index files
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript instead

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // Components are plain functions: let TypeScript infer the return type,
      // or annotate it as JSX.Element. React.FC types the *variable* instead,
      // which drags in an implicit children prop, blocks generic components,
      // and hides the actual props type behind a wrapper.
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            FC: { message: bannedComponentType, suggest: ['JSX.Element'] },
            'React.FC': {
              message: bannedComponentType,
              suggest: ['JSX.Element'],
            },
            FunctionComponent: {
              message: bannedComponentType,
              suggest: ['JSX.Element'],
            },
            'React.FunctionComponent': {
              message: bannedComponentType,
              suggest: ['JSX.Element'],
            },
            VFC: { message: bannedComponentType, suggest: ['JSX.Element'] },
            'React.VFC': {
              message: bannedComponentType,
              suggest: ['JSX.Element'],
            },
            VoidFunctionComponent: {
              message: bannedComponentType,
              suggest: ['JSX.Element'],
            },
            'React.VoidFunctionComponent': {
              message: bannedComponentType,
              suggest: ['JSX.Element'],
            },
          },
        },
      ],

      // Import rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-self-import': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
];
