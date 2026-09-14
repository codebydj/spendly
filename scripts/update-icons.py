import os
import base64
from PIL import Image, ImageDraw

# Source images from user upload
USER_UPLOAD_DIR = r'C:\Users\jayad\.gemini\antigravity-ide\brain\1b6be5fa-2f7c-486a-b823-59c734013f02\.user_uploaded'
BADGE_PATH = os.path.join(USER_UPLOAD_DIR, 'media_1789404655408.png')
SYMBOL_PATH = os.path.join(USER_UPLOAD_DIR, 'media_1789404655472.png')

PROJECT_DIR = r'd:\PROJECTS\Spendly'
PUBLIC_DIR = os.path.join(PROJECT_DIR, 'public')
RES_DIR = os.path.join(PROJECT_DIR, r'android\app\src\main\res')

def make_centered_square(img, target_size, padding_pct=0.04):
    bbox = img.getbbox()
    cropped = img.crop(bbox) if bbox else img
    
    canvas = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    max_dim = int(target_size * (1.0 - 2 * padding_pct))
    
    scale = max_dim / max(cropped.width, cropped.height)
    nw = int(cropped.width * scale)
    nh = int(cropped.height * scale)
    
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (target_size - nw) // 2
    oy = (target_size - nh) // 2
    
    canvas.paste(resized, (ox, oy), resized)
    return canvas

def make_splash_screen(symbol_img, width, height):
    # Dark app background (#080A18 gradient fill)
    bg = Image.new('RGBA', (width, height), (8, 10, 24, 255))
    
    # Target logo dimension (approx 35% of shortest edge)
    logo_size = int(min(width, height) * 0.38)
    centered_logo = make_centered_square(symbol_img, logo_size, padding_pct=0.0)
    
    ox = (width - logo_size) // 2
    oy = (height - logo_size) // 2
    
    bg.paste(centered_logo, (ox, oy), centered_logo)
    return bg

def main():
    print("Loading source images...")
    badge_img = Image.open(BADGE_PATH).convert('RGBA')
    symbol_img = Image.open(SYMBOL_PATH).convert('RGBA')

    # 1. Master Web Assets
    print("Generating public web assets...")
    master_icon = make_centered_square(badge_img, 512, padding_pct=0.02)
    master_icon.save(os.path.join(PUBLIC_DIR, 'spendly-icon.png'), 'PNG')
    master_icon.save(os.path.join(PUBLIC_DIR, 'spendly--icon.png'), 'PNG')

    master_logo = make_centered_square(symbol_img, 512, padding_pct=0.02)
    master_logo.save(os.path.join(PUBLIC_DIR, 'spendly-logo.png'), 'PNG')

    # Favicon ICO & PNG
    fav_32 = master_icon.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save(os.path.join(PUBLIC_DIR, 'favicon.png'), 'PNG')
    master_icon.save(os.path.join(PUBLIC_DIR, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

    # Favicon SVG (Embedded base64 PNG)
    with open(os.path.join(PUBLIC_DIR, 'spendly-icon.png'), 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
    
    svg_data = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image href="data:image/png;base64,{b64}" width="512" height="512"/></svg>'
    with open(os.path.join(PUBLIC_DIR, 'favicon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg_data)

    # 2. Android Mipmap Launchers
    mipmap_sizes = {
        'mipmap-mdpi': (48, 108),
        'mipmap-hdpi': (72, 162),
        'mipmap-xhdpi': (96, 216),
        'mipmap-xxhdpi': (144, 324),
        'mipmap-xxxhdpi': (192, 432),
    }

    for folder, (ic_size, fg_size) in mipmap_sizes.items():
        folder_path = os.path.join(RES_DIR, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path, exist_ok=True)
            
        # Standard launcher icon
        ic = make_centered_square(badge_img, ic_size, padding_pct=0.02)
        ic.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
        ic.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
        
        # Foreground adaptive icon
        fg = make_centered_square(symbol_img, fg_size, padding_pct=0.15)
        fg.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')

    # Also keep 1024x1024 master versions in mipmaps if existing code relies on 1024x1024
    for folder in mipmap_sizes.keys():
        folder_path = os.path.join(RES_DIR, folder)
        # 1024 master copies
        ic_1024 = make_centered_square(badge_img, 1024, padding_pct=0.02)
        ic_1024.save(os.path.join(folder_path, 'ic_launcher.png'), 'PNG')
        ic_1024.save(os.path.join(folder_path, 'ic_launcher_round.png'), 'PNG')
        
        fg_1024 = make_centered_square(symbol_img, 1024, padding_pct=0.15)
        fg_1024.save(os.path.join(folder_path, 'ic_launcher_foreground.png'), 'PNG')

    # 3. Android Splash Screens
    splash_sizes = {
        r'drawable\splash.png': (1080, 1920),
        r'drawable-port-mdpi\splash.png': (320, 480),
        r'drawable-port-hdpi\splash.png': (480, 800),
        r'drawable-port-xhdpi\splash.png': (720, 1280),
        r'drawable-port-xxhdpi\splash.png': (960, 1600),
        r'drawable-port-xxxhdpi\splash.png': (1280, 1920),
        r'drawable-land-mdpi\splash.png': (480, 320),
        r'drawable-land-hdpi\splash.png': (800, 480),
        r'drawable-land-xhdpi\splash.png': (1280, 720),
        r'drawable-land-xxhdpi\splash.png': (1600, 960),
        r'drawable-land-xxxhdpi\splash.png': (1920, 1280),
    }

    print("Generating Android splash screens...")
    for rel_path, (w, h) in splash_sizes.items():
        full_p = os.path.join(RES_DIR, rel_path)
        os.makedirs(os.path.dirname(full_p), exist_ok=True)
        splash_img = make_splash_screen(symbol_img, w, h)
        splash_img.save(full_p, 'PNG')

    # 4. Notification Icon (ic_stat_name.png)
    stat_path = os.path.join(RES_DIR, r'drawable\ic_stat_name.png')
    stat_icon = make_centered_square(symbol_img, 48, padding_pct=0.1)
    stat_icon.save(stat_path, 'PNG')

    print("All icons, logos, and splash screens updated successfully!")

if __name__ == '__main__':
    main()
