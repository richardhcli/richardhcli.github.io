param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Note
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$note = $Note.Trim().Trim("/")
if ($note -match '\.md$') { $note = $note -replace '\.md$', '' }
if ($note -match '/index$') { $note = $note -replace '/index$', '' }

if ($note -notmatch '^(blog|projects)/([A-Za-z0-9][A-Za-z0-9_-]*)$') {
  [Console]::Error.WriteLine("Pass blog/slug or projects/slug, for example: .\macros\new-note.ps1 blog/new_post")
  exit 1
}

$section = $Matches[1]
$slug = $Matches[2]
$now = Get-Date
$target = "{0}/{1}/{2}-{3}/index.md" -f $section, $now.ToString("yyyy"), $now.ToString("yyyy.MM.dd"), $slug

& hugo new content $target
exit $LASTEXITCODE
