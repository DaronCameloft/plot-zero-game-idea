"""Utilidades de modelado procedural para PLOT ZERO (Blender 5.x, bpy).

Cada personaje se construye en UN bmesh: cada pieza aporta su material, su UV y su grupo de
vértices (peso 1.0 al hueso). Resultado: malla única, riggeada, lista para repintar pesos a mano.
Ejes de Blender: +Z arriba, los personajes miran a -Y (en glTF se convierte a +Z hacia delante).
"""
import math, os
import bpy, bmesh
from mathutils import Vector, Matrix, Euler

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEX = os.path.join(ROOT, 'art', 'textures')


def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c) + (1.0,)


_MATS = {}
def material(key, color='#808080', tex=None, emit=0.0, emit_color=None, alpha=None, rough=0.85):
    if key in _MATS: return _MATS[key]
    m = bpy.data.materials.new(key)
    try: m.use_nodes = True
    except Exception: pass
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    b.inputs['Roughness'].default_value = rough
    if 'Specular IOR Level' in b.inputs: b.inputs['Specular IOR Level'].default_value = 0.2
    if tex:
        img = bpy.data.images.load(os.path.join(TEX, tex), check_existing=True)
        n = nt.nodes.new('ShaderNodeTexImage'); n.image = img; n.interpolation = 'Closest'
        nt.links.new(n.outputs['Color'], b.inputs['Base Color'])
    else:
        b.inputs['Base Color'].default_value = srgb(color)
    if emit:
        b.inputs['Emission Color'].default_value = srgb(emit_color or color)
        b.inputs['Emission Strength'].default_value = emit
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha
        for attr, val in (('surface_render_method', 'BLENDED'), ('blend_method', 'BLEND')):
            try: setattr(m, attr, val)
            except Exception: pass
    m.use_backface_culling = False
    _MATS[key] = m
    return m


class Builder:
    """Acumula piezas en un bmesh con material, UV y grupo de huesos por pieza."""

    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new('UVMap')
        self.dl = self.bm.verts.layers.deform.new()
        self.mats, self.groups = [], []

    def _mi(self, m):
        if m not in self.mats: self.mats.append(m)
        return self.mats.index(m)

    def _gi(self, g):
        if g not in self.groups: self.groups.append(g)
        return self.groups.index(g)

    def part(self, kind, loc, size, rot=(0, 0, 0), mat=None, bone='root', uv='box', segs=8, rings=6,
             r2=1.0, deform=None, smooth=True, front=None, tile=0.5, open_ends=False, cut=None):
        """kind: box | cyl | cone | sphere. size: medio-tamaños (x, y, z); en cyl/cone, z = largo total.
        front=(mat_frente) proyecta la textura de cara en las caras que miran a -Y."""
        bm = self.bm
        if kind == 'box':
            res = bmesh.ops.create_cube(bm, size=2.0)
        elif kind in ('cyl', 'cone'):
            res = bmesh.ops.create_cone(bm, cap_ends=not open_ends, cap_tris=False, segments=segs, radius1=1.0,
                                        radius2=0.0 if kind == 'cone' else r2, depth=1.0)
        elif kind == 'sphere':
            res = bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
        else:
            raise ValueError(kind)
        verts = res['verts']
        if cut:
            dead = [v for v in verts if cut(v.co)]
            bmesh.ops.delete(bm, geom=dead, context='VERTS')
            verts = [v for v in verts if v.is_valid]
        M = Matrix.Translation(Vector(loc)) @ Euler([math.radians(a) for a in rot], 'XYZ').to_matrix().to_4x4()
        S = Vector(size)
        for v in verts:
            c = Vector(v.co)
            if deform: c = Vector(deform(c))
            v.co = M @ Vector((c.x * S.x, c.y * S.y, c.z * S.z))
        faces = {f for v in verts for f in v.link_faces}
        mi = self._mi(mat); gi = self._gi(bone)
        for v in verts: v[self.dl][gi] = 1.0
        bm.normal_update()
        if front is not None:
            xs = [v.co.x for v in verts]; zs = [v.co.z for v in verts]
            x0, x1, z0, z1 = min(xs), max(xs), min(zs), max(zs)
            fi = self._mi(front)
        for f in faces:
            f.material_index = mi; f.smooth = smooth
            n = f.normal
            if front is not None and n.y < -0.25:
                f.material_index = fi
                for l in f.loops:
                    l[self.uv].uv = ((l.vert.co.x - x0) / (x1 - x0), (l.vert.co.z - z0) / (z1 - z0))
                continue
            ax = max(range(3), key=lambda i: abs(n[i]))
            for l in f.loops:
                c = l.vert.co
                u, w = ((c.y, c.z), (c.x, c.z), (c.x, c.y))[ax]
                l[self.uv].uv = (u / tile, w / tile)
        return faces

    def limb(self, a, b, r1, r2, mat, bone, segs=8, smooth=True):
        """Cilindro troncocónico de A a B (extremidades, mangueras, patas)."""
        a, b = Vector(a), Vector(b); d = b - a; L = d.length
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        mid = (a + b) / 2
        res = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r1, radius2=r2, depth=L)
        verts = res['verts']
        M = Matrix.Translation(mid) @ q.to_matrix().to_4x4()
        for v in verts: v.co = M @ v.co
        mi = self._mi(mat); gi = self._gi(bone)
        for v in verts: v[self.dl][gi] = 1.0
        self.bm.normal_update()
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = mi; f.smooth = smooth
            ax = max(range(3), key=lambda i: abs(f.normal[i]))
            for l in f.loops:
                c = l.vert.co; u, w = ((c.y, c.z), (c.x, c.z), (c.x, c.y))[ax]
                l[self.uv].uv = (u / 0.5, w / 0.5)

    def ring(self, loc, rx, rz, w, depth, mat, bone, segs=20):
        """Aro elíptico (anillo plano con grosor) en el plano XZ: monturas de gafas, juntas."""
        bm = self.bm; mi = self._mi(mat); gi = self._gi(bone); L = Vector(loc); rows = []
        for (r1, r2) in ((rx, rz), (rx - w, rz - w)):
            for y in (-depth / 2, depth / 2):
                rows.append([bm.verts.new(L + Vector((math.cos(a) * r1, y, math.sin(a) * r2))) for a in (i / segs * math.tau for i in range(segs))])
        for row in rows:
            for v in row: v[self.dl][gi] = 1.0
        o0, o1, i0, i1 = rows
        for i in range(segs):
            j = (i + 1) % segs
            for q in ((o0[i], o0[j], i0[j], i0[i]), (o1[j], o1[i], i1[i], i1[j]), (o0[j], o0[i], o1[i], o1[j]), (i0[i], i0[j], i1[j], i1[i])):
                f = bm.faces.new(q); f.material_index = mi
                for l in f.loops: l[self.uv].uv = (0.5, 0.5)

    def build(self, coll):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me); coll.objects.link(ob)
        for g in self.groups: ob.vertex_groups.new(name=g)
        return ob


def make_rig(name, bones, coll):
    """bones: [(nombre, cabeza, cola, padre)]"""
    arm = bpy.data.armatures.new(name + '_rig')
    ob = bpy.data.objects.new(name + '_rig', arm); coll.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    for n, h, t, p in bones:
        eb = arm.edit_bones.new(n); eb.head = h; eb.tail = t; eb.roll = 0
        if p: eb.parent = arm.edit_bones[p]
    bpy.ops.object.mode_set(mode='OBJECT')
    return ob


def bind(mesh_ob, rig):
    mesh_ob.parent = rig
    mod = mesh_ob.modifiers.new('Armature', 'ARMATURE'); mod.object = rig


def add_action(rig, name, keys, loc_keys=None):
    """keys: {hueso: [(frame, (rx, ry, rz) en grados)]}. Se guarda como pista NLA (export glTF)."""
    rig.animation_data_create()
    act = bpy.data.actions.new(name); act.use_fake_user = True
    rig.animation_data.action = act
    for bname, frames in keys.items():
        pb = rig.pose.bones[bname]; pb.rotation_mode = 'XYZ'
        for f, r in frames:
            pb.rotation_euler = [math.radians(a) for a in r]; pb.keyframe_insert('rotation_euler', frame=f)
    for bname, frames in (loc_keys or {}).items():
        pb = rig.pose.bones[bname]
        for f, l in frames:
            pb.location = l; pb.keyframe_insert('location', frame=f)
    tr = rig.animation_data.nla_tracks.new(); tr.name = name
    tr.strips.new(name, 1, act)
    rig.animation_data.action = None
    for pb in rig.pose.bones: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)


def cycle(values, length=24):
    """Keys cíclicos: valores repartidos en `length` frames, cerrando el bucle."""
    n = len(values); out = [(1 + round(i * length / n), v) for i, v in enumerate(values)]
    out.append((1 + length, values[0])); return out
