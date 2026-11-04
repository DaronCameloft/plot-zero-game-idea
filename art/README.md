# Arte · v0.1.0

| Carpeta | Contenido |
|---|---|
| `blender/pz_lib.py` | Utilidades de modelado procedural (bmesh): piezas con material, UV y hueso; aros; rig; animaciones como pistas NLA |
| `blender/build_characters.py` | Construye, riggea, anima y exporta a **Oliver, Claire, Elliot, el Recolector y Palimpsest (Forma de Cosecha)** |
| `blender/render_previews.py` | Renders de referencia (Cycles CPU): lineup, rostros, frente, 3/4 y tomas de héroe |
| `blender/build_base.py` | Blockout de Eden-0 desde `content/mapa/eden0.json` + renders isométricos |
| `source/*.blend` | Archivos editables (`personajes_v0.1.0.blend`, `eden0_blockout_v0.1.0.blend`) |
| `models/*.glb` | Modelos riggeados (malla única, pesos rígidos por pieza) con animaciones: humanos `Idle/Walk/Run/Crouch/Sit/Reach`; Recolector `Idle/Walk/Lunge`; Palimpsest `Idle/Crawl/Lunge` |
| `textures/` | Caras pintadas (exportadas desde `demo/src/art/paint.js`) y telas, pelo y piezas de monstruo (`tools/gen_textures.py`) |
| `renders/` | Retratos 2D y renders 3D de referencia |

## Regenerar
Con Blender 5.x (`blender -b -P <script>`) o con el módulo `bpy` de PyPI:
```bash
python3 tools/gen_textures.py
```
```bash
python art/blender/build_characters.py
```
```bash
python art/blender/render_previews.py
```
```bash
bash tools/sync_demo.sh
```

## Notas para el equipo de arte
- Los pesos son **rígidos por pieza** (estilo PS1). Para la v0.2 conviene repintar los pesos de hombros, codos y cuello.
- La cara se proyecta en planar frontal sobre las caras de la cabeza que miran a −Y: para repintarla, edita `textures/face_<id>.png` (168×240 px de proporción).
- La referencia de Anya (*Mouthwashing*) se usó **solo como guía de estilo**: ningún asset del juego original está en este repositorio.
