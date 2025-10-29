/**
 * コンポーネントのスタイルを読み込む
 */
import githubStyle from "data-text:./github-pr.module.pcss";
import { sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";
import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo";
import { useCallback, useState } from "react";
import * as style from "./github-pr.module.pcss";

const styleText = githubStyle;

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*"],
};

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

// ========================================
// セキュリティ関数
// ========================================

/**
 * 画像URLが安全かどうかを検証
 * - HTTPSのみを許可
 * - 画像拡張子のチェック（信頼できるドメインは拡張子なしでも許可）
 * - SVG画像は信頼できるドメインのみ許可（XSS対策）
 */
const isValidImageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    // HTTPSのみ許可
    if (parsedUrl.protocol !== "https:") {
      console.warn(`Blocked non-HTTPS URL: ${url}`);
      return false;
    }

    // 信頼できるドメイン（Firebase Storage等）
    const trustedDomains = [
      "storage.googleapis.com",
      "firebasestorage.googleapis.com",
    ];

    const isTrustedDomain = trustedDomains.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`),
    );

    // 信頼できるドメインの場合、拡張子チェックをスキップ
    if (isTrustedDomain) {
      return true;
    }

    // その他のドメインは拡張子チェックを行う
    const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const pathname = parsedUrl.pathname.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) =>
      pathname.endsWith(ext),
    );

    if (!hasValidExtension) {
      console.warn(`Image URL does not have a valid image extension: ${url}`);
      return false;
    }

    // SVG画像のみドメインチェック（JavaScriptを含む可能性があるため）
    if (pathname.endsWith(".svg")) {
      const trustedDomainsForSvg = [
        "storage.googleapis.com",
        "firebasestorage.googleapis.com",
        "githubusercontent.com",
        "cdn.jsdelivr.net",
      ];

      const isTrustedDomain = trustedDomainsForSvg.some(
        (domain) =>
          parsedUrl.hostname === domain ||
          parsedUrl.hostname.endsWith(`.${domain}`),
      );

      if (!isTrustedDomain) {
        console.warn(
          `Blocked SVG from untrusted domain for security: ${parsedUrl.hostname}`,
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Invalid URL format:", url, error);
    return false;
  }
};

/**
 * 画像URL配列をサニタイズ
 */
const sanitizeImageUrls = (urls: unknown): string[] => {
  // 配列でない場合は空配列を返す
  if (!Array.isArray(urls)) {
    console.warn("Invalid image URLs format: not an array");
    return [];
  }

  // 各URLを検証し、有効なもののみを返す
  return urls.filter((url): url is string => {
    if (typeof url !== "string") {
      console.warn("Invalid image URL: not a string", url);
      return false;
    }

    return isValidImageUrl(url);
  });
};

/**
 * HTMLを安全にエスケープ
 */
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ========================================
// ユーティリティ関数
// ========================================

/**
 * Review changesボタンを取得（新旧UI両対応）
 */
const findReviewChangesButton = (): HTMLButtonElement | null => {
  // 方法1: "Review changes"ボタンを探す（旧UI・新UI共通）
  const reviewChangesButton = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).find((btn) => btn.textContent?.trim().includes("Review changes"));

  if (reviewChangesButton) return reviewChangesButton;

  // 方法2: Submit reviewボタン（新UI）
  const submitReviewButton = document.querySelector<HTMLButtonElement>(
    'button[class*="ReviewMenuButton"]',
  );

  if (submitReviewButton) return submitReviewButton;

  // 方法3: data-variant="primary"で探す（フォールバック）
  return (
    Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        'button[data-variant="primary"]',
      ),
    ).find((btn) => btn.textContent?.includes("Submit review")) || null
  );
};

/**
 * レビューコメントのtextareaを取得（新旧UI両対応）
 */
const findReviewTextarea = (): HTMLTextAreaElement | null => {
  // 旧UI: IDで取得
  const oldUITextarea = document.getElementById(
    "pull_request_review_body",
  ) as HTMLTextAreaElement;
  if (oldUITextarea) return oldUITextarea;

  // 新UI: aria-labelで取得
  const newUITextarea = document.querySelector<HTMLTextAreaElement>(
    'textarea[aria-label="Markdown value"]',
  );
  if (newUITextarea) return newUITextarea;

  // フォールバック: placeholderで取得
  return document.querySelector<HTMLTextAreaElement>(
    'textarea[placeholder="Leave a comment"]',
  );
};

/**
 * textareaが表示されるまで待機
 */
const waitForTextarea = (
  maxAttempts = 30,
  intervalMs = 100,
): Promise<HTMLTextAreaElement | null> => {
  return new Promise((resolve) => {
    let attempts = 0;

    const checkTextarea = () => {
      const textarea = findReviewTextarea();

      if (textarea) {
        resolve(textarea);
        return;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        resolve(null);
        return;
      }

      setTimeout(checkTextarea, intervalMs);
    };

    checkTextarea();
  });
};

/**
 * textareaに値を設定（React対応）
 */
const setTextareaValue = (textarea: HTMLTextAreaElement, value: string) => {
  // フォーカスを当てる
  textarea.focus();

  // ネイティブのsetterを使用してReactの変更検知を回避
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(textarea, value);
  } else {
    textarea.value = value;
  }

  // Reactにイベントを通知
  const inputEvent = new InputEvent("input", {
    bubbles: true,
    cancelable: true,
    inputType: "insertText",
    data: value,
  });
  textarea.dispatchEvent(inputEvent);

  const changeEvent = new Event("change", { bubbles: true });
  textarea.dispatchEvent(changeEvent);

  // 少し待ってからblur（Reactの更新を確実にする）
  setTimeout(() => {
    textarea.blur();
  }, 50);
};

/**
 * Approveラジオボタンを取得（新旧UI両対応）
 */
const findApproveRadioButton = (): HTMLInputElement | null => {
  // 旧UI: IDで取得
  const oldUIRadio = document.getElementById(
    "pull_request_review[event]_approve",
  ) as HTMLInputElement;
  if (oldUIRadio) return oldUIRadio;

  // 新UI: name="reviewEvent" かつ value="approve"で取得
  return document.querySelector<HTMLInputElement>(
    'input[type="radio"][name="reviewEvent"][value="approve"]',
  );
};

/**
 * Approveラジオボタンを選択（React対応）
 */
const selectApproveOption = (radioButton: HTMLInputElement) => {
  radioButton.checked = true;
  // Reactにイベントを通知
  const changeEvent = new Event("change", { bubbles: true });
  radioButton.dispatchEvent(changeEvent);
};

// ========================================
// Plasmo設定
// ========================================

/**
 * Copy LGTMボタンを配置する位置を決定
 */
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => {
  // PRのFilesページでのみ動作
  const isPRFilesPage =
    window.location.pathname.includes("/pull/") &&
    window.location.pathname.includes("/files");

  if (!isPRFilesPage) {
    return [];
  }

  // 新UI: Submit reviewボタンの直後に配置
  const submitButton = document.querySelector<HTMLButtonElement>(
    'button[class*="ReviewMenuButton"]',
  );
  if (submitButton) {
    return [{ element: submitButton, insertPosition: "afterend" }];
  }

  // 新UI: data-variant="primary"とテキスト内容で探す
  const primaryButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(
      'button[data-variant="primary"]',
    ),
  );
  const submitReviewButton = primaryButtons.find((btn) =>
    btn.textContent?.includes("Submit review"),
  );
  if (submitReviewButton) {
    return [{ element: submitReviewButton, insertPosition: "afterend" }];
  }

  // 旧UI: pr-review-toolsの直後に配置
  const oldToolbar = document.querySelector(
    ".pr-toolbar > .diffbar > .pr-review-tools",
  );
  if (oldToolbar) {
    return [{ element: oldToolbar, insertPosition: "afterend" }];
  }

  return [];
};

// ========================================
// メインコンポーネント
// ========================================

const PlasmoInline = () => {
  const [isCopied, setIsCopied] = useState(false);
  const storage = new Storage();

  const onClickCopyLGTM = useCallback(
    async (open: boolean) => {
      if (!open) {
        return;
      }

      try {
        // 1. Review changesボタンをクリックしてダイアログを開く
        const reviewButton = findReviewChangesButton();
        if (reviewButton) {
          reviewButton.click();
        }

        // 2. textareaが表示されるまで待機
        const textarea = await waitForTextarea();
        if (!textarea) {
          console.error(
            "Textarea not found. Please manually open the review dialog and try again.",
          );
          return;
        }

        // 3. LGTM画像を取得してサニタイズ
        const storedUrls = await storage.get<string[]>("urls");
        let images = sanitizeImageUrls(storedUrls);

        // カスタム画像がない場合、バックグラウンドから取得
        if (images.length === 0) {
          try {
            const res = await sendToBackground<any, { images: string[] }>({
              name: "getImages",
            });
            // バックグラウンドからの画像もサニタイズ
            images = sanitizeImageUrls(res?.images);
          } catch (error) {
            console.error("Failed to fetch images from background:", error);
          }

          // それでも画像がない場合、デフォルト画像を使用
          if (images.length === 0) {
            const defaultImage =
              "https://storage.googleapis.com/copy-lgtm-f1935.appspot.com/sample.png";
            if (isValidImageUrl(defaultImage)) {
              images = [defaultImage];
            } else {
              console.error("No valid images available");
              return;
            }
          }
        }

        // 4. ランダムに画像を選択
        const image = images[Math.floor(Math.random() * images.length)];

        // 5. textareaに画像を挿入（既に存在する場合はスキップ）
        if (!textarea.value.includes('<img alt="LGTM"')) {
          // HTMLを安全に構築（エスケープした属性値を使用）
          const escapedUrl = escapeHtml(image);
          const img = `<img alt="LGTM" src="${escapedUrl}" width="600px" />`;
          const newValue =
            textarea.value === "" ? img : `${textarea.value}\n${img}`;
          setTextareaValue(textarea, newValue);
        }

        // 6. 設定が有効な場合、Approveを自動選択
        const isAutomaticallySelect =
          (await storage.get<boolean>("AutomaticallySelect")) ?? false;

        if (isAutomaticallySelect) {
          const approveRadioButton = findApproveRadioButton();
          if (approveRadioButton) {
            selectApproveOption(approveRadioButton);
          }
        }

        // 7. 成功メッセージを表示
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      } catch (e) {
        console.error(e);
      }
    },
    [storage],
  );

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className={style.btn}
        disabled={isCopied}
        onClick={() => onClickCopyLGTM(true)}
      >
        Copy LGTM
      </button>
      {isCopied && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            padding: "8px 12px",
            background: "#24292f",
            color: "white",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            whiteSpace: "nowrap",
            zIndex: 9999,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          }}
        >
          Success!
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #24292f",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PlasmoInline;
