# Demo vertical · PLOT ZERO (Capítulo 1)

Prototipo web para que el equipo **vea y juegue** la idea: los 7 días con su escena clave, los 4 finales y los sistemas de ruido, Lucidez, CUOTA/CUERPO, Capataz y cuarta pared. Usa estética PS1 y retratos al estilo *Mouthwashing*.

## Ejecutar
Los módulos ES necesitan un servidor local. Three.js va incluido en `vendor/`, así que no hace falta internet:
```bash
python3 -m http.server 8080
```
Abre `http://localhost:8080`. La primera interacción activa el audio (WebAudio procedural).

## Controles
| Tecla | Acción |
|---|---|
| WASD | Mover |
| Shift / C | Correr (ruido) / sigilo |
| E · Espacio · Enter | Interactuar y avanzar diálogo |
| 1–3 | Elegir opción |
| Clic + ratón, o flechas | Cámara |
| Q | Señuelo (Día 7) |
| Tab | Pausa (reiniciar escena, escenas, título) |
| F2 | **Panel de equipo**: estado oculto y atajos para forzar finales |

## Estructura (hexagonal en pequeño)
```
src/
├── main.js            composition root: cablea adaptadores, bucle, pantallas
├── game/state.js      DOMINIO PURO (Lucidez, archivos, cuota, finales, Capataz, votación)
├── game/scenes.js     aplicación: el guion de los 7 días como corrutinas
├── game/actors.js     jugador, compañeros en piloto automático, IA del Recolector
├── game/noise.js      contexto Ruido
├── game/memory.js     adaptador de memoria del operador (localStorage)
├── engine/            render PS1, input, audio procedural, corrutinas
├── art/               pintura procedural de retratos y texturas; personajes 3D
├── world/world.js     mapa de Eden-0, fases de luz y props
└── ui/ui.js           HUD, diálogos, radar, CCTV, efectos, panel de equipo
```
Los personajes, textos y logos son originales y se generan por código (no hay assets externos salvo Three.js, con licencia MIT en `vendor/THREE-LICENSE`).
