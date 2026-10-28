from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "assets" / "optimized"
OUTPUT.mkdir(parents=True, exist_ok=True)

ASSETS = [
    ("assets/originals/iveco-sway-500-iaa-2024-search.jpg", "sway-hero", (640, 1280, 1920, 2560)),
    ("assets/originals/iveco-daily-35c15-mk4.jpg", "daily-archive", (480, 960, 1600)),
    ("assets/originals/iveco-tector-2007.jpg", "tector-profile", (480, 960)),
    ("assets/originals/iveco-tector-fenatran-2017.jpg", "tector-fenatran", (480, 960, 1280)),
]

for source_name, slug, widths in ASSETS:
    source = ROOT / source_name
    if not source.exists():
        raise FileNotFoundError(source)
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        original_width, original_height = image.size
        if original_width < 320:
            raise ValueError(f"Resolução insuficiente: {source_name}: {image.size}")
        output_widths = sorted({min(requested, original_width) for requested in widths})
        for width in output_widths:
            height = round(original_height * width / original_width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS) if width != original_width else image.copy()
            target = OUTPUT / f"{slug}-{width}.webp"
            resized.save(target, "WEBP", quality=82, method=6)
            print(f"{target.relative_to(ROOT)}  {width}x{height}  {target.stat().st_size} bytes")
            if width == output_widths[-1]:
                base = OUTPUT / f"{slug}.webp"
                resized.save(base, "WEBP", quality=82, method=6)
                print(f"{base.relative_to(ROOT)}  alias for {width}w  {base.stat().st_size} bytes")
        print(f"Source: {source_name}  {original_width}x{original_height}")

# Recortes de detalhe da fotografia do S-Way (mesma licença CC BY-SA 4.0 da fonte).
# Sem retoque de cor ou anotação; usados como textura visual e rotulados como recortes.
CROPS = [
    ("assets/originals/iveco-sway-500-iaa-2024-search.jpg", "detail-grille", (1070, 1090, 2120, 1930), (480, 960, 1050)),
    ("assets/originals/iveco-sway-500-iaa-2024-search.jpg", "detail-cab", (1015, 110, 2470, 990), (480, 960, 1440)),
    ("assets/originals/iveco-sway-500-iaa-2024-search.jpg", "detail-wheel", (2195, 1480, 2910, 2140), (480, 715)),
]
for source_name, slug, box, widths in CROPS:
    with Image.open(ROOT / source_name) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB").crop(box)
        w, h = image.size
        for width in sorted({min(x, w) for x in widths}):
            height = round(h * width / w)
            out = image.resize((width, height), Image.Resampling.LANCZOS) if width != w else image
            target = OUTPUT / f"{slug}-{width}.webp"
            out.save(target, "WEBP", quality=80, method=6)
            print(target.relative_to(ROOT), f"{width}x{height}", target.stat().st_size)
            if width == max(min(x, w) for x in widths):
                out.save(OUTPUT / f"{slug}.webp", "WEBP", quality=80, method=6)
