/**
 * 本物の GitHub に対する E2E（e2e/real/）用に、ログイン状態を .github-auth.json に保存するスクリプト
 *
 * 1. ブラウザを開いて GitHub のログインページを表示する
 * 2. ログイン（2FA まで）が完了して user_session クッキーが発行されるのを待つ
 * 3. Playwright の storageState 形式で .github-auth.json に保存する
 *
 * 実行: pnpm auth:github
 * 保存後: gh secret set GH_UI_CHECK_STORAGE_STATE < .github-auth.json
 */
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "@playwright/test";

const outputPath = ".github-auth.json";
const timeoutMs = 10 * 60 * 1000;

const browser = await chromium.launch({ headless: false, channel: "chromium" });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto("https://github.com/login");

console.log(
  "開いたブラウザで GitHub にログインしてください（2FA まで完了させる）。ログインを検知したら自動で保存します。",
);

const deadline = Date.now() + timeoutMs;
let loggedIn = false;
while (Date.now() < deadline) {
  const cookies = await context.cookies("https://github.com");
  if (cookies.some((cookie) => cookie.name === "user_session")) {
    loggedIn = true;
    break;
  }
  await sleep(1000);
}

if (!loggedIn) {
  console.error(
    "ログインを検知できませんでした（タイムアウト）。もう一度実行してください。",
  );
  await browser.close();
  process.exit(1);
}

await context.storageState({ path: outputPath });
await browser.close();

console.log(`保存しました: ${outputPath}`);
console.log(
  `次に実行: gh secret set GH_UI_CHECK_STORAGE_STATE < ${outputPath}`,
);
