import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ['@mysten/sui', 'bignumber.js', 'zod'],
  minify: process.env.NODE_ENV === 'production',
  watch: process.env.NODE_ENV === 'development',
});
