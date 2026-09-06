import { beforeEach, describe, expect, it, vi } from "vitest";
import { escapeHtml, isValidImageUrl, sanitizeImageUrls } from "./imageUrls";

beforeEach(() => {
  // 不正URLのテストで console が汚れないようにする
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("isValidImageUrl", () => {
  it("httpsの画像拡張子付きURLを許可する", () => {
    expect(isValidImageUrl("https://example.com/lgtm.png")).toBe(true);
    expect(isValidImageUrl("https://example.com/a/b/lgtm.JPG")).toBe(true);
    expect(isValidImageUrl("https://example.com/lgtm.webp")).toBe(true);
  });

  it("http・その他のプロトコルを拒否する", () => {
    expect(isValidImageUrl("http://example.com/lgtm.png")).toBe(false);
    expect(isValidImageUrl("javascript:alert(1)")).toBe(false);
    expect(isValidImageUrl("data:image/png;base64,xxxx")).toBe(false);
  });

  it("URLとして不正な文字列を拒否する", () => {
    expect(isValidImageUrl("not a url")).toBe(false);
    expect(isValidImageUrl("")).toBe(false);
  });

  it("raw.githubusercontent.com は拡張子なしでも許可する", () => {
    expect(
      isValidImageUrl(
        "https://raw.githubusercontent.com/hayato-osh/copy-lgtm/main/images/123",
      ),
    ).toBe(true);
  });

  it("信頼ドメイン以外は画像拡張子を必須にする", () => {
    expect(isValidImageUrl("https://example.com/lgtm")).toBe(false);
    expect(isValidImageUrl("https://example.com/lgtm.html")).toBe(false);
  });

  it("SVGは信頼ドメインのみ許可する", () => {
    expect(isValidImageUrl("https://example.com/lgtm.svg")).toBe(false);
    expect(
      isValidImageUrl("https://cdn.jsdelivr.net/gh/user/repo/lgtm.svg"),
    ).toBe(true);
    expect(
      isValidImageUrl("https://camo.githubusercontent.com/abc/lgtm.svg"),
    ).toBe(true);
  });

  it("信頼ドメインを装ったホスト名を拒否する", () => {
    expect(
      isValidImageUrl("https://evil-raw.githubusercontent.com.evil.com/a"),
    ).toBe(false);
    expect(isValidImageUrl("https://notgithubusercontent.com/lgtm.svg")).toBe(
      false,
    );
  });
});

describe("sanitizeImageUrls", () => {
  it("配列でない入力は空配列を返す", () => {
    expect(sanitizeImageUrls(undefined)).toEqual([]);
    expect(sanitizeImageUrls(null)).toEqual([]);
    expect(sanitizeImageUrls("https://example.com/a.png")).toEqual([]);
    expect(sanitizeImageUrls({})).toEqual([]);
  });

  it("文字列以外の要素と不正なURLを除外する", () => {
    expect(
      sanitizeImageUrls([
        "https://example.com/ok.png",
        "http://example.com/ng.png",
        123,
        null,
        "not a url",
      ]),
    ).toEqual(["https://example.com/ok.png"]);
  });
});

describe("escapeHtml", () => {
  it("HTML特殊文字をエスケープする", () => {
    expect(escapeHtml(`<img src="x" onerror='alert(1)'> & more`)).toBe(
      "&lt;img src=&quot;x&quot; onerror=&#039;alert(1)&#039;&gt; &amp; more",
    );
  });

  it("通常のURLはそのまま返す", () => {
    expect(escapeHtml("https://example.com/lgtm.png")).toBe(
      "https://example.com/lgtm.png",
    );
  });
});
