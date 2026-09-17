Add-Type -AssemblyName System.Drawing

$sourcePath = "frontend/assets/app-logo.png.png"
if (-not (Test-Path $sourcePath)) {
    $sourcePath = "frontend/assets/app-logo.png"
}
Copy-Item $sourcePath "frontend/assets/app-logo.png" -Force

$fullSource = (Resolve-Path "frontend/assets/app-logo.png").Path
$src = [System.Drawing.Image]::FromFile($fullSource)

$targets = @(
    @{ folder = "android/app/src/main/res/mipmap-mdpi"; size = 48; fgSize = 108 },
    @{ folder = "android/app/src/main/res/mipmap-hdpi"; size = 72; fgSize = 162 },
    @{ folder = "android/app/src/main/res/mipmap-xhdpi"; size = 96; fgSize = 216 },
    @{ folder = "android/app/src/main/res/mipmap-xxhdpi"; size = 144; fgSize = 324 },
    @{ folder = "android/app/src/main/res/mipmap-xxxhdpi"; size = 192; fgSize = 432 }
)

function Resize-And-Save($image, $width, $height, $destinationPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($image, 0, 0, $width, $height)
    $bmp.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

foreach ($target in $targets) {
    if (-not (Test-Path $target.folder)) {
        New-Item -ItemType Directory -Path $target.folder -Force | Out-Null
    }
    Resize-And-Save $src $target.size $target.size (Join-Path $target.folder "ic_launcher.png")
    Resize-And-Save $src $target.size $target.size (Join-Path $target.folder "ic_launcher_round.png")
    Resize-And-Save $src $target.fgSize $target.fgSize (Join-Path $target.folder "ic_launcher_foreground.png")
}

$src.Dispose()
Write-Output "SUCCESS: All Android launcher icons created perfectly!"
