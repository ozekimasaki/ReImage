param($file)
$content = Get-Content '.git_rebase_todo' -Raw
Set-Content -Path $file -Value $content -NoNewline

