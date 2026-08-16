import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^abis$/, replacement: `${srcPath}/abis/index.ts` },
      { find: /^abis\/index$/, replacement: `${srcPath}/abis/index.ts` },
      { find: /^abis\/(.*)$/, replacement: `${srcPath}/abis/$1` },
      { find: /^configs\/(.*)$/, replacement: `${srcPath}/configs/$1` },
      { find: /^modules\/(.*)$/, replacement: `${srcPath}/modules/$1` },
      { find: /^types\/(.*)$/, replacement: `${srcPath}/types/$1` },
      { find: /^utils\/(.*)$/, replacement: `${srcPath}/utils/$1` },
      { find: /^prebuilt$/, replacement: `${srcPath}/prebuild/index.ts` },
    ],
  },
});
