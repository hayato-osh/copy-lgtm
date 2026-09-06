/**
 * PRの差分ページかどうか
 * - 旧UI: /owner/repo/pull/123/files
 * - 新UI: /owner/repo/pull/123/changes（/files はここへリダイレクトされる）
 */
export const isPRFilesPage = (pathname: string): boolean =>
  /\/pull\/\d+\/(files|changes)(\/|$)/.test(pathname);

/**
 * 新UIのレビューボタンのラベルかどうか
 * ボタンのラベルはレビューの状態で "Submit review" / "Submit comments" と変わる
 */
export const isSubmitReviewButtonText = (
  text: string | null | undefined,
): boolean => /Submit (review|comments)/.test(text ?? "");
