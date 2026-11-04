"""Texturas pintadas (128 px, estilo PS1) para los modelos de Blender: python3 tools/gen_textures.py"""
import os, random
from PIL import Image, ImageDraw, ImageFilter
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'art/textures')
os.makedirs(OUT, exist_ok=True)
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def shade(c, a): return tuple(max(0, min(255, int(v * (1 + a)) if a < 0 else int(v + (255 - v) * a))) for v in c)
def base(color, n=128, grain=10, seed=1):
    r = random.Random(seed); c = hexrgb(color); im = Image.new('RGB', (n, n), c); px = im.load()
    for y in range(n):
        for x in range(n):
            d = r.randint(-grain, grain); px[x, y] = tuple(max(0, min(255, v + d)) for v in c)
    return im
def fabric(name, color, seams=True, folds=8, seed=1, extra=None):
    im = base(color, seed=seed); d = ImageDraw.Draw(im); c = hexrgb(color); r = random.Random(seed)
    for i in range(folds):  # pliegues pintados
        x = r.randint(0, 127); d.line([(x, 0), (x + r.randint(-20, 20), 127)], fill=shade(c, -0.25), width=2)
        d.line([(x + 2, 0), (x + 2 + r.randint(-20, 20), 127)], fill=shade(c, 0.12), width=1)
    if seams:
        for y in (0, 64): d.line([(0, y), (127, y)], fill=shade(c, -0.35), width=1)
        for y in range(2, 128, 6): d.point((64, y), fill=shade(c, 0.3))
    if extra: extra(d, c)
    im = im.filter(ImageFilter.SMOOTH); im.save(os.path.join(OUT, name + '.png'))
def knit(name, color, seed=2):
    im = base(color, grain=6, seed=seed); d = ImageDraw.Draw(im); c = hexrgb(color)
    for x in range(0, 128, 4):
        for y in range(0, 128, 6): d.line([(x, y), (x + 2, y + 5)], fill=shade(c, -0.22)); d.line([(x + 4, y), (x + 2, y + 5)], fill=shade(c, -0.12))
    im.save(os.path.join(OUT, name + '.png'))
def hair(name, color, hl, seed=3):
    im = base(color, grain=4, seed=seed); d = ImageDraw.Draw(im); r = random.Random(seed); c = hexrgb(color)
    for i in range(70):
        x = r.randint(0, 127); d.line([(x, 0), (x + r.randint(-8, 8), 127)], fill=hexrgb(hl) if i % 4 == 0 else shade(c, -0.3), width=1)
    im.save(os.path.join(OUT, name + '.png'))
def logo(d, c):
    d.ellipse([84, 18, 100, 34], fill=(47, 143, 122)); d.ellipse([89, 20, 96, 32], fill=(233, 228, 212))
fabric('jumpsuit', '#2f6066', extra=logo, seed=4)
fabric('jumpsuit_plain', '#2f6066', seams=False, seed=5)
fabric('labcoat', '#e7e3d8', folds=10, seed=6, extra=lambda d, c: (d.rectangle([20, 20, 40, 30], outline=(150, 150, 140)), d.line([(26, 12), (26, 30)], fill=(42, 91, 215), width=2)))
fabric('coat_olive', '#5a5d45', folds=12, seed=7)
fabric('vest', '#2a4442', seed=8, extra=lambda d, c: (d.rectangle([14, 20, 34, 34], fill=(217, 105, 42)), d.rectangle([84, 40, 100, 56], fill=(232, 197, 71)), d.rectangle([60, 80, 72, 92], fill=(201, 75, 75))))
fabric('boots', '#2a2620', seams=False, folds=4, seed=9)
fabric('glove', '#7a5a3a', seams=False, folds=3, seed=10)
knit('beanie', '#de6c2a')
hair('hair_claire', '#5b3324', '#7e4a33', 11); hair('hair_elliot', '#15100e', '#2a201b', 12); hair('beard_oliver', '#a0502a', '#c06a38', 13)
# Recolector y Palimpsest
fabric('rec_patch', '#3c3a30', folds=14, seed=14, extra=lambda d, c: [d.rectangle([x, y, x + random.randint(8, 30), y + random.randint(8, 30)], outline=(107, 138, 90)) for x, y in [(random.randint(0, 96), random.randint(0, 96)) for _ in range(6)]])
im = Image.new('RGB', (256, 128), (20, 20, 20)); d = ImageDraw.Draw(im); r = random.Random(15)
faces = [Image.open(os.path.join(OUT, f'face_{n}.png')).convert('RGB').resize((86, 122)) for n in ('oliver', 'claire', 'elliot')]
for k, f in enumerate(faces):
    for y in range(0, 122, 6):
        sh = r.randint(-14, 14) if r.random() < 0.35 else r.randint(-2, 2)
        band = f.crop((0, y, 86, min(122, y + 6))); im.paste(band, (12 + k * 80 + sh, 3 + y))
for _ in range(1500): x, y = r.randint(0, 255), r.randint(36, 62); v = r.randint(70, 255); d.point((x, y), fill=(v, v, v))
d.rectangle([0, 90, 255, 95], fill=(8, 4, 4))
for _ in range(24):
    x, y = r.randint(0, 240), r.randint(0, 120); d.rectangle([x, y, x + r.randint(3, 14), y + r.randint(1, 4)], fill=[(255, 59, 59), (124, 247, 212), (255, 216, 74)][_ % 3])
im.save(os.path.join(OUT, 'rec_faces.png'))
fabric('plastic_cream', '#e9dfc4', seams=False, folds=2, seed=16)
fabric('metal_dark', '#3a3d3c', seams=True, folds=6, seed=17)
fabric('hose', '#6b8a5a', seams=False, folds=10, seed=18)
# cara del animatrónico (frente de la cabeza): copia del retrato
pal = Image.open(os.path.join(os.path.dirname(OUT), 'renders/retrato_palimpsest.png')).convert('RGB').crop((26, 14, 166, 186)).resize((140, 172))
pal.save(os.path.join(OUT, 'pip_face.png'))
print(sorted(os.listdir(OUT)))
