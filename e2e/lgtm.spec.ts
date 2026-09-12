import { copyLgtmButton, expect, test } from "./fixtures";

const LGTM_URL = "https://example.com/lgtm.png";
const LGTM_IMG = `<img alt="LGTM" src="${LGTM_URL}" width="600px" />`;

test("新UI: ボタンが注入され、クリックでLGTM画像がtextareaに入る", async ({
  context,
  serveGitHubPage,
  seedStorage,
}) => {
  await seedStorage({ urls: [LGTM_URL] });
  await serveGitHubPage("new-ui.html");

  const page = await context.newPage();
  await page.goto("https://github.com/test-owner/test-repo/pull/1/changes");

  const button = copyLgtmButton(page);
  await expect(button).toBeVisible();
  await button.click();

  const textarea = page.getByLabel("Markdown value");
  await expect(textarea).toHaveValue(LGTM_IMG);
  await expect(page.getByText("Success!")).toBeVisible();

  // AutomaticallySelect未設定ならApproveは選択されない
  await expect(
    page.locator('input[name="reviewEvent"][value="approve"]'),
  ).not.toBeChecked();
});

test("新UI: AutomaticallySelect有効ならApproveも選択される", async ({
  context,
  serveGitHubPage,
  seedStorage,
}) => {
  await seedStorage({ urls: [LGTM_URL], AutomaticallySelect: true });
  await serveGitHubPage("new-ui.html");

  const page = await context.newPage();
  await page.goto("https://github.com/test-owner/test-repo/pull/1/changes");

  await copyLgtmButton(page).click();

  await expect(page.getByLabel("Markdown value")).toHaveValue(LGTM_IMG);
  await expect(
    page.locator('input[name="reviewEvent"][value="approve"]'),
  ).toBeChecked();
});

test("新UI: textareaに既にLGTM画像があれば二重挿入しない", async ({
  context,
  serveGitHubPage,
  seedStorage,
}) => {
  await seedStorage({ urls: [LGTM_URL] });
  await serveGitHubPage("new-ui.html");

  const page = await context.newPage();
  await page.goto("https://github.com/test-owner/test-repo/pull/1/changes");

  // ダイアログを開いてtextareaに既存のLGTM画像を入れておく
  await page.locator('button[class*="ReviewMenuButton"]').click();
  const textarea = page.getByLabel("Markdown value");
  const existingValue = `nice work!\n${LGTM_IMG}`;
  await textarea.fill(existingValue);

  await copyLgtmButton(page).click();

  await expect(page.getByText("Success!")).toBeVisible();
  await expect(textarea).toHaveValue(existingValue);
});

test("旧UI: ボタンが注入され、クリックでLGTM画像がtextareaに入る", async ({
  context,
  serveGitHubPage,
  seedStorage,
}) => {
  await seedStorage({ urls: [LGTM_URL], AutomaticallySelect: true });
  await serveGitHubPage("old-ui.html");

  const page = await context.newPage();
  await page.goto("https://github.com/test-owner/test-repo/pull/1/files");

  const button = copyLgtmButton(page);
  await expect(button).toBeVisible();
  await button.click();

  await expect(page.locator("#pull_request_review_body")).toHaveValue(LGTM_IMG);
  await expect(
    page.locator('input[id="pull_request_review[event]_approve"]'),
  ).toBeChecked();
});

test("差分ページ以外にはボタンを注入しない", async ({
  context,
  serveGitHubPage,
}) => {
  await serveGitHubPage("overview.html");

  const page = await context.newPage();
  await page.goto("https://github.com/test-owner/test-repo/pull/1");

  // 注入が起きないことの確認なので、コンテンツスクリプトが動く猶予を与えてから検証する
  await expect(page.locator("body")).toContainText("Conversation");
  await page.waitForTimeout(1000);
  await expect(copyLgtmButton(page)).toHaveCount(0);
});
