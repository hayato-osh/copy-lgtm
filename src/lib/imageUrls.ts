/**
 * 画像URLが安全かどうかを検証
 * - HTTPSのみを許可
 * - 画像拡張子のチェック（信頼できるドメインは拡張子なしでも許可）
 * - SVG画像は信頼できるドメインのみ許可（XSS対策）
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);

    // HTTPSのみ許可
    if (parsedUrl.protocol !== "https:") {
      console.warn(`Blocked non-HTTPS URL: ${url}`);
      return false;
    }

    // 信頼できるドメイン（このリポジトリで配信しているLGTM画像）
    const trustedDomains = ["raw.githubusercontent.com"];

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
export const sanitizeImageUrls = (urls: unknown): string[] => {
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
export const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
