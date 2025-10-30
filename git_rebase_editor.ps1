param([string]$filePath)
$content = Get-Content '.git_rebase_todo' -Raw
[System.IO.File]::WriteAllText($filePath, $content)

