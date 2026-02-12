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
      'react-compiler/react-compiler': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },
];
