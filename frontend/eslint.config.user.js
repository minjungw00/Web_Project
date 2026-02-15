/* eslint-disable import-x/extensions */
import reactCompiler from 'eslint-plugin-react-compiler';

import baseConfig from './eslint.config.js';

export default [
  ...baseConfig,
  {
    files: ['eslint.config.js', 'eslint.config.user.js'],
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: true },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['..', '../*', '../**'],
        },
      ],
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/shared/**',
              from: [
                './src/app/**',
                './src/pages/**',
                './src/application/**',
                './src/features/**',
                './src/entities/**',
              ],
            },
            {
              target: './src/entities/**',
              from: [
                './src/app/**',
                './src/pages/**',
                './src/application/**',
                './src/features/**',
              ],
            },
            {
              target: './src/features/**',
              from: ['./src/app/**', './src/pages/**', './src/application/**'],
            },
            {
              target: './src/application/**',
              from: ['./src/app/**', './src/pages/**', './src/features/**'],
            },
            {
              target: './src/pages/**',
              from: ['./src/app/**'],
            },
          ],
        },
      ],
      'react-compiler/react-compiler': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },
];
