import type { UserConfig } from "vite";

export default {
  resolve: {
    alias: {
      "@core": "/src/core",
      "~": "/src/projects",
    },
  },
} satisfies UserConfig;
