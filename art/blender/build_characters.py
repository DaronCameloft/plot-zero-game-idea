"""PLOT ZERO · personajes v0.1.0 (Blender 5.x).

Uso (Blender instalado):   blender -b -P art/blender/build_characters.py
Uso (módulo bpy de PyPI):  python art/blender/build_characters.py

Genera:
  art/models/<id>.glb                 (malla + rig + animaciones, para la demo y Roblox/Godot)
  art/source/personajes_v0.1.0.blend  (archivo editable)
Personajes: oliver, claire, elliot (humanos), recolector (trípode), palimpsest (Forma de Cosecha, 4 patas).
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector
from pz_lib import Builder, material, make_rig, bind, add_action, cycle, ROOT

OUT_MODELS = os.path.join(ROOT, 'art', 'models'); os.makedirs(OUT_MODELS, exist_ok=True)
OUT_SRC = os.path.join(ROOT, 'art', 'source'); os.makedirs(OUT_SRC, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

def new_coll(name):
    c = bpy.data.collections.new(name); scene.collection.children.link(c); return c

# ------------------------------------------------------------------ materiales compartidos
M = {
    'jumpsuit': material('Mono_Arcadia', tex='jumpsuit.png'),
    'jumpsuit_plain': material('Mono_Arcadia_liso', tex='jumpsuit_plain.png'),
    'labcoat': material('Bata', tex='labcoat.png'),
    'coat': material('Abrigo_oliva', tex='coat_olive.png'),
    'vest': material('Chaleco', tex='vest.png'),
    'boots': material('Botas', tex='boots.png'),
    'glove': material('Guante_trabajo', tex='glove.png'),
    'beanie': material('Gorro_naranja', tex='beanie.png'),
    'hair_claire': material('Pelo_Claire', tex='hair_claire.png', rough=0.6),
    'hair_elliot': material('Pelo_Elliot', tex='hair_elliot.png', rough=0.6),
    'beard': material('Barba_Oliver', tex='beard_oliver.png'),
    'frame': material('Montura', color='#2a1d17', rough=0.4),
    'lens': material('Cristal', color='#cfe3ee', alpha=0.1, rough=0.1),
    'crack': material('Grieta', color='#ffffff', emit=0.1),
    'yellow': material('Casco_amarillo', color='#e8c547', rough=0.5),
    'sticker_r': material('Sticker_rojo', color='#c94b4b'), 'sticker_b': material('Sticker_azul', color='#2a5bd7'), 'sticker_g': material('Sticker_verde', color='#4f8a3a'),
    'bandage': material('Venda', color='#e9e4d4'),
    'dark': material('Gris_oscuro', color='#26262a', rough=0.5),
    'torch_lens': material('Linterna_luz', color='#fff2b0', emit=6.0),
    'badge': material('Gafete', color='#f4f1ea'),
    'wood': material('Portapapeles', color='#7a5a3a'), 'paper': material('Papel', color='#f3efe4'),
    'teal_dark': material('Teal_oscuro', color='#244a50'),
    'rec_patch': material('Recolector_parches', tex='rec_patch.png'),
    'rec_faces': material('Recolector_caras', tex='rec_faces.png'),
    'rec_ghost': material('Recolector_fantasma', tex='rec_faces.png', alpha=0.28, emit=0.15, emit_color='#ff3b3b'),
    'glitch_c': material('Glitch_cian', color='#7cf7d4', emit=4.0, alpha=0.8), 'glitch_r': material('Glitch_rojo', color='#ff3b3b', emit=4.0, alpha=0.8),
    'hose': material('Manguera', tex='hose.png'),
    'hook': material('Garfio', color='#1b1a18', rough=0.35),
    'plastic': material('Plastico_crema', tex='plastic_cream.png', rough=0.45),
    'pip_face': material('PIP_cara_animatronica', tex='pip_face.png', rough=0.4),
    'metal': material('Metal_cosechadora', tex='metal_dark.png', rough=0.35),
    'leaf': material('Hoja_PIP', color='#4f8a3a', rough=0.5),
    'hat': material('Sombrero', color='#1d2a2a'), 'hat_band': material('Cinta', color='#c94b4b'),
    'lumen': material('Lumen_nucleo', color='#7cf7d4', emit=8.0),
    'red_eye': material('Lente_roja', color='#ff2b3b', emit=10.0),
    'glove_white': material('Guante_mascota', color='#f2efe6'),
    'teeth': material('Dientes', color='#efe6cf', rough=0.3),
    'mouth': material('Boca', color='#1a0606'),
    'sign': material('Cartel', color='#e8c547'),
}

# ------------------------------------------------------------------ humanos
def human(name, P):
    """P: proporciones + materiales. Devuelve (rig, mesh, J) con J = posiciones de articulaciones."""
    coll = new_coll(name)
    H, sw, hw, hs, lt = P['H'], P['sw'], P['hw'], P.get('hs', 1.0), P.get('lt', 1.0)
    za, zk, zh, zw, zs, zn = 0.075, 0.27 * H, 0.505 * H, 0.60 * H, 0.81 * H, 0.835 * H
    hx, hy, hz = 0.098 * hs, 0.112 * hs, 0.128 * hs
    zhd = zn + 0.035 + hz * 0.8
    ua, fa = 0.175 * H, 0.15 * H
    J = dict(H=H, zs=zs, zn=zn, zhd=zhd, hx=hx, hy=hy, hz=hz, zw=zw, zh=zh, zk=zk)
    sx = sw / 2; lx = hw * 0.30
    ang = math.radians(P.get('arm_angle', 9))
    sh = {s: Vector((s * sx, 0.0, zs - 0.03)) for s in (1, -1)}
    el = {s: sh[s] + Vector((s * math.sin(ang) * ua, 0.01, -math.cos(ang) * ua)) for s in (1, -1)}
    wr = {s: el[s] + Vector((s * math.sin(ang) * 0.6 * fa, -0.02, -math.cos(ang) * fa)) for s in (1, -1)}
    J.update(sh=sh, el=el, wr=wr)
    bones = [('root', (0, 0, 0), (0, 0, 0.2), None), ('hips', (0, 0, zh - 0.04), (0, 0, zw), 'root'),
             ('spine', (0, 0, zw), (0, 0, (zw + zs) / 2), 'hips'), ('chest', (0, 0, (zw + zs) / 2), (0, 0, zn), 'spine'),
             ('neck', (0, 0, zn), (0, 0, zn + 0.04), 'chest'), ('head', (0, 0, zn + 0.04), (0, 0, zhd + hz), 'neck')]
    for s, side in ((1, 'L'), (-1, 'R')):
        bones += [(f'upper_arm.{side}', sh[s], el[s], 'chest'), (f'forearm.{side}', el[s], wr[s], f'upper_arm.{side}'),
                  (f'hand.{side}', wr[s], wr[s] + Vector((0, 0, -0.085)), f'forearm.{side}'),
                  (f'thigh.{side}', (s * lx, 0, zh - 0.03), (s * lx, 0, zk), 'hips'), (f'shin.{side}', (s * lx, 0, zk), (s * lx, 0, za), f'thigh.{side}'),
                  (f'foot.{side}', (s * lx, 0, za), (s * lx, -0.13, 0.02), f'shin.{side}')]
    rig = make_rig(name, bones, coll)
    b = Builder(name + '_mesh')
    skin = material(name + '_piel', color=P['skin'])
    face = material(name + '_cara', tex=f'face_{name}.png', rough=0.7)
    # torso y cadera
    b.part('cyl', (0, 0, (zw + zs) / 2 + 0.01), (sw * 0.40, 0.125 * lt, zs - zw + 0.02), mat=P['top'], bone='chest', segs=10, r2=P.get('chest_r2', 1.18))
    b.part('cyl', (0, 0, (zh + zw) / 2 - 0.02), (hw * 0.5, 0.12 * lt, zw - zh + 0.1), mat=P['legs'], bone='hips', segs=10, r2=1.0)
    b.part('cyl', (0, 0, zn + 0.01), (0.047, 0.044, 0.08), mat=skin, bone='neck', segs=8)
    # cabeza (cara proyectada desde el frente), nariz y orejas
    def jaw(c):
        x, y, z = c
        if z < 0: x *= 1 - P.get('jaw', 0.26) * (-z) ** 1.4
        if y < 0: y *= 0.9
        return (x, y, z)
    b.part('sphere', (0, 0, zhd), (hx, hy, hz), mat=skin, bone='head', segs=18, rings=12, deform=jaw, front=face)
    b.part('cone', (0, -hy * 0.9, zhd - hz * 0.2), (0.016 * hs, 0.012, 0.045), rot=(90, 0, 0), mat=skin, bone='head', segs=4)
    for s in (1, -1):
        b.part('sphere', (s * hx * 0.98, 0.0, zhd - 0.005), (0.012, 0.028, 0.038), mat=skin, bone='head', segs=8, rings=5)
    # brazos, manos, piernas y pies
    for s, side in ((1, 'L'), (-1, 'R')):
        b.limb(sh[s], el[s], 0.05 * lt, 0.043 * lt, P['arms'], f'upper_arm.{side}')
        b.part('sphere', tuple(sh[s]), (0.058 * lt, 0.06 * lt, 0.058 * lt), mat=P['top'], bone=f'upper_arm.{side}', segs=8, rings=6)
        b.limb(el[s], wr[s], 0.043 * lt, 0.034 * lt, P.get('forearm', P['arms']), f'forearm.{side}')
        hc = wr[s] + Vector((0, -0.005, -0.045))
        b.part('box', tuple(hc), (0.022, 0.038, 0.048), mat=P.get('hands', skin), bone=f'hand.{side}', smooth=False)
        b.part('box', tuple(wr[s] + Vector((-s * 0.0, -0.035, -0.03))), (0.014, 0.012, 0.025), rot=(0, 0, 0), mat=P.get('hands', skin), bone=f'hand.{side}', smooth=False)
        b.limb((s * lx, 0, zh - 0.02), (s * lx, 0, zk), 0.078 * lt, 0.058 * lt, P['legs'], f'thigh.{side}')
        b.limb((s * lx, 0, zk), (s * lx, 0, za + 0.03), 0.056 * lt, 0.045 * lt, P['legs'], f'shin.{side}')
        b.part('box', (s * lx, -0.04, 0.045), (0.055, 0.12, 0.045), mat=P['shoes'], bone=f'foot.{side}', smooth=False)
    P['extras'](b, J, skin)
    ob = b.build(coll); bind(ob, rig)
    human_actions(rig)
    return rig, ob


def human_actions(rig):
    T = lambda L, R, sc=1: {**{f'thigh.L': cycle([(a * sc, 0, 0) for a in L]), 'thigh.R': cycle([(a * sc, 0, 0) for a in R])}}
    walk = {
        'thigh.L': cycle([(-26, 0, 0), (0, 0, 0), (24, 0, 0), (0, 0, 0)]), 'thigh.R': cycle([(24, 0, 0), (0, 0, 0), (-26, 0, 0), (0, 0, 0)]),
        'shin.L': cycle([(6, 0, 0), (12, 0, 0), (38, 0, 0), (18, 0, 0)]), 'shin.R': cycle([(38, 0, 0), (18, 0, 0), (6, 0, 0), (12, 0, 0)]),
        'upper_arm.L': cycle([(18, 0, 0), (0, 0, 0), (-18, 0, 0), (0, 0, 0)]), 'upper_arm.R': cycle([(-18, 0, 0), (0, 0, 0), (18, 0, 0), (0, 0, 0)]),
        'forearm.L': cycle([(-12, 0, 0), (-18, 0, 0)] * 2), 'forearm.R': cycle([(-12, 0, 0), (-18, 0, 0)] * 2),
        'spine': cycle([(3, 0, 2), (3, 0, 0), (3, 0, -2), (3, 0, 0)]), 'head': cycle([(0, 0, -2), (0, 0, 2)]),
    }
    add_action(rig, 'Walk', walk, {'root': cycle([(0, 0, 0), (0, 0.025, 0)] * 2)})
    run = {k: [(f, tuple(a * 1.7 for a in r)) for f, r in v] for k, v in walk.items()}
    run = {k: [(1 + round((f - 1) * 16 / 24), r) for f, r in v] for k, v in run.items()}
    run['spine'] = cycle([(14, 0, 3), (14, 0, -3)], 16); run['forearm.L'] = cycle([(-70, 0, 0)], 16); run['forearm.R'] = cycle([(-70, 0, 0)], 16)
    add_action(rig, 'Run', run, {'root': cycle([(0, 0, 0), (0, 0.05, 0)] * 2, 16)})
    add_action(rig, 'Idle', {'chest': cycle([(0, 0, 0), (2.5, 0, 0)], 48), 'head': cycle([(0, 0, 0), (2, 3, 0), (0, 0, 0), (-1, -3, 0)], 48),
                             'upper_arm.L': cycle([(0, 0, 0), (2, 0, 0)], 48), 'upper_arm.R': cycle([(0, 0, 0), (2, 0, 0)], 48)})
    crouch = {'thigh.L': cycle([(-70, 0, 0), (-50, 0, 0), (-60, 0, 0), (-75, 0, 0)]), 'thigh.R': cycle([(-60, 0, 0), (-75, 0, 0), (-70, 0, 0), (-50, 0, 0)]),
              'shin.L': cycle([(85, 0, 0), (70, 0, 0), (80, 0, 0), (90, 0, 0)]), 'shin.R': cycle([(80, 0, 0), (90, 0, 0), (85, 0, 0), (70, 0, 0)]),
              'spine': cycle([(25, 0, 0)]), 'head': cycle([(-15, 0, 0)]), 'upper_arm.L': cycle([(-20, 0, 0)]), 'upper_arm.R': cycle([(-20, 0, 0)]),
              'forearm.L': cycle([(-40, 0, 0)]), 'forearm.R': cycle([(-40, 0, 0)])}
    add_action(rig, 'Crouch', crouch, {'root': cycle([(0, -0.33, 0)])})
    add_action(rig, 'Sit', {'thigh.L': cycle([(-88, 0, 0)]), 'thigh.R': cycle([(-88, 0, 0)]), 'shin.L': cycle([(88, 0, 0)]), 'shin.R': cycle([(88, 0, 0)]),
                            'upper_arm.L': cycle([(-35, 0, 0)]), 'upper_arm.R': cycle([(-35, 0, 0)]), 'forearm.L': cycle([(-50, 0, 0)]), 'forearm.R': cycle([(-50, 0, 0)])},
               {'root': cycle([(0, -0.42, 0)])})
    add_action(rig, 'Reach', {'upper_arm.R': [(1, (0, 0, 0)), (12, (-85, 0, 0)), (48, (-85, 0, 0))], 'forearm.R': [(1, (0, 0, 0)), (12, (-10, 0, 0)), (48, (-10, 0, 0))],
                              'head': [(1, (0, 0, 0)), (12, (5, 0, 0)), (48, (5, 0, 0))]})


# ---------- Oliver: grande, cara amable, gorro naranja, chaleco con parches, casco con stickers
def oliver_extras(b, J, skin):
    zhd, hx, hy, hz, zs, zw = J['zhd'], J['hx'], J['hy'], J['hz'], J['zs'], J['zw']
    b.part('cyl', (0, 0, (zw + zs) / 2 + 0.04), (0.255, 0.15, zs - zw - 0.02), mat=M['vest'], bone='chest', segs=10, r2=1.12)
    b.part('sphere', (0, 0.004, zhd + hz * 0.28), (hx * 1.12, hy * 1.1, hz * 0.95), mat=M['beanie'], bone='head', segs=14, rings=8, cut=lambda c: c.z < 0.05)
    b.part('cyl', (0, 0.004, zhd + hz * 0.36), (hx * 1.15, hy * 1.12, 0.05), mat=M['beanie'], bone='head', segs=14)
    b.part('box', (0.04, -hy * 1.1, zhd + hz * 0.4), (0.011, 0.004, 0.011), mat=M['sticker_g'], bone='head', smooth=False)
    for s in (1, -1):
        b.part('box', (s * hx * 0.9, -hy * 0.35, zhd - hz * 0.05), (0.006, 0.018, 0.04), mat=M['beard'], bone='head', smooth=False)
        # mangas remangadas: puño de tela + venda en el antebrazo derecho
        el = J['el'][s]; b.part('cyl', tuple(el + Vector((0, 0, -0.01))), (0.05, 0.05, 0.05), mat=M['jumpsuit_plain'], bone=f'forearm.{"L" if s > 0 else "R"}', segs=8)
    b.part('cyl', tuple(J['el'][-1] + Vector((-0.015, 0, -0.09))), (0.041, 0.041, 0.045), mat=M['bandage'], bone='forearm.R', segs=8)
    # barba recortada (volumen bajo la mandíbula)
    b.part('sphere', (0, -hy * 0.18, zhd - hz * 0.58), (hx * 0.78, hy * 0.72, hz * 0.42), mat=M['beard'], bone='head', segs=12, rings=6, cut=lambda c: c.z > 0.35 or c.y > 0.3)
    # cinturón, casco con stickers y guantes colgando
    b.part('cyl', (0, 0, zw - 0.02), (0.205, 0.135, 0.05), mat=M['dark'], bone='hips', segs=10)
    b.part('sphere', (-0.24, -0.02, zw - 0.1), (0.12, 0.12, 0.09), rot=(0, 70, 0), mat=M['yellow'], bone='hips', segs=10, rings=6, cut=lambda c: c.z < -0.05)
    for i, m in enumerate(('sticker_r', 'sticker_b', 'sticker_g')):
        b.part('box', (-0.33, -0.05 + i * 0.05, zw - 0.08 + (i % 2) * 0.04), (0.004, 0.018, 0.018), mat=M[m], bone='hips', smooth=False)
    b.part('box', (0.22, -0.06, zw - 0.14), (0.02, 0.04, 0.07), mat=M['glove'], bone='hips', smooth=False)


# ---------- Claire: rostro dulce, coleta baja sobre el hombro, flequillo de lado, gafas con una luna rota, bata
def claire_extras(b, J, skin):
    zhd, hx, hy, hz, zs, zw, zh, zk, zn = J['zhd'], J['hx'], J['hy'], J['hz'], J['zs'], J['zw'], J['zh'], J['zk'], J['zn']
    hc = M['hair_claire']
    # bata: torso abierto (dos solapas), faldón hasta la rodilla y mangas
    for s in (1, -1):
        b.part('box', (s * 0.085, -0.005, (zw + zs) / 2), (0.08, 0.135, (zs - zw) / 2 + 0.02), mat=M['labcoat'], bone='chest', smooth=False)
    b.part('cyl', (0, 0.01, (zk + 0.08 + zw) / 2), (0.19, 0.15, zw - zk - 0.08), mat=M['labcoat'], bone='hips', segs=10, r2=0.82, open_ends=True)
    b.part('box', (0.1, -0.135, zs - 0.12), (0.03, 0.004, 0.02), mat=M['badge'], bone='chest', smooth=False)
    b.part('box', (-0.09, -0.135, zs - 0.09), (0.003, 0.003, 0.03), mat=M['sticker_b'], bone='chest', smooth=False)
    # pelo: casquete con la cara libre, flequillo de lado, mechones y coleta baja
    b.part('sphere', (0, 0.012, zhd + 0.008), (hx * 1.1, hy * 1.08, hz * 1.07), mat=hc, bone='head', segs=18, rings=12,
           cut=lambda c: (c.y < -0.15 and c.z < 0.5) or c.z < -0.75)
    b.part('sphere', (0.01, -hy * 0.86, zhd + hz * 0.6), (hx * 0.92, hy * 0.28, hz * 0.2), rot=(0, -12, 0), mat=hc, bone='head', segs=12, rings=6)
    b.part('sphere', (-hx * 0.55, -hy * 0.78, zhd + hz * 0.48), (hx * 0.45, hy * 0.25, hz * 0.22), rot=(0, 28, 0), mat=hc, bone='head', segs=10, rings=6)
    for s in (1, -1):
        b.limb((s * hx * 0.88, -hy * 0.55, zhd + hz * 0.45), (s * hx * 0.95, -hy * 0.62, zhd - hz * 0.85), 0.026, 0.012, hc, 'head', segs=6)
    pts = [Vector((0.035, hy * 0.85, zhd - hz * 0.6)), Vector((0.11, hy * 0.35, zn)), Vector((0.15, -0.07, zs - 0.06)), Vector((0.15, -0.12, zs - 0.24))]
    b.part('sphere', tuple(pts[0]), (0.03, 0.03, 0.03), mat=M['teal_dark'], bone='head', segs=8, rings=5)
    b.limb(pts[0], pts[1], 0.04, 0.042, hc, 'head'); b.limb(pts[1], pts[2], 0.042, 0.034, hc, 'chest'); b.limb(pts[2], pts[3], 0.034, 0.012, hc, 'chest')
    # gafas redondeadas; la luna derecha (de ella) está rota
    ez = zhd + hz * 0.06; ex = hx * 0.4; ey = -hy * 1.02
    for s in (1, -1):
        b.ring((s * ex, ey, ez), hx * 0.33, hx * 0.29, 0.006, 0.006, M['frame'], 'head')
        b.part('cyl', (s * ex, ey + 0.002, ez), (hx * 0.31, hx * 0.27, 0.002), rot=(90, 0, 0), mat=M['lens'], bone='head', segs=14)
        b.part('box', (s * hx * 0.84, ey * 0.62, ez + 0.006), (0.003, hy * 0.42, 0.003), mat=M['frame'], bone='head', smooth=False)
    b.part('box', (0, ey, ez + 0.008), (hx * 0.09, 0.004, 0.003), mat=M['frame'], bone='head', smooth=False)
    for a in (20, 75, 140):
        b.part('box', (-ex, ey - 0.004, ez), (hx * 0.2, 0.0006, 0.0007), rot=(0, a, 0), mat=M['crack'], bone='head', smooth=False)
    # portapapeles en la mano derecha
    w = J['wr'][-1]
    b.part('box', (w.x - 0.02, w.y - 0.07, w.z - 0.06), (0.012, 0.11, 0.15), rot=(-15, 0, 0), mat=M['wood'], bone='hand.R', smooth=False)
    b.part('box', (w.x - 0.034, w.y - 0.07, w.z - 0.07), (0.003, 0.095, 0.12), rot=(-15, 0, 0), mat=M['paper'], bone='hand.R', smooth=False)


# ---------- Elliot: abrigo enorme, linterna en el pecho, auriculares al cuello, flequillo revuelto
def elliot_extras(b, J, skin):
    zhd, hx, hy, hz, zs, zw, zk, zn = J['zhd'], J['hx'], J['hy'], J['hz'], J['zs'], J['zw'], J['zk'], J['zn']
    hc = M['hair_elliot']
    b.part('cyl', (0, 0.0, (zw + zs) / 2 + 0.01), (0.26, 0.17, zs - zw + 0.06), mat=M['coat'], bone='chest', segs=10, r2=1.15)
    b.part('cyl', (0, 0.01, (zk + 0.18 + zw) / 2), (0.21, 0.17, zw - zk - 0.16), mat=M['coat'], bone='hips', segs=10, r2=0.95, open_ends=True)
    for s in (1, -1):
        b.part('box', (s * 0.09, -0.03, zn + 0.01), (0.07, 0.03, 0.08), rot=(15, 0, s * 20), mat=M['coat'], bone='chest', smooth=False)
        side = 'L' if s > 0 else 'R'
        b.limb(J['sh'][s], J['el'][s], 0.07, 0.065, M['coat'], f'upper_arm.{side}')
        b.limb(J['el'][s], J['wr'][s] + Vector((0, 0, -0.04)), 0.065, 0.06, M['coat'], f'forearm.{side}')
    # correa + linterna (con luz) en el pecho
    b.limb((0.2, -0.17, zs - 0.02), (-0.18, -0.17, zw + 0.02), 0.012, 0.012, M['dark'], 'chest', segs=4)
    b.part('cyl', (-0.06, -0.2, zs - 0.13), (0.035, 0.035, 0.09), rot=(90, 0, 0), mat=M['dark'], bone='chest', segs=8)
    b.part('cyl', (-0.06, -0.246, zs - 0.13), (0.03, 0.03, 0.004), rot=(90, 0, 0), mat=M['torch_lens'], bone='chest', segs=8)
    # auriculares al cuello
    b.part('cyl', (0, -0.01, zn + 0.0), (0.085, 0.08, 0.02), mat=M['dark'], bone='neck', segs=12, open_ends=True)
    for s in (1, -1): b.part('cyl', (s * 0.08, -0.03, zn - 0.01), (0.035, 0.035, 0.02), rot=(0, 90, 0), mat=M['dark'], bone='neck', segs=8)
    # pelo negro revuelto: casquete + puntas
    b.part('sphere', (0, 0.01, zhd + 0.012), (hx * 1.1, hy * 1.08, hz * 1.04), mat=hc, bone='head', segs=16, rings=10,
           cut=lambda c: (c.y < -0.2 and c.z < 0.55) or c.z < -0.55)
    import random
    r = random.Random(7)
    for i in range(16):
        a = math.radians(-160 + i * 22 + r.uniform(-6, 6)); el = r.uniform(0.25, 0.75)
        base = Vector((math.cos(a) * hx * 0.95 * math.cos(el), math.sin(a) * hy * 0.95 * math.cos(el), zhd + hz * 0.9 * math.sin(el) + 0.02))
        tip = base + (base - Vector((0, 0, zhd))).normalized() * 0.06 + Vector((r.uniform(-.02, .02), 0, -0.03))
        b.limb(base, tip, 0.03, 0.0, hc, 'head', segs=4, smooth=False)
    for i in range(6):  # flequillo sobre la frente
        x = -hx * 0.6 + i * hx * 0.24
        b.limb((x, -hy * 0.85, zhd + hz * 0.62), (x + 0.012, -hy * 1.02, zhd + hz * 0.25), 0.02, 0.0, hc, 'head', segs=4, smooth=False)


CHAR = {
    'oliver': dict(H=1.86, sw=0.50, hw=0.38, hs=1.03, lt=1.12, skin='#e2b08b', top=M['jumpsuit'], arms=M['jumpsuit_plain'], forearm=material('oliver_antebrazo', color='#d9a684'),
                   legs=M['jumpsuit_plain'], shoes=M['boots'], jaw=0.12, chest_r2=1.22, extras=oliver_extras),
    'claire': dict(H=1.68, sw=0.38, hw=0.36, hs=0.97, lt=0.86, skin='#f1cfb6', top=M['jumpsuit'], arms=M['labcoat'], legs=M['jumpsuit_plain'],
                   shoes=M['dark'], jaw=0.3, chest_r2=1.1, arm_angle=7, extras=claire_extras),
    'elliot': dict(H=1.74, sw=0.42, hw=0.33, hs=1.0, lt=0.92, skin='#8c5c42', top=M['jumpsuit'], arms=M['coat'], legs=M['jumpsuit_plain'],
                   shoes=M['boots'], hands=M['coat'], jaw=0.3, extras=elliot_extras),
}


# ------------------------------------------------------------------ El Recolector (trípode glitcheado, ~2,6 m)
def recolector():
    coll = new_coll('recolector')
    hip = {'FL': Vector((0.3, -0.35, 1.15)), 'FR': Vector((-0.3, -0.35, 1.15)), 'B': Vector((0.0, 0.45, 1.2))}
    knee = {'FL': Vector((0.85, -0.75, 1.75)), 'FR': Vector((-0.85, -0.75, 1.75)), 'B': Vector((0.0, 1.15, 1.85))}
    foot = {'FL': Vector((1.05, -1.0, 0.0)), 'FR': Vector((-1.05, -1.0, 0.0)), 'B': Vector((0.0, 1.5, 0.0))}
    sh = {1: Vector((0.36, -0.5, 1.45)), -1: Vector((-0.36, -0.5, 1.45))}
    elb = {1: Vector((0.72, -0.95, 1.0)), -1: Vector((-0.72, -0.95, 1.0))}
    wri = {1: Vector((0.55, -1.35, 0.15)), -1: Vector((-0.55, -1.35, 0.15))}
    neck0, head = Vector((0, -0.5, 1.5)), Vector((0, -1.12, 1.52))
    bones = [('root', (0, 0, 0), (0, 0, 0.3), None), ('body', (0, 0.1, 1.15), (0, -0.4, 1.5), 'root'),
             ('neck', tuple(neck0), (0, -0.9, 1.65), 'body'), ('head', (0, -0.9, 1.65), (0, -1.3, 1.45), 'neck')]
    for k in ('FL', 'FR', 'B'):
        bones += [(f'leg_{k}_u', hip[k], knee[k], 'body'), (f'leg_{k}_l', knee[k], foot[k], f'leg_{k}_u')]
    for s, side in ((1, 'L'), (-1, 'R')):
        bones += [(f'arm_{side}_u', sh[s], elb[s], 'body'), (f'arm_{side}_l', elb[s], wri[s], f'arm_{side}_u')]
    rig = make_rig('recolector', bones, coll)
    b = Builder('recolector_mesh')
    lump = lambda c: (c.x * (1 + 0.18 * math.sin(c.z * 7 + c.y * 3)), c.y * (1 + 0.1 * math.sin(c.x * 6)), c.z + 0.08 * math.sin(c.x * 9))
    # masa encorvada: varios bultos de uniformes compactados
    for loc, size in (((0, -0.1, 1.28), (0.5, 0.62, 0.42)), ((0.26, 0.22, 1.45), (0.3, 0.3, 0.3)), ((-0.3, 0.12, 1.18), (0.32, 0.34, 0.3)), ((0, -0.45, 1.52), (0.3, 0.28, 0.26))):
        b.part('sphere', loc, size, rot=(-25, 0, 0), mat=M['rec_patch'], bone='body', segs=12, rings=8, deform=lump)
    for i in range(4):
        b.part('cyl', (0, 0.25 - i * 0.2, 1.35 + i * 0.04), (0.46 - abs(i - 1.5) * 0.06,) * 2 + (0.04,), rot=(-80, 0, 0), mat=M['hose'], bone='body', segs=12, open_ends=True)
    for x, y, z, m, r in ((0.35, -0.3, 1.5, 'jumpsuit_plain', 20), (-0.38, -0.05, 1.32, 'coat', -30), (0.1, 0.35, 1.62, 'labcoat', 10), (-0.15, -0.55, 1.66, 'beanie', 40), (0.2, 0.0, 1.08, 'vest', -10)):
        b.part('box', (x, y, z), (0.17, 0.02, 0.14), rot=(-30, r, 0), mat=M[m], bone='body', smooth=False)
    # cuello que cuelga hacia delante y cabeza de tres caras
    b.limb(neck0, Vector((0, -0.92, 1.63)), 0.14, 0.1, M['rec_patch'], 'neck')
    b.part('sphere', tuple(head), (0.19, 0.2, 0.26), rot=(-15, 0, 0), mat=M['rec_patch'], bone='head', segs=12, rings=10, front=M['rec_faces'])
    for dx, dz in ((0.09, 0.03), (-0.07, -0.04)):
        b.part('sphere', tuple(head + Vector((dx, -0.04, dz))), (0.19, 0.2, 0.26), rot=(-15, 0, 0), mat=M['rec_ghost'], bone='head', segs=10, rings=6, front=M['rec_ghost'])
    b.part('box', tuple(head + Vector((0, -0.2, -0.12))), (0.1, 0.012, 0.01), mat=M['mouth'], bone='head', smooth=False)
    # tres patas de araña, distintas: Oliver (casco), Claire (vendas de bata), Elliot (linterna parpadeante)
    legmat = {'FL': M['jumpsuit_plain'], 'FR': M['labcoat'], 'B': M['coat']}
    for k in ('FL', 'FR', 'B'):
        b.limb(hip[k], knee[k], 0.14, 0.09, legmat[k], f'leg_{k}_u')
        b.limb(knee[k], foot[k] + Vector((0, 0, 0.14)), 0.09, 0.045, legmat[k], f'leg_{k}_l')
        b.part('sphere', tuple(knee[k]), (0.11, 0.11, 0.11), mat=M['rec_patch'], bone=f'leg_{k}_l', segs=8, rings=6, deform=lump)
        for a in (-40, 0, 40):  # muñón con garfios
            d = Vector((math.sin(math.radians(a)) * 0.14, (-0.12 if k != 'B' else 0.12), -0.13))
            b.limb(foot[k] + Vector((0, 0, 0.15)), foot[k] + d + Vector((0, 0, 0.02)), 0.032, 0.0, M['hook'], f'leg_{k}_l', segs=4, smooth=False)
    b.part('sphere', tuple(knee['FL'] + Vector((0.07, -0.06, 0.07))), (0.14, 0.14, 0.11), rot=(0, 40, -30), mat=M['yellow'], bone='leg_FL_l', segs=10, rings=6, cut=lambda c: c.z < 0)
    for i in range(4):
        b.part('cyl', tuple(knee['FR'] + (foot['FR'] - knee['FR']) * (0.12 + i * 0.2)), (0.08, 0.08, 0.04), mat=M['bandage'], bone='leg_FR_l', segs=8, open_ends=True)
    tm = knee['B'] + (foot['B'] - knee['B']) * 0.25
    b.part('cyl', tuple(tm + Vector((0, -0.08, 0))), (0.045, 0.045, 0.14), rot=(80, 0, 0), mat=M['dark'], bone='leg_B_l', segs=8)
    b.part('cyl', tuple(tm + Vector((0, -0.16, 0.0))), (0.04, 0.04, 0.005), rot=(80, 0, 0), mat=M['torch_lens'], bone='leg_B_l', segs=8)
    # brazos largos que arrastra, con dedos de más
    for s, side in ((1, 'L'), (-1, 'R')):
        b.limb(sh[s], elb[s], 0.07, 0.05, M['rec_patch'], f'arm_{side}_u')
        b.limb(elb[s], wri[s], 0.05, 0.034, M['coat' if s > 0 else 'labcoat'], f'arm_{side}_l')
        for i in range(7):
            a = math.radians(-60 + i * 20)
            b.limb(wri[s], wri[s] + Vector((math.sin(a) * 0.12, -0.16, -0.1 - (i % 2) * 0.04)), 0.013, 0.0, M['hook'], f'arm_{side}_l', segs=4, smooth=False)
    # esquirlas de glitch (la demo las hace parpadear)
    import random
    r = random.Random(3)
    for i in range(12):
        p = Vector((r.uniform(-0.6, 0.6), r.uniform(-0.9, 0.5), r.uniform(0.9, 1.9)))
        b.part('box', tuple(p), (r.uniform(0.05, 0.2), 0.004, r.uniform(0.01, 0.04)), rot=(r.uniform(0, 90), 0, r.uniform(0, 180)),
               mat=M['glitch_c'] if i % 2 else M['glitch_r'], bone='body', smooth=False)
    ob = b.build(coll); bind(ob, rig)
    L = 36
    def leg(phase): return cycle([(-30 if i == phase else (8 if i == (phase + 1) % 6 else 0), 0, 0) for i in range(6)], L)
    def low(phase): return cycle([(35 if i == phase else 0, 0, 0) for i in range(6)], L)
    walk = {'leg_FL_u': leg(0), 'leg_FR_u': leg(2), 'leg_B_u': leg(4), 'leg_FL_l': low(0), 'leg_FR_l': low(2), 'leg_B_l': low(4),
            'body': cycle([(0, 0, 6), (4, 0, 0), (0, 0, -6), (4, 0, 0), (0, 4, 0), (4, -4, 0)], L),
            'head': cycle([(0, 0, 0), (10, 25, 0), (0, 0, 0), (-5, -30, 8), (0, 0, 0), (15, 0, -10)], L),
            'arm_L_u': cycle([(10, 0, 0), (-10, 0, 0)] * 3, L), 'arm_R_u': cycle([(-10, 0, 0), (10, 0, 0)] * 3, L)}
    add_action(rig, 'Walk', walk)
    add_action(rig, 'Idle', {'body': cycle([(0, 0, 0), (5, 0, 0)], 48), 'head': cycle([(0, 0, 0), (0, 40, 0), (0, 40, 0), (12, -35, 10), (0, 0, 0), (0, 0, 0)], 48),
                             'arm_L_l': cycle([(0, 0, 0), (8, 0, 0)], 48), 'arm_R_l': cycle([(5, 0, 0), (0, 0, 0)], 48)})
    add_action(rig, 'Lunge', {'body': [(1, (0, 0, 0)), (6, (-25, 0, 0)), (12, (25, 0, 0)), (24, (0, 0, 0))], 'head': [(1, (0, 0, 0)), (8, (-30, 0, 0)), (14, (20, 0, 0)), (24, (0, 0, 0))],
                              'arm_L_u': [(1, (0, 0, 0)), (10, (-80, 0, 0)), (24, (0, 0, 0))], 'arm_R_u': [(1, (0, 0, 0)), (10, (-80, 0, 0)), (24, (0, 0, 0))]})
    return rig, ob


# ------------------------------------------------------------------ Palimpsest · Forma de Cosecha (cuatro patas, ~3,4 m de largo)
def palimpsest():
    coll = new_coll('palimpsest')
    Z = 1.05
    sh = {'FL': Vector((0.34, -0.6, Z)), 'FR': Vector((-0.34, -0.6, Z)), 'BL': Vector((0.32, 0.75, Z - 0.05)), 'BR': Vector((-0.32, 0.75, Z - 0.05))}
    kn = {'FL': Vector((1.05, -1.0, 2.0)), 'FR': Vector((-1.05, -1.0, 2.0)), 'BL': Vector((1.1, 1.05, 2.3)), 'BR': Vector((-1.1, 1.05, 2.3))}
    ft = {'FL': Vector((1.3, -1.65, 0.0)), 'FR': Vector((-1.3, -1.65, 0.0)), 'BL': Vector((1.35, 1.85, 0.0)), 'BR': Vector((-1.35, 1.85, 0.0))}
    hd = Vector((0, -1.85, 1.55))
    bones = [('root', (0, 0, 0), (0, 0, 0.3), None), ('pelvis', (0, 0.8, Z), (0, 0.2, Z + 0.05), 'root'), ('spine', (0, 0.2, Z + 0.05), (0, -0.4, Z + 0.1), 'pelvis'),
             ('chest', (0, -0.4, Z + 0.1), (0, -0.75, Z + 0.2), 'spine'), ('neck1', (0, -0.75, Z + 0.2), (0, -1.2, Z + 0.45), 'chest'), ('neck2', (0, -1.2, Z + 0.45), (0, -1.5, Z + 0.55), 'neck1'),
             ('head', (0, -1.5, Z + 0.55), tuple(hd + Vector((0, -0.1, 0.45))), 'neck2'), ('jaw', tuple(hd + Vector((0, 0.15, -0.2))), tuple(hd + Vector((0, -0.3, -0.3))), 'head'),
             ('tail', (0, 0.95, Z), (0, 1.6, Z - 0.4), 'pelvis')]
    for k in sh:
        bones += [(f'leg_{k}_u', sh[k], kn[k], 'chest' if k[0] == 'F' else 'pelvis'), (f'leg_{k}_l', kn[k], ft[k], f'leg_{k}_u')]
    rig = make_rig('palimpsest', bones, coll)
    b = Builder('palimpsest_mesh')
    # torso: la "vaina" del disfraz de PIP abierta como un invernadero, con Lumen dentro
    b.part('sphere', (0, 0.12, Z + 0.05), (0.46, 1.0, 0.38), mat=M['plastic'], bone='spine', segs=14, rings=8, cut=lambda c: c.z > 0.5 and abs(c.x) < 0.55)
    b.part('sphere', (0, 0.1, Z + 0.12), (0.24, 0.55, 0.22), mat=M['lumen'], bone='spine', segs=10, rings=6)
    for i in range(6):
        b.part('cyl', (0, -0.5 + i * 0.23, Z + 0.12), (0.48, 0.42, 0.03), rot=(90, 0, 0), mat=M['metal'], bone='spine' if i < 4 else 'pelvis', segs=10, open_ends=True, cut=lambda c: c.y < -0.45)
    b.part('box', (0, 0.12, Z + 0.47), (0.05, 0.95, 0.04), mat=M['metal'], bone='spine', smooth=False)
    # cuello de vértebras de manguera y cables
    a0, a1 = Vector((0, -0.72, Z + 0.2)), hd + Vector((0, 0.32, -0.02))
    for i in range(8):
        t = i / 7; p = a0.lerp(a1, t)
        b.part('cyl', tuple(p), (0.14 - t * 0.03, 0.14 - t * 0.03, 0.08), rot=(-60, 0, 0), mat=M['hose'], bone='neck1' if t < 0.5 else 'neck2', segs=10)
    for s in (1, -1): b.limb(a0 + Vector((s * 0.07, 0, 0.05)), a1 + Vector((s * 0.06, 0, 0.08)), 0.025, 0.02, M['dark'], 'neck1', segs=6)
    # cabeza del animatrónico de PIP: semilla de plástico, carcasa rota con CRT, ojos-cámara, hoja y sombrerito
    b.part('sphere', tuple(hd), (0.42, 0.38, 0.5), mat=M['plastic'], bone='head', segs=16, rings=12,
           deform=lambda c: (c.x * (1 - 0.35 * max(0, c.z)), c.y * (1 - 0.25 * max(0, c.z)), c.z), front=M['pip_face'])
    for s in (1, -1):
        b.part('cyl', tuple(hd + Vector((s * 0.2, -0.35, 0.05))), (0.085, 0.085, 0.09), rot=(90, 0, 0), mat=M['dark'], bone='head', segs=10)
        b.part('cyl', tuple(hd + Vector((s * 0.2, -0.4, 0.05))), (0.05, 0.05, 0.006), rot=(90, 0, 0), mat=M['red_eye'], bone='head', segs=10)
    b.part('sphere', tuple(hd + Vector((0.16, 0.02, 0.56))), (0.24, 0.09, 0.04), rot=(0, -30, 20), mat=M['leaf'], bone='head', segs=8, rings=4)
    for loc, size, m in (((-0.14, 0, 0.4), (0.19, 0.19, 0.02), 'hat'), ((-0.16, 0, 0.52), (0.11, 0.11, 0.2), 'hat'), ((-0.155, 0, 0.45), (0.115, 0.115, 0.04), 'hat_band')):
        b.part('cyl', tuple(hd + Vector(loc)), size, rot=(0, 18, 0), mat=M[m], bone='head', segs=12)
    # mandíbula desencajada con demasiados dientes
    jc = hd + Vector((0, -0.08, -0.38))
    b.part('sphere', tuple(jc), (0.34, 0.24, 0.1), mat=M['plastic'], bone='jaw', segs=12, rings=6)
    b.part('box', tuple(jc + Vector((0, -0.05, 0.09))), (0.28, 0.14, 0.012), mat=M['mouth'], bone='jaw', smooth=False)
    for i in range(15):
        x = -0.27 + i * 0.0385
        b.part('cone', tuple(jc + Vector((x, -0.2 + abs(x) * 0.3, 0.13))), (0.019, 0.019, 0.07), mat=M['teeth'], bone='jaw', segs=4, smooth=False)
        b.part('cone', tuple(hd + Vector((x + 0.019, -0.33 + abs(x) * 0.3, -0.18))), (0.019, 0.019, 0.07), rot=(180, 0, 0), mat=M['teeth'], bone='head', segs=4, smooth=False)
    b.part('box', tuple(a0.lerp(a1, 0.6) + Vector((0, -0.12, -0.2))), (0.24, 0.012, 0.075), rot=(15, 0, 0), mat=M['sign'], bone='neck2', smooth=False)
    # cuatro patas: brazos de cosechadora con pistones, guantes de mascota y garras de podadora
    for k in sh:
        u, l = f'leg_{k}_u', f'leg_{k}_l'
        b.limb(sh[k], kn[k], 0.12, 0.085, M['metal'], u, segs=6, smooth=False)
        b.limb(kn[k], ft[k] + Vector((0, 0, 0.16)), 0.085, 0.05, M['metal'], l, segs=6, smooth=False)
        b.limb(sh[k].lerp(kn[k], 0.15) + Vector((0, 0, 0.12)), sh[k].lerp(kn[k], 0.8) + Vector((0, 0, 0.1)), 0.035, 0.035, M['yellow'], u, segs=6)
        b.part('sphere', tuple(kn[k]), (0.12, 0.12, 0.12), mat=M['dark'], bone=l, segs=8, rings=6)
        fb = ft[k] + Vector((0, 0, 0.17))
        if k[0] == 'F': b.part('sphere', tuple(fb), (0.11, 0.11, 0.08), mat=M['glove_white'], bone=l, segs=10, rings=6)
        fwd = -1 if k[0] == 'F' else 1
        for a in (-40, 0, 40):
            d = Vector((math.sin(math.radians(a)) * 0.22, fwd * math.cos(math.radians(a)) * 0.22, -0.15))
            b.limb(fb, fb + d, 0.04, 0.0, M['hook'], l, segs=4, smooth=False)
    b.limb((0, 0.95, Z), (0, 1.6, Z - 0.4), 0.06, 0.03, M['plastic'], 'tail')
    for i in range(3): b.part('sphere', (0, 1.25 + i * 0.13, Z - 0.17 - i * 0.08), (0.04, 0.04, 0.04), mat=M['yellow'], bone='tail', segs=6, rings=4)
    ob = b.build(coll); bind(ob, rig)
    L = 24
    def lg(ph):
        v = [(-25, 0, 0), (0, 0, 0), (22, 0, 0), (0, 0, 0)]; v = v[ph:] + v[:ph]; return cycle(v, L)
    def ll(ph):
        v = [(10, 0, 0), (35, 0, 0), (0, 0, 0), (0, 0, 0)]; v = v[ph:] + v[:ph]; return cycle(v, L)
    crawl = {'leg_FL_u': lg(0), 'leg_BR_u': lg(0), 'leg_FR_u': lg(2), 'leg_BL_u': lg(2), 'leg_FL_l': ll(0), 'leg_BR_l': ll(0), 'leg_FR_l': ll(2), 'leg_BL_l': ll(2),
             'spine': cycle([(0, 0, 5), (0, 0, -5)], L), 'neck1': cycle([(5, 0, 0), (-5, 0, 0)], L), 'head': cycle([(0, 0, 0), (0, 0, 25), (0, 0, 0), (0, 0, -10)], L),
             'jaw': cycle([(0, 0, 0), (12, 0, 0)], L), 'tail': cycle([(0, 0, 20), (0, 0, -20)], L)}
    add_action(rig, 'Crawl', crawl, {'root': cycle([(0, 0, 0), (0, 0.04, 0)] * 2, L)})
    add_action(rig, 'Idle', {'head': cycle([(0, 0, 0), (0, 0, 35), (0, 0, 35), (10, 0, -20), (0, 0, 0), (0, 0, 0)], 60), 'jaw': cycle([(0, 0, 0), (25, 0, 0), (0, 0, 0), (0, 0, 0), (35, 0, 0), (0, 0, 0)], 60),
                             'chest': cycle([(0, 0, 0), (4, 0, 0)], 60), 'tail': cycle([(0, 0, 10), (0, 0, -10)], 60)})
    add_action(rig, 'Lunge', {'chest': [(1, (0, 0, 0)), (6, (-30, 0, 0)), (12, (15, 0, 0)), (20, (0, 0, 0))], 'neck1': [(1, (0, 0, 0)), (6, (-20, 0, 0)), (12, (30, 0, 0)), (20, (0, 0, 0))],
                              'jaw': [(1, (0, 0, 0)), (8, (45, 0, 0)), (20, (0, 0, 0))], 'leg_FL_u': [(1, (0, 0, 0)), (6, (-50, 0, 0)), (14, (10, 0, 0)), (20, (0, 0, 0))],
                              'leg_FR_u': [(1, (0, 0, 0)), (6, (-50, 0, 0)), (14, (10, 0, 0)), (20, (0, 0, 0))]})
    return rig, ob


# ------------------------------------------------------------------ construir, exportar y guardar
def export(rig, ob, name):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    rig.select_set(True); ob.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT_MODELS, name + '.glb'), export_format='GLB', use_selection=True,
                              export_animation_mode='NLA_TRACKS', export_yup=True, export_apply=False)

built = {}
for name, P in CHAR.items():
    rig, ob = human(name, P); built[name] = (rig, ob); export(rig, ob, name)
rig, ob = recolector(); built['recolector'] = (rig, ob); export(rig, ob, 'recolector')
rig, ob = palimpsest(); built['palimpsest'] = (rig, ob); export(rig, ob, 'palimpsest')
# alineación para la escena .blend (lineup)
for i, (name, (rig, ob)) in enumerate(built.items()):
    rig.location.x = [-2.4, -1.2, 0.0, 1.9, 5.0][i]
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_SRC, 'personajes_v0.1.0.blend'))
print('OK', list(built))
