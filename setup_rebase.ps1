# rebase用のtodoファイルを設定するスクリプト
$todoContent = @"
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
"@

# rebaseを開始して、todoファイルを上書きする関数
function Start-Rebase {
    # まずrebaseを開始（エディタが開く）
    git rebase -i --root
    
    # rebaseディレクトリが作成されたら、todoファイルを上書き
    if (Test-Path .git/rebase-merge/git-rebase-todo) {
        $todoContent | Out-File -FilePath .git/rebase-merge/git-rebase-todo -Encoding utf8 -NoNewline
        Write-Host "Rebase todo file updated. Continue with: git rebase --continue"
    }
}

Start-Rebase

