import os
import shutil

try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.run(["pip", "install", "Pillow"], check=True)
    from PIL import Image

candidates = [
    "frontend/assets/app-logo.jpeg",
    "frontend/assets/app-logo.jpg",
    "frontend/assets/app-logo.png",
    "frontend/assets/app-logo.png.png",
]

source = None
for cand in candidates:
    if os.path.exists(cand):
        source = cand
        break

if not source:
    raise FileNotFoundError("Could not find app-logo image in frontend/assets!")

print(f"Found source logo: {source}")
img = Image.open(source).convert("RGBA")
img.save("frontend/assets/app-logo.png", "PNG")

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
