# コミットログ整理手順

## 目的
以下のコミットを統合して、コミットログをきれいにします：
1. `.cursor`関連の2つのコミットを1つに統合
2. README関連の変更を統合

## 実行手順

### 1. Interactive rebaseを開始
```bash
git rebase -i --root
```

### 2. エディタが開いたら、以下のように編集

```
pick 45ab2b2 chore: 初期コミット
pick 69c58cb feat: add social media icons to Footer component and update dependencies
pick f38232a feat: implement dark mode support and add theme switcher component
pick 5c7a854 chore: update dependencies and improve file processing UI
pick 43ab04a feat: add Cloudflare Worker support for AVIF encoding and update project configuration
pick 6a7f66a feat: add MIT License and comprehensive README documentation
pick 9f78de7 feat: enhance ESLint and Prettier configurations, implement global error handling, and refactor app settings management
squash d203259 chore: add .cursor to .gitignore
fixup 34a8db2 chore: .cursorフォルダをGit管理から除外
squash d44bab7 chore: remove optional backend mention for Cloudflare Workers from README
pick f95f6b8 chore: update .gitignore to include Cloudflare Workers files and remove README-WORKER.md
```

**変更点：**
- `d203259` を `squash` に変更（前のコミットと統合）
- `34a8db2` を `fixup` に変更（メッセージなしで統合）
- `d44bab7` を `squash` に変更（前のコミットと統合）

### 3. 保存して閉じる

### 4. コミットメッセージを編集（squashの場合）

`.cursor`関連の統合時：
```
chore: .cursorフォルダをGit管理から除外
```

README関連の統合時（`9f78de7`のメッセージに統合）：
変更なしでそのまま保存

### 5. 完了

rebaseが完了したら：
```bash
git log --oneline --graph -10
```

で確認してください。

### 6. リモートに反映（force pushが必要）

```bash
git push --force-with-lease origin main
```

⚠️ **注意**: force pushは既存の履歴を書き換えます。共同作業している場合は必ず確認してください。

