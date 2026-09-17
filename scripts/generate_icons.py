import os
import shutil

try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "Pillow"], check=True)
    from PIL import Image

source = "frontend/assets/app-logo.png.png"
if not os.path.exists(source):
    source = "frontend/assets/app-logo.png"

shutil.copy(source, "frontend/assets/app-logo.png")

img = Image.open("frontend/assets/app-logo.png").convert("RGBA")

targets = [
    ("android/app/src/main/res/mipmap-mdpi", 48, 108),
    ("android/app/src/main/res/mipmap-hdpi", 72, 162),
    ("android/app/src/main/res/mipmap-xhdpi", 96, 216),
    ("android/app/src/main/res/mipmap-xxhdpi", 144, 324),
    ("android/app/src/main/res/mipmap-xxxhdpi", 192, 432),
]

for folder, size, fg_size in targets:
    os.makedirs(folder, exist_ok=True)
    
    # Standard launcher
    launcher = img.resize((size, size), Image.Resampling.LANCZOS)
    launcher.save(os.path.join(folder, "ic_launcher.png"), "PNG")
    launcher.save(os.path.join(folder, "ic_launcher_round.png"), "PNG")
    
    # Foreground launcher
    fg = img.resize((fg_size, fg_size), Image.Resampling.LANCZOS)
    fg.save(os.path.join(folder, "ic_launcher_foreground.png"), "PNG")

print("SUCCESS: All 5 Android mipmap icon folders updated perfectly!")
