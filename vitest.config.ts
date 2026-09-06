import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // E2E（e2e/ 配下、Playwright）は含めない
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
