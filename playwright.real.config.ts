import { defineConfig } from "@playwright/test";

/**
 * 本物の github.com に対するテスト（e2e/real/）用の設定。
 * ネットワークに出るため通常の playwright.config.ts からは分離し、CI の real-github ジョブで回す。
 */
export default defineConfig({
  testDir: "./e2e/real",
  timeout: 60_000,
  workers: 1,
  // 一時的なネットワーク不調と UI 変更を区別するため 1 回だけ再試行する
  retries: 1,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
  },
});
