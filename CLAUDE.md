# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Copy LGTMは、Plasmoフレームワークで構築されたChrome拡張機能です。GitHubのプルリクエストページに「Copy LGTM」ボタンを追加し、クリックするとランダムなLGTM（Looks Good To Me）画像をPRレビューコメントのテキストエリアに挿入します。

## コアアーキテクチャ

### Plasmoフレームワーク
- Chrome拡張機能開発用のPlasmoフレームワークで構築
- manifest v3アーキテクチャを使用
- コンテンツスクリプトがGitHub PRページにUIを注入
- バックグラウンドスクリプトがAPI呼び出しとデータ取得を処理
- `@plasmohq/storage`を使用した永続的なデータ保存
- `@plasmohq/messaging`を使用したコンテンツスクリプトとバックグラウンド間の通信

### 主要コンポーネント

**コンテンツスクリプト** (`src/contents/github-pr.tsx`):
- `https://github.com/*`にマッチするGitHub PRページに注入される
- PRの差分ページ（旧UI: `/pull/N/files`、新UI: `/pull/N/changes`）でのみ動作する
- `getInlineAnchorList`でボタンの挿入位置を決める。新UI: `button[class*="ReviewMenuButton"]`（ラベルは "Submit review" / "Submit comments"）の直後、旧UI: `.pr-toolbar > .diffbar > .pr-review-tools`の直後
- 主な機能：ランダムなLGTM画像をPRレビューのテキストエリアにコピー
- ユーザー設定に基づいて「Approve」ラジオボタンを自動選択（オプション）
- 挿入前にテキストエリアに画像が既に存在するかチェック

**バックグラウンドメッセージハンドラー** (`src/background/messages/getImages.ts`):
- `${PLASMO_PUBLIC_IMAGES_JSON}/imageUrls.json`（GitHubのraw URL）からLGTM画像のURL一覧を取得
- 取得に失敗した場合はビルド時に同梱した`images/imageUrls.json`にフォールバック

**ポップアップ** (`src/popup/index.tsx`):
- 拡張機能の設定UI
- 最大8個のカスタムLGTM画像URLをユーザーが設定可能
- LGTM画像コピー時に自動的に「Approve」を選択するトグル
- `@plasmohq/storage/hook`を使用した永続的なストレージ

### 画像管理

LGTM画像はこのリポジトリの`images/`ディレクトリにコミットし、`https://raw.githubusercontent.com/hayato-osh/copy-lgtm/main/images/` から配信する（Firebase Storageは課金プランの都合で廃止）。

**生成スクリプト** (`scripts/generateImages.mts`、Node 22.6+ の型ストリップで実行、ts-node 不要):
- Pixabay APIから画像を取得
- Sharpライブラリで画像に「LGTM」を合成し、1280x720のJPEGにする
- `images/<pixabayId>.jpg`と`images/imageUrls.json`を書き出す（mainブランチにマージされると配信される）
- 環境変数：`PIXABAY_API_KEY`, `PLASMO_PUBLIC_IMAGES_JSON`

## 開発コマンド

```bash
# ホットリロード付きで開発サーバーを起動
pnpm dev

# プロダクション用に拡張機能をビルド
pnpm build

# 配布用に拡張機能をパッケージング
pnpm package

# コードをリント
pnpm lint

# リント問題を自動修正
pnpm fix

# 新しいLGTM画像を生成してimages/に書き出す（PIXABAY_API_KEYが必要）
pnpm generate:images
```

## 環境設定

以下の内容で`.env`ファイルを作成：
- `PIXABAY_API_KEY`: 画像取得用のPixabay APIキー
- `PLASMO_PUBLIC_IMAGES_JSON`: 画像と`imageUrls.json`を配信するベースURL（`https://raw.githubusercontent.com/hayato-osh/copy-lgtm/main/images`）
- `PLASMO_PUBLIC_VERSION`: 拡張機能のバージョン（デフォルトはpackage.jsonのバージョン）

## パスエイリアス

TypeScriptのパスエイリアス`@/*`は`./src/*`にマップされます（tsconfig.jsonで設定）。

## コードスタイル

- Biomeでリント・フォーマット
- インポートの自動整理
- コミット前に`pnpm fix`を実行

## ストレージアーキテクチャ

使用される2つのストレージキー：
- `urls`: カスタムLGTM画像URLの配列（最大8個、形式：`https://`）
- `AutomaticallySelect`: Approveオプションの自動選択用のブール値

## 画像挿入ロジック

1. ローカルストレージでカスタムURLをチェック
2. 空の場合、バックグラウンドスクリプトから取得（GitHub raw URL → 失敗時は同梱の`images/imageUrls.json`）
3. `https://`で始まるURLをフィルタリング（`raw.githubusercontent.com`以外は画像拡張子必須、SVGは信頼ドメインのみ）
4. ランダムに画像を選択
5. テキストエリアに画像が既に存在するかチェック（`<img alt="LGTM"`を検索）
6. HTMLを挿入：`<img alt="LGTM" src="${url}" width="600px" />`
7. 自動選択が有効な場合、「Approve」ラジオボタンを`click()`で選択（Reactのcontrolled inputに反映させるため）

## GitHub連携

拡張機能はGitHub PRのレビューツールセクションにUIを注入します。

- 旧UI: ID `pull_request_review_body`のテキストエリアと、ID `pull_request_review[event]_approve`のApproveラジオボタン
- 新UI（React製 Files changed）: `textarea[aria-label="Markdown value"]`と`input[type="radio"][name="reviewEvent"][value="approve"]`
