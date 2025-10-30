# 手動rebase支援スクリプト
# rebaseを開始した後、このスクリプトを実行してtodoファイルを更新

Write-Host "Rebase todo file updater"
Write-Host "========================"
Write-Host ""

if (-not (Test-Path .git/rebase-merge/git-rebase-todo)) {
    Write-Host "Error: Rebase is not in progress."
    Write-Host "Please run 'git rebase -i --root' first."
    exit 1
}

Write-Host "Current todo file location: .git/rebase-merge/git-rebase-todo"
Write-Host ""
Write-Host "Updating todo file..."

$newContent = @"
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

$newContent | Out-File -FilePath .git/rebase-merge/git-rebase-todo -Encoding utf8 -NoNewline

Write-Host "Todo file updated successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review the updated todo file"
Write-Host "2. Run: git rebase --continue"
Write-Host ""

