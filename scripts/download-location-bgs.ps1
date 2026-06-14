$dest = "$PSScriptRoot\..\public\assets\locations"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }

$images = @(
  @{ name = "map-1-pewter.png";   url = "https://archives.bulbagarden.net/media/upload/6/66/RG_Pewter_City_Map.png" }
  @{ name = "map-2-cerulean.png"; url = "https://archives.bulbagarden.net/media/upload/6/6c/RG_Cerulean_City_Map.png" }
  @{ name = "map-3-vermilion.png";url = "https://archives.bulbagarden.net/media/upload/d/d6/RG_Vermilion_City.png" }
  @{ name = "map-4-celadon.png";  url = "https://archives.bulbagarden.net/media/upload/d/d1/RG_Celadon_City_Map.png" }
  @{ name = "map-5-fuchsia.png";  url = "https://archives.bulbagarden.net/media/upload/e/eb/RG_Fuchsia_City.png" }
  @{ name = "map-6-saffron.png";  url = "https://archives.bulbagarden.net/media/upload/7/73/RG_Saffron_City_Map.png" }
  @{ name = "map-7-cinnabar.png"; url = "https://archives.bulbagarden.net/media/upload/5/5a/Cinnabar_Island_RBY.png" }
  @{ name = "map-8-viridian.png"; url = "https://archives.bulbagarden.net/media/upload/e/e5/RG_Viridian_City_Map.png" }
)

$headers = @{
  "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  "Referer"    = "https://archives.bulbagarden.net/"
}

foreach ($img in $images) {
  $path = Join-Path $dest $img.name
  Write-Host "Downloading $($img.name)..." -NoNewline
  try {
    Invoke-WebRequest -Uri $img.url -Headers $headers -OutFile $path -ErrorAction Stop
    Write-Host " OK" -ForegroundColor Green
  } catch {
    Write-Host " FAILED: $_" -ForegroundColor Red
  }
}

Write-Host "`nDone. Files in: $dest"
