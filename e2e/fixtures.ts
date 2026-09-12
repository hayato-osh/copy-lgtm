/// <reference types="chrome" />
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type BrowserContext,
  test as base,
  chromium,
  type Page,
} from "@playwright/test";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(dirname, "../build/chrome-mv3-prod");
const pagesDir = path.resolve(dirname, "pages");

type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  /** GitHubのURLに対してフィクスチャHTMLを返すようにする */
  serveGitHubPage: (fixtureFile: string) => Promise<void>;
  /** @plasmohq/storage 形式（JSON文字列）で拡張機能のストレージに値を入れる */
  seedStorage: (values: Record<string, unknown>) => Promise<void>;
};

export const test = base.extend<ExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwrightのfixture APIの仕様
  context: async ({}, use) => {
    if (!existsSync(path.join(extensionPath, "manifest.json"))) {
      throw new Error(
        `拡張機能のビルドが見つかりません: ${extensionPath}\n先に pnpm build を実行してください（pnpm test:e2e はビルド込みで実行します）`,
      );
    }

    // MV3拡張はpersistent contextでのみ動く。channel: "chromium"なら新ヘッドレスで拡張が使える
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }
    await use(new URL(serviceWorker.url()).host);
  },

  serveGitHubPage: async ({ context }, use) => {
    await use(async (fixtureFile: string) => {
      await context.route("https://github.com/**", (route) =>
        route.fulfill({
          path: path.join(pagesDir, fixtureFile),
          contentType: "text/html",
        }),
      );
    });
  },

  seedStorage: async ({ context }, use) => {
    await use(async (values: Record<string, unknown>) => {
      // 拡張機能のサービスワーカー上でchrome.storage.syncに書き込む
      let [serviceWorker] = context.serviceWorkers();
      if (!serviceWorker) {
        serviceWorker = await context.waitForEvent("serviceworker");
      }
      const serialized = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          JSON.stringify(value),
        ]),
      );
      const stored = await serviceWorker.evaluate(async (items) => {
        await chrome.storage.sync.set(items);
        return chrome.storage.sync.get(null);
      }, serialized);
      for (const [key, value] of Object.entries(serialized)) {
        if (stored[key] !== value) {
          throw new Error(
            `ストレージのシードに失敗: ${key} = ${JSON.stringify(stored[key])}`,
          );
        }
      }
    });
  },
});

export const expect = test.expect;

/** Copy LGTMボタン（Plasmoのshadow DOM内）を取得 */
export const copyLgtmButton = (page: Page) =>
  page.getByRole("button", { name: "Copy LGTM" });
