$excluded = @('node_modules','dist','.git','.venv','generated','migrations','.next')
$files = Get-ChildItem -Recurse -File | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($dir in $excluded) {
        if ($path -match "\\$dir\\") { $skip = $true; break }
    }
    -not $skip
}

$total = 0
$stats = @{}
foreach ($file in $files) {
    $lines = (Get-Content $file.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
    $total += $lines
    $ext = $file.Extension
    if (-not $ext) { $ext = '(no ext)' }
    if (-not $stats[$ext]) { $stats[$ext] = @{ Files = 0; LOC = 0 } }
    $stats[$ext].Files += 1
    $stats[$ext].LOC += $lines
}

Write-Output "Total LOC: $total"
Write-Output ""
$stats.GetEnumerator() | Sort-Object { $_.Value.LOC } -Descending | ForEach-Object {
    $ext = $_.Key
    $f = $_.Value.Files
    $l = $_.Value.LOC
    Write-Output "  $ext  |  Files: $f  |  LOC: $l"
}
