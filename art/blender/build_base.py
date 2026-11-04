"""Blockout de Eden-0 desde content/mapa/eden0.json (Blender 5.x).
Uso: python art/blender/build_base.py   → art/source/eden0_blockout_v0.1.0.blend + art/renders/eden0_*.png
"""
import json, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector
from pz_lib import ROOT, srgb

MAP = json.load(open(os.path.join(ROOT, 'content', 'mapa', 'eden0.json'), encoding='utf-8'))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
_m = {}
def mat(name, color, emit=0.0, alpha=None):
    if name in _m: return _m[name]
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = srgb(color); b.inputs['Roughness'].default_value = 0.8
    if emit: b.inputs['Emission Color'].default_value = srgb(color); b.inputs['Emission Strength'].default_value = emit
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
    _m[name] = m; return m

def box(name, x0, x1, y0, y1, z0, z1, m, coll):
    # coordenadas del mapa (x, z) → Blender (x, y=z)
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    o = bpy.data.objects.new(name, me); coll.objects.link(o); return o

def coll(name):
    c = bpy.data.collections.new(name); sc.collection.children.link(c); return c

C_FLOOR, C_WALL, C_DUCT, C_PROP, C_OUT, C_LBL = (coll(n) for n in ('Suelos', 'Muros', 'Ductos', 'Props', 'Exterior', 'Etiquetas'))
FLOOR = {'corridor': '#3a403e', 'airlock': '#2f5a50', 'room': '#4a5550', 'forbidden': '#5a1c20', 'sealed': '#3c2a4a'}
WALLC = {'corridor': '#8a9893', 'airlock': '#7cf7d4', 'room': '#9aa7a2', 'forbidden': '#b03030', 'sealed': '#8a5ab8'}
T = 0.3

def doors_on(axis, c, a0, a1):
    out = []
    for d in MAP['doors']:
        if d['axis'] != axis: continue
        if abs((d['z'] if axis == 'x' else d['x']) - c) > 0.6: continue
        p = d['x'] if axis == 'x' else d['z']
        if a0 - 1 < p < a1 + 1: out.append((p - d['w'] / 2, p + d['w'] / 2))
    return sorted(out)

def segments(a0, a1, gaps):
    segs, cur = [], a0
    for g0, g1 in gaps:
        if g0 > cur: segs.append((cur, min(g0, a1)))
        cur = max(cur, g1)
    if cur < a1: segs.append((cur, a1))
    return [s for s in segs if s[1] - s[0] > 0.05]

for r in MAP['rooms']:
    x0, x1, z0, z1, h, k = r['x0'], r['x1'], r['z0'], r['z1'], r['h'], r['kind']
    box(f"suelo_{r['id']}", x0, x1, z0, z1, -0.1, 0.0, mat('suelo_' + k, FLOOR[k]), C_FLOOR)
    wm = mat('muro_' + k, WALLC[k])
    for axis, c, a0, a1 in (('x', z0 + T / 2, x0, x1), ('x', z1 - T / 2, x0, x1), ('z', x0 + T / 2, z0, z1), ('z', x1 - T / 2, z0, z1)):
        wall_c = z0 if (axis == 'x' and c < (z0 + z1) / 2) else z1 if axis == 'x' else x0 if c < (x0 + x1) / 2 else x1
        for s0, s1 in segments(a0, a1, doors_on(axis, wall_c, a0, a1)):
            if axis == 'x': box(f"muro_{r['id']}", s0, s1, c - T / 2, c + T / 2, 0, h, wm, C_WALL)
            else: box(f"muro_{r['id']}", c - T / 2, c + T / 2, s0, s1, 0, h, wm, C_WALL)
        for g0, g1 in doors_on(axis, wall_c, a0, a1):
            if h > 2.4:
                if axis == 'x': box('dintel', g0, g1, c - T / 2, c + T / 2, 2.4, h, wm, C_WALL)
                else: box('dintel', c - T / 2, c + T / 2, g0, g1, 2.4, h, wm, C_WALL)
    # etiqueta
    cu = bpy.data.curves.new(f"lbl_{r['id']}", 'FONT'); cu.body = r['id']; cu.size = 2.2 if k != 'corridor' else 1.4; cu.align_x = 'CENTER'
    lo = bpy.data.objects.new(f"lbl_{r['id']}", cu); C_LBL.objects.link(lo); lo.location = ((x0 + x1) / 2, (z0 + z1) / 2, h + 0.6)
    cu.materials.append(mat('texto_' + k, WALLC[k], emit=2.0))

DCOL = {'airlock': '#7cf7d4', 'locked': '#e8c547', 'sealed': '#b07cf7', 'forbidden': '#ff3b3b'}
for d in MAP['doors']:
    if d['type'] in DCOL:
        w = d['w'] / 2
        if d['axis'] == 'x': box(f"puerta_{d['id']}", d['x'] - w, d['x'] + w, d['z'] - 0.12, d['z'] + 0.12, 0, 2.4, mat('puerta_' + d['type'], DCOL[d['type']], emit=1.2), C_PROP)
        else: box(f"puerta_{d['id']}", d['x'] - 0.12, d['x'] + 0.12, d['z'] - w, d['z'] + w, 0, 2.4, mat('puerta_' + d['type'], DCOL[d['type']], emit=1.2), C_PROP)
dm = mat('ducto', '#4fc3f7', emit=0.8, alpha=0.55)
for du in MAP['ducts']:
    y, w, hh = du['y'], du['w'] / 2, du['h']
    for (ax, az), (bx, bz) in zip(du['pts'], du['pts'][1:]):
        box(du['id'], min(ax, bx) - w, max(ax, bx) + w, min(az, bz) - w, max(az, bz) + w, y, y + hh, dm, C_DUCT)
lk = mat('casillero', '#c9b458')
for L in MAP['lockers']:
    n = max(1, int(round((L['x1'] - L['x0']) / L['step'])) + 1)
    for i in range(n):
        x = L['x0'] + i * L['step']; box('casillero', x - 0.42, x + 0.42, L['z'] - 0.3, L['z'] + 0.3, 0, 2.0, lk, C_PROP)
cm = mat('camara', '#ff3b3b', emit=4.0)
for c in MAP['cameras']:
    x, y, z = c['pos']; box(c['id'], x - 0.25, x + 0.25, z - 0.25, z + 0.25, y - 0.2, y + 0.2, cm, C_PROP)
PROP = {'generator': ('#c9b458', 3, 5), 'bioreactor': ('#7cf7d4', 3, 4.5), 'silo': ('#8a8a7a', 3, 6.5), 'stage': ('#6a3a8a', 6, 1.2), 'seats': ('#4a3a5a', 8, 0.9),
        'servers': ('#2a2f2f', 7, 2.4), 'racks': ('#2f8f7a', 9, 2.2), 'monitorwall': ('#ffd84a', 4, 2.2), 'pipcrt': ('#ffd84a', 0.8, 1.5), 'animatronic': ('#e9dfc4', 1.0, 2.6),
        'uniformpile': ('#2f6066', 2.5, 1.4), 'table': ('#6a5038', 1.6, 0.8), 'bunk': ('#7b8a86', 1.0, 1.8), 'converter': ('#c9b458', 1.6, 2.4), 'core': ('#ff3b3b', 1.2, 2.2), 'cabinet': ('#ff6b6b', 0.8, 2.0)}
for p in MAP['props']:
    if p['type'] in PROP:
        col, r, h = PROP[p['type']]
        box(p['type'], p['x'] - r / 2, p['x'] + r / 2, p['z'] - r / 2, p['z'] + r / 2, 0, h, mat('prop_' + p['type'], col, emit=1.5 if p['type'] in ('pipcrt', 'bioreactor', 'core', 'monitorwall') else 0), C_PROP)
o = MAP['outdoor']; fa = o['farm']
box('campo', fa['x0'], fa['x1'], fa['z0'], fa['z1'], -0.12, -0.02, mat('tierra', '#2a2520'), C_OUT)
fu = o['furrows']; x = fu['x0']
while x <= fu['x1']:
    if not (fu['skip'][0] <= x <= fu['skip'][1]):
        box('surco', x - 0.65, x + 0.65, fu['z0'], fu['z1'], 0, 0.25, mat('surco', '#3a2c20'), C_OUT)
        for z in range(fu['z0'] + 1, fu['z1'], 3): box('lumen', x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0.5, 0.9, mat('lumen', '#7cf7d4', emit=6), C_OUT)
    x += fu['step']
t = o['tower']; box('torre', t['x'] - 1.4, t['x'] + 1.4, t['z'] - 1.4, t['z'] + 1.4, 0, t['h'], mat('torre', '#9aa39f'), C_OUT)
lz = o['limit']; box('limite', -40, 40, lz['z0'], lz['z1'], -0.12, -0.02, mat('niebla', '#2a3036'), C_OUT)
le = o['lens']; box('lente', le['x'] - 5, le['x'] + 5, le['z'], le['z'] + 1, 0, 10, mat('lente', '#ff3b3b', emit=3), C_OUT)
# render
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24; sc.cycles.use_denoising = False
sc.view_settings.view_transform = 'Standard'
wd = bpy.data.worlds.new('w'); sc.world = wd; wd.use_nodes = True; wd.node_tree.nodes['Background'].inputs['Color'].default_value = srgb('#0d1110'); wd.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
sun = bpy.data.lights.new('sol', 'SUN'); sun.energy = 2.5; so = bpy.data.objects.new('sol', sun); sc.collection.objects.link(so); so.rotation_euler = (math.radians(40), math.radians(15), math.radians(30))
cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
OUT = os.path.join(ROOT, 'art', 'renders')
def shoot(fn, loc, target, scale, res):
    cd.ortho_scale = scale; cam.location = loc; cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.filepath = os.path.join(OUT, fn); bpy.ops.render.render(write_still=True)
shoot('eden0_isometrica.png', (70, -95, 85), (0, -10, 0), 135, (1800, 1200))
shoot('eden0_base_isometrica.png', (55, -75, 60), (0, -20, 0), 95, (1800, 1200))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'art', 'source', 'eden0_blockout_v0.1.0.blend'))
print('OK base')
