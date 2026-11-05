"""Genera el plano 2D de Eden-0 desde content/mapa/eden0.json (python3 tools/render_map.py)."""
import json, math, os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = json.load(open(os.path.join(ROOT, 'content/mapa/eden0.json'), encoding='utf-8'))
S = 10                    # px por metro
X0, X1, Z0, Z1 = -58, 58, -56, 112
PAD_T, PAD_R = 90, 420
W, H = int((X1 - X0) * S) + PAD_R, int((Z1 - Z0) * S) + PAD_T + 30
img = Image.new('RGB', (W, H), '#0d1110')
d = ImageDraw.Draw(img)
def font(sz, bold=False):
    for f in (['DejaVuSans-Bold.ttf'] if bold else ['DejaVuSans.ttf']):
        for p in ('/usr/share/fonts/truetype/dejavu/' + f, f):
            try: return ImageFont.truetype(p, sz)
            except OSError: pass
    return ImageFont.load_default()
F, FB, FS, FT = font(15), font(16, True), font(12), font(30, True)
P = lambda x, z: ((x - X0) * S, PAD_T + (Z1 - z) * S)

# domo y campo
cx, cz = P(0, 0); r = M['dome']['radius'] * S
d.ellipse([cx - r, cz - r, cx + r, cz + r], outline='#1f3b37', width=3)
o = M['outdoor']; fa = o['farm']
d.rectangle([*P(fa['x0'], fa['z1']), *P(fa['x1'], fa['z0'])], fill='#18241c', outline='#2f5a3a', width=2)
fu = o['furrows']; x = fu['x0']
while x <= fu['x1']:
    if not (fu['skip'][0] <= x <= fu['skip'][1]): d.rectangle([*P(x - 0.8, fu['z1']), *P(x + 0.8, fu['z0'])], fill='#3a2c20')
    x += fu['step']
for px, pz in o['plots']: d.rectangle([*P(px - 1.2, pz + 1.2), *P(px + 1.2, pz - 1.2)], fill='#7cf7d4')
lz = o['limit']; d.rectangle([*P(-40, lz['z1']), *P(40, lz['z0'])], fill='#151a1e')
for i in range(9): d.text(P(-36 + i * 9, (lz['z0'] + lz['z1']) / 2), '~ niebla ~', fill='#3a4650', font=FS)
t = o['tower']; d.rectangle([*P(t['x'] - 1.5, t['z'] + 1.5), *P(t['x'] + 1.5, t['z'] - 1.5)], fill='#9aa39f'); d.text(P(t['x'] + 2.2, t['z'] + 1), 'Torre de riego', fill='#cfd6cf', font=F)
le = o['lens']; lx, ly = P(le['x'], le['z']); d.ellipse([lx - 26, ly - 26, lx + 26, ly + 26], outline='#ff3b3b', width=5); d.ellipse([lx - 9, ly - 9, lx + 9, ly + 9], fill='#ff3b3b')
d.text((lx + 34, ly - 10), 'LA LENTE', fill='#ff6b6b', font=FB)
vp = o['vigilPlate']; d.rectangle([*P(vp['x'] - .6, vp['z'] + .4), *P(vp['x'] + .6, vp['z'] - .4)], fill='#ff3b3b')
d.text(P(-38, fa['z1'] - 1), 'CAMPOS DE LUMEN (exterior, bajo el domo)', fill='#7cf7d4', font=FB)
d.text(P(-38, lz['z1'] - 1), 'EL LÍMITE', fill='#8a9893', font=FB)

FILL = {'corridor': '#2a302e', 'airlock': '#33403c', 'room': '#24302d', 'forbidden': '#3a1416', 'sealed': '#2a1f33'}
EDGE = {'corridor': '#56605c', 'airlock': '#7cf7d4', 'room': '#7b8a86', 'forbidden': '#ff3b3b', 'sealed': '#b07cf7'}
for rm in M['rooms']:
    a, b = P(rm['x0'], rm['z1']), P(rm['x1'], rm['z0'])
    d.rectangle([*a, *b], fill=FILL[rm['kind']], outline=EDGE[rm['kind']], width=3)
d.text(P(-1.6, -14), 'C1', fill='#9aa39f', font=FB)
d.text(P(-48, -19), 'C2 · Pasillo Transversal', fill='#9aa39f', font=FS)

DC = {'open': '#cfd6cf', 'door': '#e9e4d4', 'airlock': '#7cf7d4', 'locked': '#ffd84a', 'sealed': '#b07cf7', 'forbidden': '#ff3b3b'}
for dr in M['doors']:
    x, z, w = dr['x'], dr['z'], dr['w'] / 2
    if dr['axis'] == 'x': a, b = P(x - w, z + .5), P(x + w, z - .5)
    else: a, b = P(x - .5, z + w), P(x + .5, z - w)
    d.rectangle([*a, *b], fill=DC[dr['type']])
for du in M['ducts']:
    pts = [P(x, z) for x, z in du['pts']]
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        L = math.hypot(bx - ax, by - ay); n = int(L // 12)
        for i in range(n):
            if i % 2 == 0: d.line([ax + (bx - ax) * i / n, ay + (by - ay) * i / n, ax + (bx - ax) * (i + 1) / n, ay + (by - ay) * (i + 1) / n], fill='#4fc3f7', width=5)
    for vx, vz, _ in du['vents']:
        p = P(vx, vz); d.rectangle([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], outline='#4fc3f7', width=3)
for lk in M['lockers']:
    n = max(1, int(round((lk['x1'] - lk['x0']) / lk['step'])) + 1)
    for i in range(n):
        x = lk['x0'] + i * lk['step']; p = P(x, lk['z']); d.rectangle([p[0] - 4, p[1] - 4, p[0] + 4, p[1] + 4], fill='#c9b458')
for cam in M['cameras']:
    x, y, z = cam['pos']; p = P(x, z); lx2, lz2 = cam['look']
    ang = math.atan2(-(lz2 - z), lx2 - x)
    for s in (-0.35, 0.35): d.line([p, (p[0] + math.cos(ang + s) * 70, p[1] + math.sin(ang + s) * 70)], fill='#ff3b3b55', width=1)
    d.ellipse([p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5], fill='#ff3b3b')
for pr in M['props']:
    p = P(pr['x'], pr['z'])
    if pr['type'] in ('pipcrt', 'crt'): d.rectangle([p[0] - 5, p[1] - 4, p[0] + 5, p[1] + 4], fill='#ffd84a')
    elif pr['type'] in ('animatronic',): d.text((p[0] - 26, p[1] - 20), 'PIP ▲', fill='#ffd84a', font=FB)
    elif pr['type'] in ('cabinet', 'core'): d.text((p[0] - 8, p[1] - 8), '★', fill='#ff6b6b', font=FB)
    elif pr['type'] == 'valve': d.ellipse([p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6], outline='#ff3b3b', width=3)
    elif pr['type'] in ('generator', 'bioreactor', 'silo'): d.ellipse([p[0] - 24, p[1] - 24, p[0] + 24, p[1] + 24], outline='#c9b458', width=3)

for rm in M['rooms']:
    if rm['kind'] == 'corridor': continue
    a = P(rm['x0'], rm['z1'])
    tag = {'forbidden': '  PROHIBIDA', 'sealed': '  SELLADA'}.get(rm['kind'], '')
    d.rectangle([a[0] + 4, a[1] + 4, a[0] + 8 + max(d.textlength(rm['id'] + tag, font=FB), d.textlength(rm['name'], font=FS)) + 6, a[1] + 44], fill='#0d1110')
    d.text((a[0] + 8, a[1] + 6), rm['id'] + tag, fill=EDGE[rm['kind']], font=FB)
    words, line, ys = rm['name'].split(), '', a[1] + 26
    for w in words:
        if d.textlength(line + ' ' + w, font=FS) > (rm['x1'] - rm['x0']) * S - 16: d.text((a[0] + 8, ys), line.strip(), fill='#cfd6cf', font=FS); ys += 15; line = ''
        line += ' ' + w
    d.text((a[0] + 8, ys), line.strip(), fill='#cfd6cf', font=FS)

# ruta de la Purga
route = [(16, -40), (3.5, -36), (0, -32), (-2, -29), (-11, -29), (-11, -36), (-11, -46), (-11, -47), (-11, -12), (12, -12), (12, -9), (2, -9), (0, -9), (0, 12), (0, 18), (0, 30), (-8, 46), (0, 66), (0, 104)]
pts = [P(x, z) for x, z in route]
d.line(pts, fill='#ff7a1a', width=4, joint='curve')
for i, (x, z) in enumerate([(16, -40), (0, -32), (-11, -29), (-11, -40), (0, -12), (0, 15), (-8, 46), (0, 100)]):
    p = P(x, z); d.ellipse([p[0] - 13, p[1] - 13, p[0] + 13, p[1] + 13], fill='#ff7a1a'); d.text((p[0] - 5, p[1] - 9), str(i + 1), fill='#0d1110', font=FB)

# título y leyenda
d.text((20, 18), 'EDEN-0 · PLANO GENERAL v0.1.0', fill='#e9e4d4', font=FT)
d.text((20, 56), 'Escala: 10 px = 1 m · +Z = norte (arriba) · fuente: content/mapa/eden0.json', fill='#8a9893', font=FS)
lx0, ly0 = W - PAD_R + 20, PAD_T + 20
legend = [('#24302d', 'Sala (segura)'), ('#2a302e', 'Pasillo'), ('#3a1416', 'Zona PROHIBIDA (Recolector)'), ('#2a1f33', 'Zona SELLADA (hasta la noche 7)'),
          ('#e9e4d4', 'Puerta'), ('#ffd84a', 'Puerta bloqueada / CRT de PIP'), ('#b07cf7', 'Puerta sellada'), ('#ff3b3b', 'Puerta prohibida / cámara CCTV'),
          ('#4fc3f7', 'Ducto de ventilación (□ = rejilla)'), ('#c9b458', 'Casillero (escondite)'), ('#7cf7d4', 'Parcela jugable / esclusa'), ('#ff7a1a', 'Ruta de la Purga (tramos 1-8)')]
d.text((lx0, ly0 - 6), 'LEYENDA', fill='#e9e4d4', font=FB)
for i, (c, t) in enumerate(legend):
    y = ly0 + 24 + i * 26; d.rectangle([lx0, y, lx0 + 18, y + 18], fill=c, outline='#555'); d.text((lx0 + 28, y), t, fill='#cfd6cf', font=F)
y = ly0 + 24 + len(legend) * 26 + 20
notes = ['TRAMOS DE LA PURGA', '1 Pabellón: nace la Forma de Cosecha', '2 C1 sur: corre por el techo', '3 Vestuarios: casilleros', '4 Mantenimiento → ducto D1', '5 Sale en Control: apagar cámaras', '6 Esclusa Norte: válvula', '7 Campos: el sacrificio', '8 La Lente',
         '', 'ZONAS PROHIBIDAS', 'ARCH: expedientes (★) y núcleo (★)', 'COMP: abre el Día 5', 'PAB: animatrónico de PIP', '', 'Alturas: salas 3,2 m · INV 6 m', 'ENE 7 m · PAB 8 m · ductos a 3,5 m']
for n in notes:
    d.text((lx0, y), n, fill='#ffb070' if n.isupper() else '#cfd6cf', font=FB if n.isupper() else F); y += 22
out = os.path.join(ROOT, 'docs/04-mapa/plano-eden0.png'); img.save(out); print(out, img.size)
