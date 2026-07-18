# AGENTS.md

このリポジトリで作業するコーディングエージェント向けのガイドです。ReImage はブラウザ内で完結する画像リサイズ・圧縮ツール（React + TypeScript + Vite、PWA）です。

## プロジェクト構成

- `index.html` — Vite のエントリ HTML。`src/main.tsx` を読み込む。
- `src/main.tsx` — アプリのエントリポイント。i18n/テーマの初期適用とグローバルエラーハンドラ登録を行い `App` をマウント。
- `src/pages/App.tsx` — 画面コンテナ。
- `src/components/` — UI コンポーネント（`Dropzone`, `FileList`, `SettingsPanel`, `CompareModal`, `ProcessButton`, `LanguageSwitcher`, `ThemeSwitcher`, `Footer`）。
- `src/lib/` — 画像処理ロジック。
  - `processor.ts` — 変換パイプラインの中心。
  - `codecs.ts` — エンコード。AVIF は `@jsquash/avif` を動的インポート（WASM）。
  - `resize.ts` — `pica` によるリサイズ。
  - `zip.ts` — `fflate` で ZIP 生成。
  - `imageUtils.ts` / `validation.ts` / `errorHandling.ts` — 補助処理。
- `src/store/useAppStore.ts` — Zustand による状態・設定管理。
- `src/types.ts` — アプリ全体で共有する型。
- `src/i18n/` — `index.ts`（初期化）と `locales/{en,ja,zh}.json`。
- `vite.config.ts` — Vite / `vite-plugin-pwa` 設定。開発サーバに COOP/COEP ヘッダを付与し、`.wasm` をアセットに含める。

Cloudflare Workers 用のデプロイファイル（`worker/`, `wrangler.jsonc`, `README-WORKER.md`）は `.gitignore` により Git 管理外です。リポジトリには存在しないため、`worker:*` スクリプトはこれらを別途用意しないと動作しません。

## セットアップ

- Node.js 18 以上。
- 依存関係のインストール: `npm install`

## 主要コマンド（package.json より）

- `npm run dev` — 開発サーバ（Vite）。
- `npm run build` — 型チェックとビルド（`tsc && vite build`）。型エラーがあると失敗する。
- `npm run preview` — ビルド成果物のプレビュー。
- `npm run lint` — ESLint（`--ext ts,tsx --report-unused-disable-directives --max-warnings 0`）。警告もエラー扱いになる。
- `npm run format` — Prettier で `src/**/*.{ts,tsx,css}` を整形。
- `npm run worker:dev` / `worker:build` / `worker:deploy` — Cloudflare Workers 用（上記の管理外ファイルが必要）。

補足:
- 専用の `typecheck` スクリプトはない。型チェックは `npm run build`（`tsc`）で行う。
- テストスクリプトおよびテストフレームワークは現状存在しない。テストを追加する場合はまず方針を確認すること。
- lint は現時点で既存の警告・エラーを報告する（`no-explicit-any` の警告、`useAppStore.ts` の `no-empty` エラーなど）。無関係な既存指摘の修正はスコープ外とし、混同しないこと。

## コーディング規約

- 言語/フレームワーク: TypeScript（strict）、React 18、関数コンポーネント + Hooks。
- フォーマット（`.prettierrc`）: セミコロンなし、シングルクォート、`printWidth: 100`、`tabWidth: 2`、`trailingComma: es5`。既存スタイルに合わせること。
- TypeScript: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` が有効（`tsconfig.json`）。未使用変数を残さない。
- 状態管理は Zustand（`useAppStore`）に集約。設定・状態を各所に散らさない。
- ユーザー向け文言は i18n を利用し、`en`/`ja`/`zh` のロケールを揃える。ハードコードした文言を追加しない。
- コメントは既存の簡潔なスタイルに合わせる（日本語コメントが多い）。差分の説明目的のコメントは書かない。

## 注意点

- 画像処理は OffscreenCanvas / WASM に依存する。AVIF は Canvas 非対応時に WASM へフォールバックする設計。
- WASM ファイルが大きいため PWA のキャッシュ上限は 5MB に設定済み（`vite.config.ts`）。
- SharedArrayBuffer 等を使う都合上、開発サーバは COOP/COEP ヘッダを付与している。
- 変更をコミットする前に少なくとも `npm run build` を通すこと。可能なら `npm run lint` / `npm run format` も実行する。
- pre-commit フック（husky / pre-commit）は設定されていない。
