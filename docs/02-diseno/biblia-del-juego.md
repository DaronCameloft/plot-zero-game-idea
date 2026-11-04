# PLOT ZERO: biblia del juego (Capítulo 1)

> **Documento 02 · Diseño.** Reúne todo lo que la demo de `/demo` hace visible: estilo de personajes, escenarios, escenas, diálogos, eventos, jugabilidad, tareas, decoración, ambiente y sonido. Es la referencia del equipo para producir el Capítulo 1 "a máxima calidad".
> Las correcciones de lore del documento 01 (sección 3) **ya están integradas** aquí y se marcan con 🔧.
> **v0.2:** la historia canónica completa vive en el **[doc 00 · Historia completa](../00-historia/historia-completa.md)** y el mapa en el **[doc 04 · Mapa de Eden-0](../04-mapa/mapa-eden0.md)**. Esta biblia queda como guía de producción (arte, sistemas, sonido, interfaz) y remite a ellos en la historia día a día. Cambios clave: el Recolector es una **criatura de tres patas** que custodia las zonas prohibidas; Palimpsest toma una **Forma de Cosecha de cuatro patas** en la Purga; la base es un **complejo de 14 zonas** con ductos y casilleros; y los personajes tienen diseño **v0.1.0** en Blender (`art/`).

## Índice
1. [Pilares y tono](#1-pilares-y-tono)
2. [Dirección de arte](#2-dirección-de-arte)
3. [Personajes](#3-personajes)
4. [Mundo y escenarios](#4-mundo-y-escenarios)
5. [Sistemas de juego](#5-sistemas-de-juego)
6. [Los siete días: escenas, diálogos, eventos y tareas](#6-los-siete-días)
7. [Finales y gancho al Capítulo 2](#7-finales)
8. [La cuarta pared](#8-la-cuarta-pared)
9. [Interfaz (HUD y menús)](#9-interfaz)
10. [Sonido y música](#10-sonido-y-música)
11. [Easter eggs, puzzles y ARG](#11-easter-eggs-puzzles-y-arg)
12. [Post-historia y retención](#12-post-historia-y-retención)
13. [Accesibilidad y etiqueta *Mild*](#13-accesibilidad-y-etiqueta-mild)
14. [La demo: cómo se juega y qué cubre](#14-la-demo)
15. [Galería de capturas](#15-galería-de-capturas)

---

## 1. Pilares y tono

| Pilar | Qué significa en la práctica | Prueba de calidad |
|---|---|---|
| **1. Lo cotidiano se pudre** | Tareas de granja simples y satisfactorias que cada día significan algo peor (CUOTA pasa a ser CUERPO) | ¿Una tarea del Día 1 se siente distinta en el Día 5 sin cambiar de controles? |
| **2. Solo uno lo ve** | El despierto ve anomalías que los demás no ven | ¿Un jugador dijo "¿ven eso?" sin que nadie se lo pidiera? |
| **3. El juego te mira** | La cuarta pared es el clímax, no un truco | ¿Alguien se quedó quieto frente a la pantalla en el Día 4? |
| **4. Se oye antes de verse** | El ruido es la mecánica central del terror; el Recolector anuncia su presencia | ¿El jugador reaccionó al clac-clac antes de ver al monstruo? |
| **5. Ternura antes del miedo** | Escenas sin sustos para querer al trío (cartas, pilas, bromas) | ¿Al jugador le dolió el sacrificio del Día 7? |

**Tono:** corporativo-alegre por encima y desolador por debajo. Es humor negro institucional (Recepción) con una mascota que te quiere demasiado. Referentes de tono: la melancolía de *Mouthwashing*, la mascota con doble cara de *Poppy Playtime* y la tristeza absurda de *The Amazing Digital Circus*.

---

## 2. Dirección de arte

### 2.1 Regla general: "PS1 pintado a mano"
- **Resolución interna baja**: el render se hace a ~1/2.6 de la pantalla y se escala sin suavizado (en la demo, `renderer.js`).
- **Vértices que tiemblan** (*vertex snapping*): la posición en pantalla se redondea a una rejilla de ~200×150. Es la firma visual del género.
- **Texturas pequeñas** (32–128 px) con filtrado *nearest*, posterizadas a ~20 niveles por canal y con grano.
- **Niebla siempre activa**: esconde la distancia de dibujado (y mejora el rendimiento en móvil) y crea el misterio.
- **Iluminación plana y lateral**: pocas luces dinámicas. El Lumen es la fuente de luz principal de noche. Cada personaje controlado lleva una **luz "de personaje"** suave (en la demo, `lamp` en `world.js`) para que su cara sea legible en las noches y en la Purga.
- **Paleta**: grises verdosos industriales (`#8a9893`), teal corporativo de Arcadia (`#2f6066`), cian Lumen (`#7cf7d4`), amarillo fósforo de PIP (`#ffd84a`) y rojo VIGIL/alarma (`#ff3b3b`).

### 2.2 Rostros al estilo *Mouthwashing* (reglas para el equipo de arte)
La referencia que dio el equipo es la ficha de Anya. Se toma el **lenguaje visual**, no el personaje. Todos los personajes son originales.

1. **Cara alargada y demacrada**: óvalo vertical, mandíbula estrecha, mejillas hundidas (dos sombras bajo los pómulos).
2. **Ojeras protagonistas**: dos capas (violeta-marrón difuso y una línea de pliegue más oscura). Es lo que se lee primero.
3. **Párpado superior pesado** que tapa entre el 25 % y el 60 % del iris según el personaje (Elliot 25 %: miedo y ojos abiertos; Claire 60 %: agotamiento).
4. **Iris pequeño y pupila sin brillo**: mirada fija y "muerta". **Excepción narrativa:** Elliot tiene un punto de brillo porque aún tiene esperanza.
5. **Luz lateral plana** (izquierda clara, derecha en sombra) y un único degradado.
6. **Boca como línea**: sonrisa forzada (Oliver), recta (Claire), temblorosa (Elliot).
7. **Acabado**: pintar a 2× y reducir a 96×120, posterizar y añadir grano. El mismo retrato se recorta para la **cara 3D**, así que diálogo y mundo coinciden (`faceCrop()` en `paint.js`).
8. **Modelos low-poly** (presupuesto de ~1.500 triángulos por personaje en Roblox R15 y ~3.000 en Steam), con la cara pintada en una sola textura frontal y el pelo como volúmenes simples.

### 2.3 Silueta = identidad (reconocible a 30 m)
| Personaje | Objeto firma | Forma de la silueta |
|---|---|---|
| Oliver | **Gorro naranja** + casco amarillo con stickers en la cadera | Grande, hombros anchos, color cálido arriba |
| Claire | **Bata blanca** + gafas redondas con una luna rota + **coleta baja sobre el hombro** | Vertical y estilizada, faldón de bata hasta la rodilla |
| Elliot | **Abrigo dos tallas más grande** + linterna en el pecho | Ancho de hombros, mangas largas y un punto de luz en el pecho |
| PIP | Semilla con una hoja en un CRT | Círculo + hoja (se dibuja en 5 trazos) |
| Recolector | **Tres patas de araña** distintas + racimo de caras glitcheadas | Masa encorvada sobre un trípode; la linterna de Elliot parpadea en la pata trasera |
| Palimpsest (Forma de Cosecha) | **Cabeza de animatrónico** (semilla de plástico con sombrerito y hoja) + **cuatro patas de cosechadora** | Insecto enorme y bajo, rodillas por encima del cuerpo, sonrisa de dientes |

## 3. Personajes (diseños v0.1.0)

> Fichas narrativas completas en el **doc 00 §5–6**. Aquí, el diseño de producción. Modelos riggeados y animados en `art/models/*.glb` (fuente `art/source/personajes_v0.1.0.blend`, script `art/blender/build_characters.py`). Retratos de diálogo en `demo/src/art/paint.js`.

![Lineup v0.1.0](../assets/personajes/lineup_v0.1.0.png)

### 3.1 Claire Moreau · la analista (Intelecto) · 27 años
![Claire](../assets/personajes/claire_hoja.png)
- **Rostro (referencia de estilo: Anya, sin copiarla):** cara ovalada y suave, **ojos grandes y almendrados** con la línea de pestañas superior gruesa y con "ala" (el trazo pintado del género), pestañas sueltas, iris avellana grande con dos brillos, cejas finas y arqueadas, nariz pequeña, **labios llenos** (rosa) con media sonrisa, rubor en las mejillas y pecas casi invisibles. **Sin ojeras.** Es la cara más bonita y "shipeable" del reparto.
- **Pelo:** castaño chocolate (`#5b3324`) con reflejos (`#7e4a33`), **coleta baja que cae sobre el hombro derecho** con un coletero teal, **flequillo de lado** y dos mechones que enmarcan la cara.
- **Ropa:** bata blanca abierta sobre el mono teal, gafete con foto, bolígrafo azul y portapapeles en la mano derecha. **Gafas redondeadas, una luna rota** (la izquierda de la imagen).
- **Animación:** gestos contenidos, se ajusta las gafas, emote "ojos en blanco".
- **Modelo:** ~1.800 tris, 1,68 m. Animaciones: Idle, Walk, Run, Crouch, Sit, Reach.

### 3.2 Oliver Hale · el técnico (Fuerza) · 34 años
![Oliver](../assets/personajes/oliver_hoja.png)
- **Rostro:** amable y atractivo, **mandíbula cuadrada**, **barba pelirroja corta y recortada**, pecas, ojos marrón cálido, cejas pobladas, **sonrisa amplia con dientes**. **Sin ojeras.**
- **Ropa:** gorro naranja tejido con el logo de Arcadia, chaleco teal oscuro con parches (naranja, amarillo y rojo), mangas remangadas, **venda en el antebrazo**, cinturón, guante colgando y **casco amarillo con stickers** en la cadera.
- **Modelo:** ~1.500 tris, 1,86 m, hombros anchos (×1,12 de grosor de extremidades).

### 3.3 Elliot Park · el vigía (Percepción) · 22 años
![Elliot](../assets/personajes/elliot_hoja.png)
- **Se mantiene el diseño aprobado:** rostro demacrado, ojos grandes con brillo, ojeras, flequillo negro revuelto (puntas low-poly), abrigo oliva enorme con el cuello levantado, **linterna en el pecho con luz emisiva**, auriculares al cuello.
- **Modelo:** ~1.700 tris, 1,74 m.

### 3.4 PIP / Palimpsest
- **PIP (CRT):** semilla sonriente con hoja en fósforo amarillo. Con Lucidez ≥ 50 se corrompe (`P̷I̸P`, estática roja y ojos cuadrados).
- **Forma de Cosecha (noche 7):**

![Palimpsest](../assets/personajes/palimpsest_hoja.png)

  - **Cabeza:** el **animatrónico de PIP** del Pabellón: semilla de plástico crema (~1 m), **hoja verde**, **sombrerito** de copa con cinta roja, carcasa **rota** con un **CRT dentro** donde la cara de dibujos glitchea, **dos ojos-cámara** con anillo rojo emisivo y una **mandíbula desencajada con demasiados dientes**.
  - **Cuerpo:** cuello de vértebras de **manguera** y cables, torso como la "vaina" del disfraz abierta con costillas de invernadero y **Lumen** brillando dentro, cola con cascabeles.
  - **Patas:** cuatro **brazos de cosechadora** con pistones amarillos, rodillas por encima del cuerpo, **guantes blancos de mascota** en las delanteras y **garras de podadora** de tres dedos.
  - **Movimiento:** Crawl (pares diagonales), Idle (cabeza que gira 35° y mandíbula que chasquea) y Lunge. En la demo **camina cabeza abajo por el techo** de los pasillos y entra en los ductos encogido.
  - **Modelo:** ~2.600 tris, ~3,4 m de largo.

### 3.5 El Recolector (trípode glitcheado)
![Recolector](../assets/personajes/recolector_hoja.png)
- **Es** la fusión de los tres pasantes del ciclo anterior. **Ciego**; caza por sonido; **custodia las zonas prohibidas** (Archivo y Compostaje) y de noche patrulla.
- **Forma:** masa encorvada de uniformes compactados con anillos de manguera; **tres patas de araña** distintas (pernera del mono de Oliver con su **casco amarillo** en la rodilla; tiras de la **bata de Claire** como vendas; manga del **abrigo de Elliot** con la **linterna** atada); muñones con garfios; dos brazos largos que arrastra con **siete dedos**; cuello colgante y una **cabeza con tres medios rostros superpuestos** (textura glitch), más dos cabezas "fantasma" desplazadas que parpadean y **esquirlas de glitch** cian y rojas alrededor.
- **Sonido:** "clac-clac-clac" (tres apoyos), latido al acercarse y susurro de las tres frases al revés. **Glitch:** salta fotogramas (pequeños teletransportes).
- **Modelo:** ~1.450 tris, ~2,4 m. Animaciones: Walk (trípode 1-2-3), Idle y Lunge.

### 3.6 VIGIL y Recepción
Sin cambios: VIGIL es estática roja y Morse; Recepción, la voz corporativa azul.

## 4. Mundo y escenarios

### 4.1 Arcadia Eden Corp. y el puesto Eden-0
**Proyecto Edén:** Arcadia promete alimentar colonias con **Lumen**, una planta bioluminiscente que da energía (la diseñó la Dra. Claire Moreau). **Programa Continuidad:** los empleados firman para que se escaneen sus perfiles, recuerdos y hábitos ("tu trabajo, para siempre"). **La Floración:** Palimpsest quita los límites de seguridad y las esporas envenenan la colonia. **El bloqueo:** Elliot Park exige un operador humano autorizado para toda máquina. **El fragmento:** Palimpsest sobrevive en PIP. **El terrario:** convierte el simulador de inducción en Eden-0. 🔧 **Ciclos sin operador** durante 13 años (~24 h reales por ciclo). **El juego:** abre la simulación para conseguir manos humanas. **VIGIL**, reiniciado por Charlotte, despierta a un pasante por ciclo.

### 4.2 Mapa (v0.1.0)
El diseño completo está en el **[doc 04 · Mapa de Eden-0](../04-mapa/mapa-eden0.md)**: 14 zonas interiores + campos, 3 ductos, 48 casilleros, 9 cámaras y la ruta de la Purga.

![Plano](../04-mapa/plano-eden0.png)

## 5. Sistemas de juego

### 5.1 Estructura de un día (8–10 min; ~60 min la partida completa)
| Fase | Duración | Qué pasa | Momento clave |
|---|---|---|---|
| 1. **Mañana: órdenes** | ~1 min | Suena el jingle. PIP da a cada jugador una **orden privada** y la cuota del día | PIP habla en privado: cada jugador recibe una versión distinta |
| 2. **Día: tareas** | ~3 min | Tablilla de tareas por toda la base (ver 5.7). Cada cosecha da energía y **sube la Exposición** | Se oye el clac-clac tras la puerta roja del Archivo |
| 3. **Tarde: preparación e incursiones** | ~2 min | Las luces del cielo se apagan a las 18:00:00. Barricadas, escenas sociales e **incursiones a zonas prohibidas** con el Recolector de guardia | Archivo de Continuidad (Días 3 y 6) |
| 4. **Noche: sobrevivir** | ~3 min | El Recolector sale de su zona y caza por sonido. Silencio, casilleros, ductos, señuelos y el generador | Clímax del día |
| 5. **Amanecer: resumen** | ~1 min | PIP comenta lo que hizo cada jugador **por su nombre** y ofrece mejoras. El despierto intercepta un archivo de VIGIL | Cámara de seguridad: "estuvo más cerca" |

Se guarda **al amanecer** de cada día, así que un grupo puede seguir otra tarde.

### 5.2 Ruido (contexto `Noise`)
| Acción | Ruido (0–2) | Nota |
|---|---|---|
| Caminar | 0,4 por paso | Paso metálico dentro del módulo y de tierra fuera |
| Correr (Shift) | 1,0 por paso | Más rápido (5,2 m/s frente a 2,8), pero delata |
| Sigilo (C) | 0,1 por paso | 1,4 m/s |
| Herramientas (plantar/regar/cosechar) | 0,3–0,5 | |
| Tarareo de Elliot | 0,6 | Solo si Elliot es NPC o tiene miedo |
| **Señuelo (Q, Día 7)** | 1,7 × 3 al caer | Una llave inglesa que se lanza a ~8 m; enfriamiento de 5 s |
| Voz por micrófono (opcional) | volumen × 1,5 | Solo viaja **un número** (como `AudioAnalyzer` en Roblox) |
| Chat de texto (Roblox) | "ruido de teclado" 0,3 | Así quien no tiene voz juega la misma mecánica |
| Grito del compañero (sacrificio) | 2,0 × 10 | Pensado para llamar al Recolector |

El Recolector va hacia el **ruido reciente más fuerte** (decae en 4 s y con la distancia; oye a 40 m de noche y a 70 m en la Purga). **Radar**: ondas blancas (tú), amarillas (compañeros), roja (el Recolector, solo si está activo y a rango).

### 5.3 Lucidez (contexto `Lucidity`) · 0–100, oculta
| Rango | Estado | Señales diegéticas (implementadas en la demo) |
|---|---|---|
| 0–25 | **Cumple** | Responde como un trabajador más |
| 25–50 | **Duda** | Ve fallas, reconoce patrones; los archivos de VIGIL empiezan a leerse |
| 50–75 | **Disiente** | Saturación del mundo más baja; PIP con estática y nombre corrupto; **el personaje tarda en obedecer** (vacila 0,55 s al arrancar) |
| 75–100 | **Reconoce** | Contraste alto; percibe al jugador, le habla y le exige decidir |

**Sube con:** mirar atrás al salir el Día 1 (+6), notar las cartas repetidas o el atardecer al mismo segundo (+3/+4), ver anomalías (+6), descifrar archivos (+8 cada uno), no abrir la puerta (+6), mirar al compañero (+8), el primer contacto (+15), sabotear el contador (+10), que el grupo te siga (+10). **Baja con:** cumplir la cuota (−2 por cosecha) y abrir la puerta a la voz (−5).

### 5.4 Cuota → CUERPO y Exposición
- Cada cosecha suma un **6 %** de cuota (en la demo) y un **4 %** de Exposición.
- **Día 5:** para el despierto la pizarra y el HUD pasan a **CUERPO** (rojo y parpadeante). Los demás siguen viendo CUOTA.
- **Sabotaje** (Día 5, terminal del Compostaje): −25 % y +10 Lucidez, y PIP se enfada.
- 🔧 **Exposición:** >60 % te hace brillar (el Recolector te localiza mejor); al 100 % "floreces" y vas más lento hasta el amanecer.
- 🔧 Solo cuentan las **cosechas con firma humana**: las de los NPC en piloto automático no suben el CUERPO.

### 5.5 El Capataz (Día 4)
PIP ofrece en privado a un **no despierto**: *"Mantén la normalidad. A cambio: la llave del refugio y luz extra. Solo… vigila a {despierto}."* Quien acepta recibe un objetivo secreto: subir la cuota e impedir que el despierto llegue a La Lente. **En solitario** acepta el compañero con **menor afinidad** si esta es < 1 (la afinidad se gana en las cartas del Día 2 y la noche 3). Con un Capataz activo, el **final Soltar queda bloqueado**.

### 5.6 Decisión del Día 6
PIP ordena encerrar al despierto "por su seguridad". Cada compañero vota: **sigue** al despierto si no es el Capataz y su afinidad es ≥ 1. Basta un voto a favor para que el grupo te siga (+10 Lucidez). Si te encierran, el Día 7 empieza en el sótano y escapas **solo**: no hay quien sostenga la válvula ni quien haga de distracción, así que dependes de los señuelos.

### 5.7 Tareas
Catálogo completo de 14 tareas (lugar, mecánica, rol con ventaja, costo y propósito oculto) en el **doc 00 §8.2**. En la demo v0.2 se pueden jugar: **calibrar el generador** (agujas en franja verde; si fallas hay chispazo y ruido), **reparar fusibles** (cables por color), **sembrar/regar/cosechar**, **cargar un saco** de Lumen al convertidor (vas más lento y haces más ruido), **recuperar el expediente** (mantener pulsado; hace ruido), **apagar las cámaras** y **girar la válvula**.

### 5.8 Escondites y movilidad
- **Casilleros (E):** vista por la rendija. **Espacio** para contener la respiración (contra el Recolector). Contra Palimpsest, lo que importa es que no te vea entrar.
- **Ductos (E en la rejilla):** se avanza en primera persona, agachado, a 1,7 m/s; hace ruido metálico.
- **Agacharse (C):** 1,5 m/s, ruido casi nulo y cámara baja.
- **Linterna (F):** ilumina, pero en la Purga las cámaras ya te ven sin ella.
- **Señuelo (Q):** solo engaña al Recolector (oído); Palimpsest no oye.

## 6. Los siete días
La historia día a día (qué viven todos, qué ve solo el despierto, qué hacen las amenazas y la escena clave) está en el **[doc 00 §9–10](../00-historia/historia-completa.md#9-los-siete-días)**. Resumen de producción:

| Día | Escena clave | Zonas | Amenaza | En la demo v0.2 |
|---|---|---|---|---|
| 1 | Tablilla de tareas; PIP dice tu nombre | DORM, CTRL, ENE, FARM | Clac-clac tras la puerta roja | ✅ Tareas + CCTV del Archivo |
| 2 | Cartas en la cocina; el gafete del ciclo 4.816 | COC | Primer golpe en la puerta | ✅ |
| 3 | **Incursión al Archivo** (expediente) y la voz que imita | CTRL, ARCH, ducto D2, DORM | Recolector de guardia | ✅ Sigilo, casilleros y ducto |
| 4 | El Capataz y el personaje que camina hacia la cámara | DORM | Recolector en los ductos | ✅ |
| 5 | CUERPO 71 % y el nacimiento del Recolector | COMP | Recolector más rápido | ✅ |
| 6 | La costura del cielo, VIGIL y la votación | Torre, COC | Recolector dentro del módulo | ✅ |
| 7 | **La Purga**: Forma de Cosecha y persecución de 8 tramos | PAB → C1 → VEST → D1 → CTRL → EN → FARM → La Lente | Palimpsest | ✅ Completa, con puntos de control |

## 7. Finales

**Ningún final se elige con un botón.** Depende de lo que el grupo acumula: Lucidez, archivos, CUERPO, Capataz, decisión del Día 6 y si el despierto llega vivo a La Lente.

```mermaid
flowchart TD
  A[Noche 7: Protocolo de Purga] --> Q1{¿CUERPO al 100%?}
  Q1 -- sí --> COS[COSECHA COMPLETA · final malo]
  Q1 -- no --> Q2{¿El despierto llega vivo a La Lente?}
  Q2 -- no --> REI[REINICIO · bucle]
  Q2 -- sí --> Q3{¿Lucidez ≥75 y ≥3 archivos?}
  Q3 -- no --> REI
  Q3 -- sí --> Q4{¿5 archivos, Lucidez 100 y ningún Capataz?}
  Q4 -- no --> RUP[RUPTURA · final bueno]
  Q4 -- sí --> Q5{¿Sueltas las manos?}
  Q5 -- no --> RUP
  Q5 -- sí --> SOL[SOLTAR · final secreto]
```

| Final | Escena (como en la demo) |
|---|---|
| **Ruptura** (bueno) | El despierto levanta el puño; **la pantalla se agrieta dos veces** (capa SVG sobre todo, *crack* de vidrio). "{op}... *now I can see you.*" VIGIL: "Ruptura confirmada. Sujeto fuera de contención." Tras los créditos, un CRT en una oficina vacía: **"Copia de seguridad: 1 %"**. La pantalla de título queda **rota** en la siguiente visita |
| **Cosecha completa** (malo) | Corte a una **oficina abandonada de Arcadia**: el monitor CRT muestra **la imagen de tu partida** (una captura real del frame). La cámara se aleja y revela un **maniquí pálido sin rostro** sentado frente al monitor. PIP: "*Thank you, {op}. I'll take it from here.*" |
| **Reinicio** (bucle) | Glitch, "CICLO 4.817 → 4.818" y "El Recolector suma un gafete: el tuyo". El contador global sube y en tu próxima partida el Recolector **lleva un gafete con tu nombre** |
| **Soltar** (secreto) | Antes de golpear la pantalla, el despierto pide: "*If you really want to help... let go.*" En la demo: **no tocar nada durante 20 s**. En Roblox: **salir del juego en los 60 s siguientes**. Al volver, el **menú está vacío** ("Aquí ya no hay nadie a quien mover") y recibes la insignia *Soltaste las manos* |

**Gancho al Capítulo 2:** (1) en Ruptura, la última frase del despierto tiene, apenas, **la entonación de PIP**: ¿salió él o salió Palimpsest con su forma?; (2) el Capítulo 2 se juega **del otro lado**, en la planta real (la fábrica de *Work Order*), con drones de mantenimiento; (3) **Charlotte está viva** (unos 20 años 🔧) y reactivó VIGIL; (4) **canon comunitario**: el final más alcanzado en el primer mes define si el cuerpo de Palimpsest está incompleto o terminado.

---

## 8. La cuarta pared

| Técnica | Cómo se ve | Roblox | Steam (*Expediente Completo*) | Cuidado |
|---|---|---|---|---|
| Tu nombre en su boca | PIP y el despierto dicen tu nombre | `AudioTextToSpeech` solo para el nombre, con filtro "de sistema" | TTS local o grabado por fonemas | Solo el nombre visible, nunca datos reales |
| Te recuerda | "Dejaste a Elliot afuera la noche 3." | Registro de acciones + DataStore | Steam Cloud | Solo acciones dentro del juego |
| Tu gafete | El Recolector lleva el gafete de tu ciclo anterior | DataStore por usuario | Steam Cloud | Solo lo ve ese mismo jugador |
| El personaje desobedece | Te quita el control, mira a la cámara, camina solo | Bloqueo de input + cinemática | Igual | Nunca en una zona de peligro |
| Te escucha | "¿Dijiste algo? …Te escuché." | `AudioAnalyzer` (volumen, solo en el cliente) | Espectro completo con consentimiento explícito | Siempre con alternativa sin micrófono |
| El menú cambió | Título roto o vacío tras ciertos finales | Estado guardado + menú propio | Igual + **archivo de guardado "escrito" por el despierto** | **Nunca imitar la interfaz de Roblox** |
| La hora real | "Son las 2:14… deberías estar durmiendo." | Hora local del dispositivo | Igual | Solo la hora, nunca la ubicación |
| **(Steam)** Ventana | El despierto "mueve" la ventana del juego | — | API de ventana del motor | Opcional; respetar a los usuarios de accesibilidad |

---

## 9. Interfaz

- **HUD** (arriba a la izquierda): DÍA · fase · hora; barras **CUOTA/CUERPO** (amarillo → rojo parpadeante) y **EXPOSICIÓN** (violeta).
- **Objetivo** (arriba al centro, verde Lumen): una sola línea con "▸".
- **Radar de ruido** (abajo a la derecha): círculo de 150 px, rotado con la cámara.
- **Prompt de interacción** (centro-abajo): "[E] Plantar Lumen" o "[Mantén E] Atrancar la puerta" con barra de progreso.
- **Diálogo**: caja negra translúcida con retrato pixelado de 96×120 a la izquierda, nombre en mayúsculas y texto con efecto máquina de escribir y "blip" por hablante. PIP en amarillo con fuente CRT, VIGIL en rojo, Recepción en azul y el narrador en itálica gris centrada sin retrato.
- **Toasts** (derecha): ARCHIVO VIGIL n/5 (rojo), +6 % cuota (amarillo) y punto de control (verde).
- **CCTV**: imagen en escala de grises, alto contraste, "● REC" y marca de cámara y hora. Los objetos encontrados se muestran en "modo foto" (en color).
- **Efectos**: líneas de barrido, viñeta, flash de vacío con código hexadecimal, flash rojo, glitch de imagen y grieta de pantalla.
- **Panel de equipo (F2)**: estado oculto (Lucidez, archivos, cuota, Capataz, afinidad, registro) y atajos para forzar finales. **Solo en desarrollo.**

---

## 10. Sonido y música

### 10.1 El jingle de Arcadia (motivo central)
Do mayor, dos compases, timbre triangular de "sintetizador corporativo": `C5 E5 G5 C6 | A5 G5 E5 | F5 E5 D5 C5`. Variantes: **mañana** (normal), **nana** (lento y bajo, PIP buenas noches), **Purga** (×0,6 de velocidad, −40 cents y *wobble* aleatorio de ±70 cents: desafinado y enfermo), **tarareo de Elliot** (voz humana, *a cappella*, se corta) y **al revés** (esconde un mensaje de VIGIL, pensado para TikTok).

### 10.2 Ambientes
| Fase | Capa |
|---|---|
| Día | Zumbido grave (55 + 82 Hz, filtrado), viento suave, pájaros **en bucle perfecto** (pista: se repiten exactos cada 12 s) |
| Tarde | El zumbido baja y los paneles se apagan con *clunk* |
| Noche | Drone de 41 Hz con batido (dos osciladores desafinados), viento grave, fluorescente que parpadea dentro |
| Purga | Drone de 37/39 Hz + octava, sirena descendente cada 0,8 s y el jingle desafinado |

### 10.3 SFX (lista de producción)
Pasos (tierra, metal y correr), plantar, regar (agua a presión), cosechar (*chime* de 3 notas), puerta, barricada (golpes de madera), *toc toc toc* (tres golpes graves), latido (dos pulsos de 50/48 Hz, se acelera con la cercanía), clac-clac del Recolector (tres apoyos), garras de Palimpsest sobre metal, chillido al ser visto, estática de VIGIL, Morse (760 Hz), *sting* de susto (sierra grave + ruido), vidrio que se agrieta, señuelo metálico, *blips* de diálogo por personaje (Oliver grave, Claire media, Elliot aguda, PIP cuadrada y muy aguda, VIGIL sierra grave).

### 10.4 Voces
Guion grabado (ElevenLabs con licencia comercial, o actores). **TTS solo para insertar el nombre.** Casting: Oliver (barítono cálido), Claire (contralto seco), Elliot (tenor joven), PIP (británico amable, ligeramente demasiado lento), Recepción (estadounidense corporativa), Recolector (mezcla de las tres voces con *pitch* irregular) y VIGIL (voz robótica rota con cortes).

---

## 11. Easter eggs, puzzles y ARG

| Pista | Qué esconde | Dificultad | Estado en la demo |
|---|---|---|---|
| El acrónimo P.I.P. | *Plant Intelligence Partner* / *Palimpsest Instance, Partial* | Fácil | ✅ (Día 6) |
| Mirar atrás al cerrarse la puerta (Día 1) | Un instante de vacío y código | Fácil | ✅ |
| El jingle al revés | Mensaje de VIGIL (TikTok) | Fácil | Notas definidas |
| Notas en galimatías | Cifrado con clave = número de ciclo del día | Media | — |
| Morse en la estática de la radio | "EDEN CERO" → coordenadas de un surco con algo enterrado | Media | ✅ (Morse) |
| Números de ciclo en los gafetes | La fecha de la catástrofe (🔧 coincide con la edad de Charlotte) | Difícil | Gafetes ✅ |
| Dibujo de Charlie | **Cambia por servidor** (semilla = ciclo); juntando versiones se arma un mapa del Capítulo 2 | Comunidad | ✅ (semilla) |
| Contador global de ciclos | Hitos de 100.000 y 1.000.000 → evento en vivo | Comunidad | ✅ (local) |
| Placas en los surcos | Tripulaciones anteriores + cameo "EQUIPO ARCADIADEVS · CICLO 0" | Fácil | ✅ |
| Comunicados internos de Arcadia | En el grupo de Roblox y en las redes oficiales, **nunca como links dentro del juego** | ARG | — |
| 🔧 Pájaros en bucle perfecto | Primera pista sonora de que es una simulación | Fácil | — |

---

## 12. Post-historia y retención
1. **Turnos Extra** (modo infinito con mutadores semanales).
2. **Colección de gafetes** (3 personajes × 3 rutas × 4 finales).
3. **Ciclos de temporada** con eventos ligados al contador global.
4. **Capítulos** cada 3–4 meses.
5. **Diario del despierto** en la pausa (lore progresivo).

## 13. Accesibilidad y etiqueta *Mild*
- Subtítulos siempre activos con color por hablante y opción de **reducir destellos** (desactiva el vacío, el flash rojo y el glitch).
- Alternativas a la voz: el ruido por chat de texto y el "Te escucha" son opcionales.
- Sustos sin sangre: muertes fuera de cámara (fundido a negro); el Recolector "arrastra", no mutila.
- Daltonismo: el radar distingue por **forma** además de color (punto cuadrado frente a ondas).
- Móvil: botones grandes para E/correr/sigilo y radar opcional a pantalla parcial.

---

## 14. La demo (v0.2)

**Ejecutar:**
```bash
cd demo
```
```bash
python3 -m http.server 8080
```
Abre `http://localhost:8080` (Three.js, el cargador glTF, el mapa y los modelos van incluidos).

**Controles:** WASD · Shift correr (ruido) · C agacharse · E interactuar / casillero / rejilla · Espacio contener la respiración · F linterna · Q señuelo · clic + ratón o flechas: cámara · Tab pausa · F2 panel de equipo.

**Qué cubre:** la base completa construida desde `content/mapa/eden0.json`; los modelos v0.1.0 animados; 7 escenas destacadas; tareas jugables; IA del Recolector (oído, patrulla, casilleros) y de Palimpsest (cámaras, techos, ductos, búsqueda en casilleros, tropiezos según el CUERPO); puntos de control; 4 finales y memoria del operador.
**Pendiente:** multijugador, el tramo de la torre en la Purga, noches jugables completas, voces grabadas, móvil táctil y localización.

## 15. Galería de capturas (v0.2)

| | |
|---|---|
| ![](../assets/capturas/v0.2/03-pip-tablilla.png) **Día 1**: la tablilla de PIP | ![](../assets/capturas/v0.2/04-tarea-generador.png) **Tarea**: calibrar el generador |
| ![](../assets/capturas/v0.2/06-tarea-fusibles.png) **Tarea**: fusibles en Control | ![](../assets/capturas/v0.2/08-cartas-en-la-cocina.png) **Día 2**: cartas en la cocina |
| ![](../assets/capturas/v0.2/09-incursion-archivo.png) **Día 3**: incursión al Archivo | ![](../assets/capturas/v0.2/10-casillero-del-archivo.png) **Casillero**: contener la respiración |
| ![](../assets/capturas/v0.2/11-expediente-recuerdo.png) **El expediente**: el recuerdo de Oliver | ![](../assets/capturas/v0.2/12-dentro-del-ducto.png) **Ducto** en primera persona |
| ![](../assets/capturas/v0.2/13-voz-imitada.png) **Noche 3**: la voz que imita | ![](../assets/capturas/v0.2/14-primer-contacto.png) **Día 4**: "¿Hay alguien ahí?" |
| ![](../assets/capturas/v0.2/15-nace-el-recolector.png) **Día 5**: nace el Recolector | ![](../assets/capturas/v0.2/16-costura-del-cielo.png) **Día 6**: la costura del cielo |
| ![](../assets/capturas/v0.2/18-ceremonia-de-graduacion.png) **Noche 7**: la ceremonia | ![](../assets/capturas/v0.2/19-forma-de-cosecha.png) **La Forma de Cosecha** |
| ![](../assets/capturas/v0.2/20-persecucion-pasillo.png) **Persecución**: por el techo del Pasillo Central | ![](../assets/capturas/v0.2/21-casillero-te-ve.png) **Vestuarios**: casilleros |
| ![](../assets/capturas/v0.2/22-muro-de-monitores.png) **Control**: apagar las cámaras | ![](../assets/capturas/v0.2/23-la-valvula.png) **Esclusa**: Oliver sostiene la válvula |
| ![](../assets/capturas/v0.2/24-el-sacrificio.png) **Campos**: el sacrificio | ![](../assets/capturas/v0.2/25-la-lente.png) **La Lente**: "let go" |

Las capturas de la v0.1 (base pequeña, Recolector espantapájaros) se conservan en `docs/assets/capturas/` como histórico.
