# rebaseを開始して、todoファイルを編集するスクリプト
Write-Host "Starting rebase..."

# rebaseを開始（バックグラウンドで）
Start-Process git -ArgumentList "rebase","-i","--root" -NoNewWindow -Wait -ErrorAction SilentlyContinue

# rebase-mergeディレクトリが作成されるまで待機
$maxWait = 30
$waited = 0
while (-not (Test-Path .git/rebase-merge/git-rebase-todo) -and $waited -lt $maxWait) {
    Start-Sleep -Milliseconds 500
    $waited += 0.5
}

if (Test-Path .git/rebase-merge/git-rebase-todo) {
    Write-Host "Copying rebase todo file..."
    Copy-Item .git_rebase_todo .git/rebase-merge/git-rebase-todo -Force
    Write-Host "Rebase todo file updated. Run: git rebase --continue"
} else {
    Write-Host "Rebase todo file not found. Manual intervention may be needed."
}

