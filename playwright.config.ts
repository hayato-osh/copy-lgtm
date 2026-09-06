import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // 本物の GitHub に出るテストは playwright.real.config.ts で別実行する
  testIgnore: ["**/real/**"],
  timeout: 30_000,
  // 拡張機能はpersistent contextを使うためworker並列だとプロファイルが競合しやすい
  workers: 1,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
  },
});
