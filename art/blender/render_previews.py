"""Renders de referencia v0.1.0 (Cycles CPU): python art/blender/render_previews.py [rapido]"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from pz_lib import ROOT, srgb

FAST = 'rapido' in sys.argv
OUT = os.path.join(ROOT, 'art', 'renders'); os.makedirs(OUT, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'art', 'source', 'personajes_v0.1.0.blend'))
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 12 if FAST else 40
sc.cycles.use_denoising = False; sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('mundo'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = srgb('#151a1c'); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6

def light(name, kind, loc, energy, color='#ffffff', size=2.0, rot=None, target=Vector((0, 0, 1))):
    L = bpy.data.lights.new(name, kind); L.energy = energy; L.color = srgb(color)[:3]
    if kind == 'AREA': L.size = size
    o = bpy.data.objects.new(name, L); sc.collection.objects.link(o); o.location = loc
    d = target - Vector(loc); o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); return o
light('key', 'AREA', (-3, -5, 4), 900, '#fff1de', 4)
light('fill', 'AREA', (4, -4, 2), 250, '#bcd6ff', 4)
light('rim', 'AREA', (0, 5, 4), 700, '#7cf7d4', 3)
me = bpy.data.meshes.new('suelo'); import bmesh
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=30); bm.to_mesh(me); bm.free()
fl = bpy.data.objects.new('suelo', me); sc.collection.objects.link(fl)
fm = bpy.data.materials.new('suelo_mat'); fm.use_nodes = True; fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = srgb('#202624'); me.materials.append(fm)
cam_data = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cam_data); sc.collection.objects.link(cam); sc.camera = cam

def shoot(fname, loc, target, lens=50, res=(1600, 900)):
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 50 if FAST else 100
    cam.location = loc; cam_data.lens = lens
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, fname); bpy.ops.render.render(write_still=True); print('render', fname)

rigs = {o.name[:-4]: o for o in bpy.data.objects if o.name.endswith('_rig')}
X = {'oliver': -2.4, 'claire': -1.2, 'elliot': 0.0, 'recolector': 1.9, 'palimpsest': 5.0}
# poses: animación Idle en frame 1 para que los monstruos se vean en postura
for n, r in rigs.items():
    r.location.x = X[n]
    r.animation_data_clear()
    for pb in r.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
sc.frame_set(1)
shoot('lineup_v0.1.0.png', (1.2, -9.5, 2.2), (1.2, 0, 1.25), lens=32, res=(1920, 900))
for n in ('oliver', 'claire', 'elliot'):
    x = X[n]; r = rigs[n]
    zh = {'oliver': 1.69, 'claire': 1.5, 'elliot': 1.57}[n]
    shoot(f'{n}_rostro.png', (x, -1.05, zh + 0.02), (x, 0, zh), lens=85, res=(900, 900))
    shoot(f'{n}_frente.png', (x, -3.6, 1.0), (x, 0, 0.95), lens=50, res=(700, 1000))
    shoot(f'{n}_34.png', (x + 2.3, -2.8, 1.25), (x, 0, 0.95), lens=50, res=(700, 1000))
def solo(name):
    for o in bpy.data.objects:
        if o.type in ('MESH', 'ARMATURE') and o.name != 'suelo':
            o.hide_render = not o.name.startswith(name)
solo('recolector')
shoot('recolector_heroe.png', (X['recolector'] + 2.6, -4.2, 1.6), (X['recolector'], -0.3, 1.3), lens=40, res=(1200, 1000))
solo('palimpsest')
shoot('palimpsest_heroe.png', (X['palimpsest'] + 3.2, -5.2, 2.0), (X['palimpsest'], -0.6, 1.2), lens=35, res=(1400, 1000))
shoot('palimpsest_rostro.png', (X['palimpsest'] + 0.4, -3.3, 1.85), (X['palimpsest'], -1.75, 1.75), lens=70, res=(900, 900))
