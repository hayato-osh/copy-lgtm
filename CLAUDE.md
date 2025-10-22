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
- `getInlineAnchor`を使用して`.pr-toolbar > .diffbar > .pr-review-tools`要素をターゲットにする
- 主な機能：ランダムなLGTM画像をPRレビューのテキストエリアにコピー
- ユーザー設定に基づいて「Approve」ラジオボタンを自動選択（オプション）
- 挿入前にテキストエリアに画像が既に存在するかチェック

**バックグラウンドメッセージハンドラー** (`src/background/messages/getImages.ts`):
- Firebase StorageからLGTM画像のURLを取得
- 取得に失敗した場合はサンプル画像にフォールバック
- エンドポイントに`PLASMO_PUBLIC_IMAGES_JSON`環境変数を使用

**ポップアップ** (`src/popup/index.tsx`):
- 拡張機能の設定UI
- 最大8個のカスタムLGTM画像URLをユーザーが設定可能
- LGTM画像コピー時に自動的に「Approve」を選択するトグル
- `@plasmohq/storage/hook`を使用した永続的なストレージ

### 画像管理

**アップロードスクリプト** (`scripts/createLGTM.mts`):
- Pixabay APIから画像を取得
- Sharpライブラリを使用して画像を処理
- Firebase Storageにアップロード
- `credential.json`にFirebase認証情報が必要
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

# 新しいLGTM画像をアップロード（Firebase設定が必要）
pnpm upload
```

## 環境設定

以下の内容で`.env`ファイルを作成：
- `PIXABAY_API_KEY`: 画像取得用のPixabay APIキー
- `PLASMO_PUBLIC_IMAGES_JSON`: Firebase StorageのエンドポイントURL
- `PLASMO_PUBLIC_VERSION`: 拡張機能のバージョン（デフォルトはpackage.jsonのバージョン）

画像アップロード機能を使用する場合は、Firebaseサービスアカウントの認証情報を`credential.json`に配置してください。

## パスエイリアス

TypeScriptのパスエイリアス`@/*`は`./src/*`にマップされます（tsconfig.jsonで設定）。

## コードスタイル

- ESLint（Airbnb config + TypeScriptルール）
- Prettierでフォーマット
- `@plasmohq/prettier-plugin-sort-imports`でインポートをソート
- コミット前に`pnpm fix`を実行

## ストレージアーキテクチャ

使用される2つのストレージキー：
- `urls`: カスタムLGTM画像URLの配列（最大8個、形式：`https://`）
- `AutomaticallySelect`: Approveオプションの自動選択用のブール値

## 画像挿入ロジック

1. ローカルストレージでカスタムURLをチェック
2. 空の場合、バックグラウンドスクリプトから取得（Firebase Storage）
3. `https://`で始まるURLをフィルタリング
4. ランダムに画像を選択
5. テキストエリアに画像が既に存在するかチェック（`<img alt="LGTM"`を検索）
6. HTMLを挿入：`<img alt="LGTM" src="${url}" width="600px" />`
7. 自動選択が有効な場合、「Approve」ラジオボタンをチェック

## GitHub連携

拡張機能はGitHub PRのレビューツールセクションにUIを注入します。ID `pull_request_review_body`のテキストエリアと、ID `pull_request_review[event]_approve`のApproveラジオボタンをターゲットにします。
