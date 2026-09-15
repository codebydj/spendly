import os
from PIL import Image

def generate_monochrome_notification_icon():
    source_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'spendly-icon.png')
    res_dir = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res')

    img = Image.open(source_path).convert('RGBA')

    # Trim empty padding
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Convert non-transparent pixels to pure white stencil (255, 255, 255, alpha)
    _, _, _, a = img.split()
    white_rgb = Image.new('RGB', img.size, (255, 255, 255))
    monochrome = Image.composite(white_rgb, Image.new('RGB', img.size, (0, 0, 0)), a)
    monochrome.putalpha(a)

    sizes = {
        'drawable': 48,
        'drawable-mdpi': 24,
        'drawable-hdpi': 36,
        'drawable-xhdpi': 48,
        'drawable-xxhdpi': 72,
        'drawable-xxxhdpi': 96,
    }

    for folder_name, target_dim in sizes.items():
        folder_path = os.path.join(res_dir, folder_name)
        os.makedirs(folder_path, exist_ok=True)

        # Create canvas with 10% padding for clean Android status bar scaling
        canvas_size = target_dim
        padding = max(1, int(canvas_size * 0.1))
        content_size = canvas_size - (padding * 2)

        scale = content_size / max(monochrome.width, monochrome.height)
        nw = max(1, int(monochrome.width * scale))
        nh = max(1, int(monochrome.height * scale))

        resized = monochrome.resize((nw, nh), Image.Resampling.LANCZOS)

        canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
        ox = (canvas_size - nw) // 2
        oy = (canvas_size - nh) // 2
        canvas.paste(resized, (ox, oy), resized)

        # Save as both ic_stat_spendly.png and ic_stat_name.png for complete resource compatibility
        path_spendly = os.path.join(folder_path, 'ic_stat_spendly.png')
        path_name = os.path.join(folder_path, 'ic_stat_name.png')

        canvas.save(path_spendly, 'PNG')
        canvas.save(path_name, 'PNG')
        print(f"Saved {path_spendly} & {path_name} ({canvas_size}x{canvas_size})")

if __name__ == '__main__':
    generate_monochrome_notification_icon()
