# Cloudflare Worker AVIF処理 セットアップガイド

このプロジェクトでは、AVIFエンコード処理をCloudflare Workers上で実行します。

## 前提条件

- Node.js 18以上
- Cloudflareアカウント
- Wrangler CLI（`npm install -g wrangler` またはプロジェクトにインストール済み）

## セットアップ手順

### 1. Cloudflareにログイン

```bash
npx wrangler login
```

### 2. Workerの依存関係をインストール

```bash
cd worker
npm install
cd ..
```

または、ルートディレクトリから：

```bash
npm install
```

### 3. Worker URLの設定

`.env`ファイルを作成し、Worker URLを設定します：

**`.env`ファイルのサンプル：**

```env
# Cloudflare Worker URL
# デプロイ後に実際のWorker URLを設定してください
VITE_CLOUDFLARE_WORKER_URL=https://reimage-worker.maigo999.workers.dev
```

プロジェクトルートに`.env`ファイルを作成し、上記の内容をコピーしてください。

**注意**: `.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません。

### 4. Workerの開発

ローカルでWorkerを開発する場合：

```bash
npm run worker:dev
```

または：

```bash
cd worker
npx wrangler dev
```

### 5. Workerのデプロイ

```bash
npm run worker:deploy
```

または：

```bash
cd worker
npx wrangler deploy
```

デプロイ後、`wrangler.jsonc`の`name`に基づいてWorker URLが生成されます。

### 6. Worker URLの取得と設定

デプロイ後、以下のコマンドでWorker URLを確認できます：

```bash
npx wrangler deployments list
```

生成されたURLを`.env`ファイルの`VITE_CLOUDFLARE_WORKER_URL`に設定してください。

## アーキテクチャ

- **クライアント側**: 画像を読み込み、リサイズし、ImageDataを作成
- **Cloudflare Worker**: ImageDataを受け取り、AVIFエンコードを実行
- **レスポンス**: エンコードされたAVIF画像をバイナリデータとして返す

## 注意事項

1. **WASMモジュール**: `@jsquash/avif`はWASMを使用します。Cloudflare WorkersはWASMをサポートしていますが、大きなファイルサイズに注意してください。

2. **メモリ制限**: Cloudflare Workersの無料プランでは128MBのメモリ制限があります。大きな画像の処理時は注意が必要です。

3. **実行時間制限**: Workersの無料プランでは10秒、有料プランでは30秒の実行時間制限があります。

4. **リクエストサイズ**: 画像データをJSONで送信するため、非常に大きな画像の場合は転送に時間がかかる可能性があります。

## トラブルシューティング

### Workerが見つからないエラー

- Workerがデプロイされているか確認
- `.env`ファイルのURLが正しいか確認
- Workerのログを確認: `npx wrangler tail`

### エンコードエラー

- Workerのログを確認: `npx wrangler tail`
- 画像サイズが大きすぎないか確認
- Workerのメモリ使用量を確認

### CORSエラー

- Workerの`index.ts`でCORSヘッダーが正しく設定されているか確認

