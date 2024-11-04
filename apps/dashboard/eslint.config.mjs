import pluginJs from '@eslint/js';
import ESLintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { files: ['**/*.js'], languageOptions: { sourceType: 'script' } },
  ESLintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '.next',
      'node_modules',
      'dist',
      'lib/auth/middleware.ts',
      'tailwind.config.ts',
      'prettierrc.cjs',
      'next.config.ts',
    ],
  },
  {
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
];
