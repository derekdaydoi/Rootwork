# Regenerate Rootwork PWA icons from the square 1024px master.
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "brand" / "rootwork-mark-1024.png"
SIZES = (180, 192, 256, 512, 1024)

if not MASTER.exists():
    raise SystemExit(f"Missing master: {MASTER}")

img = Image.open(MASTER).convert("RGBA")
for size in SIZES:
    dst = ROOT / f"icon-{size}.png"
    img.resize((size, size), Image.Resampling.LANCZOS).save(dst, optimize=True)
    print("wrote", dst.name)

img.resize((512, 512), Image.Resampling.LANCZOS).save(ROOT / "brand" / "rootwork-symbol.png", optimize=True)
print("done")
