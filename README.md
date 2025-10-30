## ReImage

高品質かつ高速なブラウザ内画像変換ツール。ドラッグ&ドロップで複数画像を一括変換し、リサイズや画質、出力形式を調整してZIPでまとめてダウンロードできます。オフライン対応（PWA）、ダークモード、i18n（英語/日本語/中国語）を備えています。

### バッジ

![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2018-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-ready-5A0FC8)
![i18n](https://img.shields.io/badge/i18n-en%2Fja%2Fzh-ff69b4)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-hosting-F38020?logo=cloudflareworkers&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## 機能

- **一括変換**: 複数ファイルをまとめてドラッグ&ドロップで投入
- **出力形式**: `jpg` / `png` / `webp` / `avif` / `original`
- **品質・解像度調整**: 品質スライダー、最大長辺指定、Near-lossless（WebP/AVIF）
- **プリセット**: 高品質 / バランス / 高圧縮
- **比較モーダル**: 変換前後の見た目とサイズを比較
- **ZIP一括ダウンロード**: 変換後をまとめて取得
- **国際化 (i18n)**: 英語・日本語・中国語の切替
- **テーマ**: システム/ライト/ダーク
- **PWA対応**: オフラインで継続利用可能

## 技術スタック

- フロントエンド: React 18, TypeScript, Vite, Tailwind CSS, Zustand, react-i18next
- 画像処理: OffscreenCanvas 変換 + `@jsquash/avif` (WASM) + `pica` リサイズ
- 圧縮/配布: `fflate` によるZIP生成
- PWA: `vite-plugin-pwa`

## はじめに

### 前提条件

- Node.js 18 以上

### セットアップ

```bash
npm install
```

### 開発

```bash
npm run dev
```

### ビルド / プレビュー

```bash
npm run build
npm run preview
```

### コード品質

```bash
npm run lint
npm run format
```

## 使い方

1. 画面上部のエリアに画像をドラッグ&ドロップ（またはクリックして選択）
2. 右側の `設定` パネルで出力形式・品質・最大長辺・Near-lossless・プリセットを調整
3. `変換` を実行（処理進捗が表示されます）
4. 比較モーダルで仕上がりを確認
5. まとめてZIPダウンロード

推奨出力形式はデフォルトの `webp`（高圧縮・互換性のバランス）。最高圧縮を狙う場合は `avif` を選択してください（環境により処理時間が増えることがあります）。

## エラーメッセージについて

AVIF 変換で失敗した場合は、原因に応じた日本語のエラーメッセージを表示します（タイムアウト/メモリ不足/WASM 読み込み失敗など）。調整案としては「画像サイズの縮小」「品質の引き下げ」をお試しください。

## ディレクトリ構成（抜粋）

```text
src/
  components/      UIコンポーネント
  lib/             画像処理（リサイズ・エンコード・ZIP）
  i18n/            多言語リソース
  pages/           画面コンテナ（`App.tsx`）
  store/           Zustandストア
  index.css        Tailwind
  main.tsx         エントリ
  worker/          Cloudflare Workers（静的ホスティング）
```

## ブラウザ互換性のヒント

- AVIF 変換は OffscreenCanvas と WASM を活用します。環境によりCanvas側がAVIF非対応の場合はWASM処理にフォールバックします。
- 超高解像度画像はメモリ制限で失敗する場合があります。`最大長辺` や `品質` を下げてお試しください。

## 開発メモ

- 変換ロジック: `src/lib/processor.ts`, `src/lib/codecs.ts`, `src/lib/resize.ts`
- ZIP 作成: `src/lib/zip.ts`
- 設定・状態管理: `src/store/useAppStore.ts`
- i18n 初期化: `src/i18n/index.ts`

## ライセンス

本ソフトウェアは **MIT License** の下で配布されます。詳細は `LICENSE` をご確認ください。

## 謝辞

- バッジ生成に [Shields.io](https://shields.io/) を使用しています。


