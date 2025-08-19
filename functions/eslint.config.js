const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

module.exports = [
  // Base configuration for all files
  js.configs.recommended,
  
  // Configuration for JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.es6,
        ...globals.node,
      },
    },
    plugins: {
      'import': importPlugin,
    },
    rules: {
      // Import plugin rules
      'import/no-unresolved': 'off',
      
      // Google style guide rules
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'object-curly-spacing': ['error', 'always'],
      'multiline-ternary': ['error', 'always'],
    },
  },
  
  // Configuration for TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.es6,
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'import': importPlugin,
    },
    rules: {
      // TypeScript ESLint recommended rules
      ...tseslint.configs.recommended.rules,
      
      // Import plugin rules
      'import/no-unresolved': 'off',
      
      // Google style guide rules
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'object-curly-spacing': ['error', 'always'],
      'multiline-ternary': ['error', 'always'],
    },
  },
  // Ignore patterns
  {
    ignores: ['lib/**/*'],
  },
];