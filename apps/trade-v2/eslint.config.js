import { nextConfig } from '@repo/configs/eslint';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextConfig,
  {
    ignores: ['src/lib/charting_library/**'],
  },
];
