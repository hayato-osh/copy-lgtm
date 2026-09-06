import { describe, expect, it } from "vitest";
import { isPRFilesPage, isSubmitReviewButtonText } from "./githubPage";

describe("isPRFilesPage", () => {
  it("旧UIの/filesと新UIの/changesにマッチする", () => {
    expect(isPRFilesPage("/owner/repo/pull/123/files")).toBe(true);
    expect(isPRFilesPage("/owner/repo/pull/123/changes")).toBe(true);
    expect(isPRFilesPage("/owner/repo/pull/123/files/abc123")).toBe(true);
  });

  it("差分ページ以外にはマッチしない", () => {
    expect(isPRFilesPage("/owner/repo/pull/123")).toBe(false);
    expect(isPRFilesPage("/owner/repo/pull/123/commits")).toBe(false);
    expect(isPRFilesPage("/owner/repo/pulls")).toBe(false);
    expect(isPRFilesPage("/owner/repo/pull/abc/files")).toBe(false);
    expect(isPRFilesPage("/owner/repo/pull/123/filesx")).toBe(false);
  });
});

describe("isSubmitReviewButtonText", () => {
  it("新UIのボタンラベルにマッチする", () => {
    expect(isSubmitReviewButtonText("Submit review")).toBe(true);
    expect(isSubmitReviewButtonText("Submit comments")).toBe(true);
    expect(isSubmitReviewButtonText("  Submit review 1 ")).toBe(true);
  });

  it("それ以外のラベルにはマッチしない", () => {
    expect(isSubmitReviewButtonText("Review changes")).toBe(false);
    expect(isSubmitReviewButtonText("")).toBe(false);
    expect(isSubmitReviewButtonText(null)).toBe(false);
    expect(isSubmitReviewButtonText(undefined)).toBe(false);
  });
});
