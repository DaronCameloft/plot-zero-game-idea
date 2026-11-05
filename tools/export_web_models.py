"""Convierte art/models/*.glb a un formato apto para hostings que solo sirven tipos web comunes:
   demo/models/web/<id>.json  (glTF JSON + buffer como lista de bytes)
   demo/models/web/tex/<id>_<n>.png  (texturas como PNG independientes)
Uso: python3 tools/export_web_models.py"""
import json, os, struct, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'demo', 'models', 'web'); os.makedirs(os.path.join(OUT, 'tex'), exist_ok=True)
for f in sorted(glob.glob(os.path.join(ROOT, 'art', 'models', '*.glb'))):
    mid = os.path.basename(f)[:-4]; d = open(f, 'rb').read()
    jl = struct.unpack('<I', d[12:16])[0]; j = json.loads(d[20:20 + jl])
    bo = 20 + jl; bl = struct.unpack('<I', d[bo:bo + 4])[0]; binb = d[bo + 8:bo + 8 + bl]
    for i, img in enumerate(j.get('images', [])):
        if 'bufferView' not in img: continue
        bv = j['bufferViews'][img['bufferView']]; data = binb[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
        name = f'tex/{mid}_{i}.png'; open(os.path.join(OUT, name), 'wb').write(data)
        o = bv.get('byteOffset', 0); binb = binb[:o] + bytes(bv['byteLength']) + binb[o + bv['byteLength']:]  # la imagen ya no viaja dentro del buffer
        j['images'][i] = {'uri': name, 'name': img.get('name', '')}
    json.dump({'gltf': j, 'bin': list(binb)}, open(os.path.join(OUT, mid + '.json'), 'w'), separators=(',', ':'))
    print(mid, len(binb), 'bytes,', len(j.get('images', [])), 'texturas')
