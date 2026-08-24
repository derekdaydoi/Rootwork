# Regenerate Rootwork logo rasters and PWA icons from the canonical geometry.
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
MASTER = ROOT / "brand" / "rootwork-mark-1024.png"
SIZES = (180, 192, 256, 512, 1024)
GREEN = "#176B45"
WHITE = "#FFFFFF"

POINTS = {
    "top_left": (220, 286),
    "top_center": (512, 286),
    "top_right": (804, 286),
    "left": (356, 572),
    "right": (668, 572),
    "root": (512, 790),
}


def draw_symbol(draw, color, line_width=58, node_radius=46, root_radius=52):
    paths = (
        (POINTS["root"], POINTS["left"], POINTS["top_left"]),
        (POINTS["left"], POINTS["top_center"]),
        (POINTS["root"], POINTS["right"], POINTS["top_center"]),
        (POINTS["right"], POINTS["top_right"]),
    )
    for path in paths:
        draw.line(path, fill=color, width=line_width, joint="curve")
    for name, point in POINTS.items():
        radius = root_radius if name == "root" else node_radius
        x, y = point
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)


master = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
master_draw = ImageDraw.Draw(master)
master_draw.rounded_rectangle((0, 0, 1023, 1023), radius=224, fill=GREEN)
draw_symbol(master_draw, WHITE)
master.save(MASTER, optimize=True)

for size in SIZES:
    dst = ROOT / f"icon-{size}.png"
    master.resize((size, size), Image.Resampling.LANCZOS).save(dst, optimize=True)
    print("wrote", dst.name)

symbol = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
draw_symbol(ImageDraw.Draw(symbol), GREEN)
symbol.resize((512, 512), Image.Resampling.LANCZOS).save(ROOT / "brand" / "rootwork-symbol.png", optimize=True)
print("done")
