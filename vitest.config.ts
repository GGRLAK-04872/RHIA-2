import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["apps/**/*.test.{ts,tsx}", "packages/**/*.test.ts"],
    setupFiles: ["./apps/web/src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["apps/web/src/**/*.{ts,tsx}", "packages/*/src/**/*.ts"],
      exclude: ["**/*.test.{ts,tsx}", "**/main.tsx", "**/env.d.ts"],
    },
  },
});
