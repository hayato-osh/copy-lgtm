/**
 * 本物の github.com に対して拡張機能を動かし、GitHub 側の UI 変更で壊れていないかを検知する。
 * フィクスチャ（e2e/pages/）では追従できない破壊を拾うためのテストなので、
 * 通常の `pnpm test:e2e` からは外し、CI（ci.yml の real-github ジョブ）で PR ごとに回す。
 *
 * - 未ログイン: GitHub は旧UI（/files, .pr-review-tools）を返すので、旧UIへの注入を検証する
 * - ログイン済み（GH_UI_CHECK_STORAGE_STATE がある場合）: 新UI（/changes）への注入と画像挿入まで検証する
 */
import { copyLgtmButton, expect, test } from "../fixtures";

/**
 * 検証に使う公開 PR。「Sample PR」として open のまま維持しているもの。
 * マージ済み PR だとダイアログが "Finish your comments" になり Approve ラジオが出ないため、open な PR が必要。
 * 作者自身の PR なので Approve は disabled で、誤って承認されることはない（レビューも送信しない）
 */
const PR_URL = "https://github.com/hayato-osh/copy-lgtm/pull/18";

type StorageState = {
  cookies: Parameters<
    import("@playwright/test").BrowserContext["addCookies"]
  >[0];
};

const loadStorageState = (): StorageState | null => {
  const raw = process.env.GH_UI_CHECK_STORAGE_STATE;
  if (!raw) return null;
  let state: StorageState;
  try {
    state = JSON.parse(raw) as StorageState;
  } catch {
    throw new Error(
      "GH_UI_CHECK_STORAGE_STATE が JSON として読めません（playwright の storageState 形式を渡してください）",
    );
  }
  // ログイン完了前に保存された状態（logged_in=no）を、UI変更による破壊と区別して弾く
  if (!state.cookies?.some((cookie) => cookie.name === "user_session")) {
    throw new Error(
      "GH_UI_CHECK_STORAGE_STATE にログイン済みのセッション（user_session クッキー）が含まれていません。pnpm auth:github でログインを完了させてから保存し直し、シークレットを更新してください",
    );
  }
  return state;
};

test.describe("本物の GitHub", () => {
  test("未ログイン: 旧UIの差分ページ(/files)に Copy LGTM ボタンが注入される", async ({
    context,
  }) => {
    const page = await context.newPage();
    await page.goto(`${PR_URL}/files`, { waitUntil: "domcontentloaded" });

    // 拡張機能が依存しているアンカーが GitHub 側に残っているか
    await expect(
      page.locator(".pr-toolbar > .diffbar > .pr-review-tools"),
      "旧UIのアンカー .pr-toolbar > .diffbar > .pr-review-tools が見つからない（GitHub の DOM が変わった可能性）",
    ).toBeAttached();

    await expect(copyLgtmButton(page)).toBeVisible();
  });

  test("ログイン済み: 新UIの差分ページ(/changes)で画像が挿入される", async ({
    context,
  }) => {
    const state = loadStorageState();
    test.skip(
      !state,
      "GH_UI_CHECK_STORAGE_STATE が未設定のためスキップ（新UIはログインが必要）",
    );
    if (!state) return;

    await context.addCookies(state.cookies);
    const page = await context.newPage();
    await page.goto(`${PR_URL}/changes`, { waitUntil: "domcontentloaded" });

    // 認証切れは「UI変更による破壊」と区別して分かるようにする
    const login = await page
      .locator('meta[name="user-login"]')
      .getAttribute("content");
    expect(
      login,
      "GitHub にログインできていません。GH_UI_CHECK_STORAGE_STATE のセッションが切れている可能性があります（pnpm auth:github で作り直してください）",
    ).toBeTruthy();

    // 新UIが提供されなくなって /files に戻されるケースも破壊として検知したい
    await expect(page).toHaveURL(/\/pull\/\d+\/changes(\/|$)/);
    await expect(
      page.locator('button[class*="ReviewMenuButton"]'),
      '新UIのアンカー button[class*="ReviewMenuButton"] が見つからない（GitHub の DOM が変わった可能性）',
    ).toBeAttached();

    const button = copyLgtmButton(page);
    await expect(button).toBeVisible();
    await button.click();

    const textarea = page.locator('textarea[aria-label="Markdown value"]');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(
      /<img alt="LGTM" src="https:\/\/[^"]+" width="600px" \/>/,
    );
    await expect(page.getByText("Success!")).toBeVisible();

    // Approve ラジオも残っているか（作者自身の PR なので disabled。送信はしない）
    await expect(
      page.locator('input[type="radio"][name="reviewEvent"][value="approve"]'),
      '新UIの Approve ラジオ input[name="reviewEvent"][value="approve"] が見つからない（GitHub の DOM が変わった可能性）',
    ).toBeAttached();
  });
});
