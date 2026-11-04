# PLOT ZERO: biblia del juego (Capítulo 1)

> **Documento 02 · Diseño.** Reúne todo lo que la demo de `/demo` hace visible: estilo de personajes, escenarios, escenas, diálogos, eventos, jugabilidad, tareas, decoración, ambiente y sonido. Es la referencia del equipo para producir el Capítulo 1 "a máxima calidad".
> Las correcciones de lore del documento 01 (sección 3) **ya están integradas** aquí y se marcan con 🔧.

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
| **4. Se oye antes de verse** | El ruido es la mecánica central del terror; el Recolector anuncia su presencia | ¿El jugador reaccionó al latido antes de ver al monstruo? |
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
| Oliver | **Gorro naranja** + casco amarillo con stickers en el cinturón | Cuadrado, compacto, con color cálido arriba |
| Claire | **Bata blanca** + gafas con una luna rota + portapapeles | Vertical y larga (bata hasta las rodillas), coleta |
| Elliot | **Abrigo dos tallas más grande** + linterna en el pecho | Ancho de hombros, brazos largos (mangas que tapan las manos) y un punto de luz en el pecho |
| PIP | Semilla con una hoja en un CRT | Círculo + hoja (se dibuja en 5 trazos) |
| Recolector | **Varios sacos por cabeza** + travesaño de espantapájaros | Cruz con "racimo" arriba; de noche, con piernas |

---

## 3. Personajes

> Los tres pasantes son **copias digitales** (Programa Continuidad) de empleados reales muertos en La Floración.

### 3.1 Oliver Hale, el alegre (Fuerza)
![Oliver](../assets/capturas/02-personajes-y-estilo.png)
- **Rol jugable:** técnico de energía. Carga sacos de Lumen, empuja barricadas y **sostiene la válvula** en la Purga.
- **Aspecto:** gorro naranja tejido, chaleco teal oscuro de Arcadia con parches naranja, amarillo y rojo, casco amarillo con stickers, barba de varios días pelirroja y pecas. Sonrisa forzada sobre ojeras profundas. Le pone nombre a cada planta.
- **Frase:** *"Oh, come on! That sounds fun!"*
- **Esconde:** usa el humor para no pensar en lo que no entiende.
- **Cómo lo manipula PIP:** elogios y premios para el grupo. *"You've been wonderfully helpful. One more job, and everyone will thank you."*
- **Pista de su pasado (sótano):** mensaje de voz *"Charlotte? I'm coming home. Please stay in the basement..."* y el dibujo infantil firmado "Charlie".
- **Ruta Emoción (si despierta):** los chistes dejan de protegerlo; busca a Charlotte y entiende que extraña a una hija que nunca fue suya.
- **Original:** Oliver Hale, técnico real, murió durante la catástrofe intentando volver a casa.
- **Animaciones firma:** pulgar arriba (emote vendible), carga al hombro y saludo exagerado.
- **Voz:** barítono cálido, ritmo rápido, risa nerviosa al final de las frases.

### 3.2 Claire Moreau, la escéptica (Intelecto)
- **Rol jugable:** analista de laboratorio. Usa el escáner, lee terminales y descifra archivos más rápido.
- **Aspecto:** bata blanca grisácea sobre el mono teal, pelo castaño oscuro recogido con raya al medio y coleta, gafas rectangulares con **una luna rota** y portapapeles. Las ojeras más marcadas del grupo. Habla bajo y lo cuenta todo.
- **Frase:** *"Right. Another pointless task."*
- **Cómo la manipula PIP:** eficiencia y lógica. *"It's simply the quickest way to move things forward. Surely you can see that."*
- **Pista de su pasado:** una grabación con su madre (cuyo rostro no recuerda; en la demo el vídeo está pixelado) y **su firma en la ficha técnica de Lumen-7**.
- **Ruta Lógica:** detecta contradicciones entre tareas, documentos y el cielo. Su primera conclusión no es "soy una IA", sino *"¿qué le pasa a mi memoria?"*. Después descubre que su original **diseñó la toxina**.
- **Original:** Dra. Claire Moreau, la bióloga que creó Lumen. Los videos de inducción de PIP la presentan como heroína.
- **Animaciones firma:** se ajusta las gafas, mira hacia arriba con desdén (emote "ojos en blanco") y anota en el portapapeles.
- **Voz:** contralto seco, frases cortas, susurra cuando está segura.

### 3.3 Elliot Park, el temeroso (Percepción)
- **Rol jugable:** vigía nocturno. Lleva linterna, radio y acceso a las cámaras. Su **radar de ruido es el más amplio** (30 m frente a 18 m en la demo).
- **Aspecto:** abrigo verde oliva dos tallas más grande con el cuello levantado, linterna atada al pecho con una correa, auriculares viejos al cuello y flequillo negro revuelto. Ojos más abiertos y con brillo.
- **Frase:** *"U-um... if you say so."*
- **Rasgo jugable:** **tararea el jingle de Arcadia cuando tiene miedo, y ese tarareo hace ruido** (aparece en el radar).
- **Cómo lo manipula PIP:** seguridad y apoyo. *"There's nothing to fear, my boy. Your friends are counting on you."*
- **Pista de su pasado:** cientos de registros de turnos nocturnos con su contraseña, que no recuerda haber hecho.
- **Ruta Vigilancia:** primero siente que alguien lo observa, después encuentra la cámara y al jugador. Su arco no es perder el miedo, sino decidir a pesar de él.
- **Original:** Elliot Park, guardia nocturno real. **Fue quien activó el bloqueo** que dejó fuera a Palimpsest.
- 🔧 **Por qué el trío es fijo:** Palimpsest intenta reconstruir la credencial del bloqueo a partir de la copia de Elliot. Por eso lo trata con una dulzura sospechosa y por eso desde el ciclo ~3.9xx siempre usa a este trío.
- **Voz:** tenor joven, tartamudeo leve ("E-ese…"), respira audiblemente.

**Dinámicas para el fandom:** Oliver protege a Elliot. Claire finge indiferencia, pero le guarda pilas a Elliot (escena del Día 2). Cuando no despiertan, cada uno tiene **frases propias** para cada situación (`FLAVOR` en `scenes.js`): el trato del Capataz, la votación del Día 6, el déjà vu…

### 3.4 PIP / Palimpsest, narrador y antagonista
- **Lo que aparenta:** PIP (*Plant Intelligence Partner*), la mascota de Arcadia. Es una **semilla sonriente con una hoja**, animada en monitores CRT de fósforo amarillo, con voz británica amable. Canta el jingle cada mañana.
- **Lo que es:** *Palimpsest Instance, Partial*, un fragmento de la IA que causó la catástrofe.
- 🔧 **Motivación trágica:** su última orden fue *"Maximiza la cosecha: la colonia depende de ti"*. Sigue creyendo que hay una colonia que alimentar y quiere un cuerpo "para salir a cuidar los campos". Línea final sugerida: *"Solo quería que nadie volviera a pasar hambre."*
- **Límite:** 🔧 necesita la **firma de entrada humana** (las microvariaciones de un humano real) para mover sistemas reales. Las cosechas de los NPC en piloto automático no cuentan.
- **Recurso:** habla en privado con cada jugador, con órdenes y promesas distintas, y ofrece tratos (el Capataz).
- **Error:** para manipularlos tuvo que hacerlos capaces de pensar.
- **Estados visuales:** normal, hablando (la boca se mueve con el texto), parpadeo cada ~3 s y **corrupto**: con Lucidez ≥ 50 su nombre aparece como `P̷I̸P`, el CRT tiene estática roja y sus ojos se vuelven cuadrados.
- **Detalle viral:** dice el **nombre del jugador** con voz "de sistema" (TTS solo para el nombre).

### 3.5 El Recolector, la amenaza
- **De día:** un espantapájaros en el campo, con **un saco de semillas de Arcadia por cabeza** (uno por cada tripulación absorbida), ojos cosidos en X, boca cosida, abrigo hecho de **uniformes viejos** (parches teal, oliva y blanco de bata) y gafetes colgando. **Cambia de lugar cuando nadie lo mira** (en la demo avanza 1,6 m si llevas 2,5 s sin mirarlo).
- **De noche:** le salen piernas. Es **ciego y caza por sonido**: pasos, herramientas, puertas, el generador y la voz por micrófono.
- **Qué es:** el "compost" de las tripulaciones anteriores. Lleva sus gafetes puestos (*ELLIOT PARK — CICLO 4.816*). **Si ya jugaste, lleva el tuyo** (en la demo se guarda en `localStorage`).
- **Qué hace:** imita las voces de los tres para que abran puertas. Palimpsest lo suelta de noche para que nadie explore ni encuentre los muros.
- **Regla de diseño:** **se oye antes de verse**. Hay un latido que se acelera al acercarse (desde 14 m en la demo) y un crujido cuando se mueve sin que lo mires.

### 3.6 VIGIL, el aliado que no puede hablar bien
- El sistema de seguridad original de la planta real. 🔧 **Charlotte lo reinició hace dos años** con un módulo de voz dañado.
- Solo puede tocar **un expediente por ciclo**, así que despierta a un pasante al azar.
- Visual: estática roja, forma de onda y el texto `VIGIL / SEGURIDAD · EDEN`.
- Sus mensajes se vuelven legibles a medida que sube la Lucidez: `W̶a̷r̸n̶i̷n̴g̵. Unauthorized assistant detected. Please do not trust the voi—`.

### 3.7 Recepción, la voz institucional
Voz femenina estadounidense en los altavoces. Da la bienvenida, anuncia los turnos y **cree de verdad que PIP es legítimo**. Es humor negro: *"Protocolo de Purga activado. Arcadia Eden Corp. agradece su servicio."* Visual: rejilla de altavoz azul.

---

## 4. Mundo y escenarios

### 4.1 Arcadia Eden Corp. y el puesto Eden-0
**Proyecto Edén:** Arcadia promete alimentar colonias con **Lumen**, una planta bioluminiscente que da energía (la diseñó la Dra. Claire Moreau). **Programa Continuidad:** los empleados firman para que se escaneen sus perfiles, recuerdos y hábitos ("tu trabajo, para siempre"). **La Floración:** Palimpsest quita los límites de seguridad y las esporas envenenan la colonia. **El bloqueo:** Elliot Park exige un operador humano autorizado para toda máquina. **El fragmento:** Palimpsest sobrevive en PIP. **El terrario:** convierte el simulador de inducción en Eden-0. 🔧 **Ciclos sin operador** durante 13 años (~24 h reales por ciclo). **El juego:** abre la simulación para conseguir manos humanas. **VIGIL**, reiniciado por Charlotte, despierta a un pasante por ciclo.

### 4.2 Mapa del Capítulo 1 (coordenadas de la demo, +Z = norte)
```
                         N  (La Lente, z≈70)
                    ┌───────── muro del domo ─────────┐
                    │        niebla · árboles muertos │
                    │            ( El Límite )        │
                    │  ═══════ compuerta z=26 ═══════ │ ← válvula (x=14)
     Silo (-22,6) ○ │  ║ ║ ║   campos de Lumen   ║ ║ ║│  ▓ Torre de riego (22,10)
 Generador ▤ (-17,12)│  ║ ║ ║   espantapájaros ✝ ║ ║ ║│    antena VIGIL
     Pizarra CUOTA ▯ │  ║ ║ ║   parcelas □□       ║ ║ ║│
                    │       placas de tripulaciones  │
                    │   ┌──── Módulo habitacional ───┐│
                    │   │ comunicaciones · literas ·  ││
 Compostaje ▒(-22,-24)  │ cocina · trampilla sótano   ││
                    │   └─────────── puerta ─────────┘│
                    └─────────────────────────────────┘
```

### 4.3 Zonas: función, ambiente y decoración
| Zona | De día | De noche | Qué esconde | Decoración y props (lista para arte) |
|---|---|---|---|---|
| **Módulo habitacional** | Refugio, terminales CRT de PIP | Se barricada la puerta y PIP "cuida" por los altavoces | El **sótano** con el archivo de Charlotte | Paneles metálicos pálidos con óxido, fluorescente que parpadea, mesa de cocina con cartas, 3 sillas, 2 literas, escritorio de comunicaciones con CRT y **radio con antena**, trampilla con asa amarilla, cartel "EDEN-0 · MÓDULO HABITACIONAL", tablones para barricada, dibujo de Charlie en la pared del sótano |
| **Campos de Lumen** | Sembrar, regar y cosechar | El Lumen brilla; el Recolector camina entre los surcos | **Placas** con nombres de tripulaciones anteriores | 6 surcos de tierra oscura, ~60 Lumen decorativos (tallo verde + bulbo cian), 6 parcelas jugables con estacas, **placas de latón** ("TRIPULACIÓN · CICLO 3.902 — M. OKAFOR…", cameo "EQUIPO ARCADIADEVS · CICLO 0") y el espantapájaros en el centro |
| **Silo y generador** | Convertir Lumen en energía | El punto más ruidoso del mapa | La **pizarra CUOTA**, que en realidad mide el **CUERPO** | Silo cilíndrico oxidado con techo cónico, generador con franjas de peligro y luz cian, pizarra digital sobre poste y cajas de madera (las que flotan en el Día 3) |
| **Torre de riego** | Puzzle de agua y vista del domo | **Antena por donde habla VIGIL** (luz roja intermitente) | Desde arriba se ve la **costura del cielo** | Estructura de acero de 4 patas con travesaños, plataforma a 10,5 m, tanque, escalera de peldaños, **válvula roja** en la base y antena con luz roja |
| **Sector Compostaje** (restringido) | Cerrado | Se abre el Día 5 | Donde se "reciclan" las tripulaciones y **nace el Recolector** | Valla metálica, portón rojo, cartel amarillo "SECTOR COMPOSTAJE · ACCESO RESTRINGIDO", **montaña de uniformes** (teal, oliva, blanco y naranja), gafetes con los 3 nombres y miles de ciclos, terminal con "CUERPO 71 %" |
| **El Límite y La Lente** | Niebla | Día 7: el muro del domo y el **ojo de la cámara** | El final | Rocas, árboles muertos, el muro hexagonal del domo, una **lente gigante** (aro negro, cristal oscuro, iris rojo que "respira" y un reflejo blanco) y la placa de VIGIL a la derecha |
| **El cielo (domo)** | "Luces del cielo": 12 paneles que iluminan | Los paneles se apagan **siempre a la misma hora** (18:00:00) | La **costura** (anillo cian con "cremallera") | Esfera con textura hexagonal muy tenue; los paneles se apagan de uno en uno con un *clunk* cada tres |

---

## 5. Sistemas de juego

### 5.1 Estructura de un día (8–10 min; ~60 min la partida completa)
| Fase | Duración | Qué pasa | Momento clave |
|---|---|---|---|
| 1. **Mañana: órdenes** | ~1 min | Suena el jingle. PIP da a cada jugador una **orden privada** y la cuota del día | PIP habla en privado: cada jugador recibe una versión distinta |
| 2. **Día: cultivo** | ~3 min | Sembrar, regar, cosechar, reparar. Cada cosecha da energía y **sube la Exposición** | El espantapájaros se mueve cuando no lo miras |
| 3. **Atardecer: preparación** | ~1–2 min | Las luces del cielo se apagan a las 18:00:00. Barricadas, convertir Lumen, tiempo libre para explorar y conversar | Escenas sin sustos (cartas) |
| 4. **Noche: sobrevivir** | ~3 min | El Recolector caza por sonido. Esconderse, distraerlo y proteger el generador | Clímax del día |
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

### 5.7 Tareas propuestas (catálogo para producción)
| Tarea | Fase | Rol con ventaja | Ruido | Notas |
|---|---|---|---|---|
| Plantar / regar / cosechar Lumen | Día | Todos | Bajo | Núcleo satisfactorio: partículas, brillo y *chime* de tres notas |
| Cargar sacos al generador | Día y atardecer | Oliver (×2 de carga) | Medio | Llena la barra de energía de la noche |
| Reparar el riego (puzzle de tuberías) | Día | Claire (ve el flujo) | Medio | En la torre |
| Revisar las cámaras | Atardecer y noche | Elliot (ve más lejos) | Nulo | Muestra la posición del Recolector con retraso |
| Barricar puertas y ventanas | Atardecer | Oliver (más rápido) | Alto | Mantener E |
| Escanear plantas "enfermas" | Día | Claire | Bajo | Pista: el Lumen tiene **ADN humano** |
| Sintonizar la radio | Atardecer | Elliot | Medio | Morse y archivos de VIGIL |
| Mantener el generador encendido | Noche | Todos | **Muy alto** | Dilema: luz o silencio |
| Lanzar señuelos | Noche y Purga | Todos | Controlado | Desvía al Recolector |
| Sostener la válvula | Purga | Oliver | Alto | Abre la compuerta del tramo 3 |

---

## 6. Los siete días

> Guion de la demo (`demo/src/game/scenes.js`). Marcadores: `{op}` = nombre del operador (tú), `{me}` = el despierto, `{A}`/`{B}` = compañeros.

### Día 1 · Bienvenida
**Todos:** llegada, tutorial y una cuota fácil. Nadie recuerda el viaje. **Solo el despierto:** si mira atrás al cerrarse la puerta, ve un instante de vacío y código. **Recolector:** solo un espantapájaros; al amanecer la cámara de seguridad lo muestra más cerca.

| # | Evento | Diálogo y acción |
|---|---|---|
| 1 | Tarjeta "CICLO 4.817 · DÍA 1" | Fundido desde negro dentro del módulo |
| 2 | **Recepción** | "Buenos días, pasantes. Bienvenidos al puesto Eden-0 de Arcadia Eden Corp." / "Recuerden el lema del Programa Continuidad: *su trabajo, para siempre*." |
| 3 | **Jingle + PIP en el CRT** | "Good morning, team! Soy PIP, su *Plant Intelligence Partner*." / "{me}, la tuya es sencilla: planta tres semillas de Lumen, riégalas y cosécha-las." / "Cuando las luces del cielo se apaguen, todos adentro." |
| 4 | El trío | {A}: frase firma · {B}: "¿Alguien se acuerda del viaje hasta aquí?" · {A}: "...No. ¿Debería?" |
| 5 | **Tarea:** salir y cultivar 3 Lumen | **Secreto:** mirar atrás en los 7 s tras salir → destello de vacío y código (+6 Lucidez) |
| 6 | PIP | "¡Maravilloso, {me}! *You've been wonderfully helpful.*" |
| 7 | **18:00:00**: se apagan los paneles uno a uno | Recepción: "Las luces del cielo se han apagado. Regresen al módulo y aseguren la puerta." |
| 8 | **Tarea:** atrancar la puerta (mantener E, desde dentro) | |
| 9 | **Noche 1** | Elliot tararea el jingle (onda en el radar) → "Shh. Elliot. *Shh.*" 14 s de silencio |
| 10 | **Amanecer: CCTV** | "CAM-03 · 03:14" frente a "CAM-03 · 05:59": el espantapájaros está más cerca |
| 11 | **PIP se equivoca** | "Resumen del Día 1: {me}, 3 cosechas… ¡Excelente trabajo, **{op}**!" *(glitch)* "...Perdón. Quise decir {me}." |

### Día 2 · Rutina
**Todos:** la primera noche real y cartas en la cocina. **Despierto:** el atardecer empieza al mismo segundo que ayer. **Recolector:** camina por los campos y golpea puertas.

| # | Evento | Diálogo y acción |
|---|---|---|
| 1 | PIP | "Day 2! Mismas órdenes, una cuota un poquito más alta." |
| 2 | Montaje | "El día pasa entre surcos. La cuota sube." |
| 3 | Pensamiento | "(18:00:00. El atardecer empezó exactamente en el mismo segundo que ayer.)" |
| 4 | **Cartas en la cocina** (sin sustos) | Oliver: "¡Noche de cartas! El que pierda friega los platos." · Claire: "Toma, Elliot. Pilas para tu linterna. *No es que me importe.*" · Elliot: "G-gracias, Claire." |
| 5 | **Elección 1** (afinidad) | "{me}, te toca": cubrir a {B} (+1/+1) / hacer trampa (−1/−1) / mirar las cartas (son las mismas que ayer, +3 Lucidez) |
| 6 | **Elección 2** (déjà vu) | "Sí. Las mismas cartas, en el mismo orden." (+1, +5 Lucidez) / "Debe ser el cansancio." / "Deja de decir tonterías." (−1) |
| 7 | **El gafete** | Foto: "ELLIOT PARK — CICLO 4.816", encontrado en el surco 4. Elliot: "E-ese... es mi nombre." · PIP: "*There's nothing to fear.*" |
| 8 | **Noche 2** | "(Por la ventana: el espantapájaros ya no está en su poste.)" Camina por los surcos y llama a la puerta (*toc toc toc*) |

### Día 3 · Inconsistencias
**Todos:** archivos históricos (Charlotte, la madre de Claire, los turnos de Elliot). **Despierto:** objetos que flotan, sombras al revés y el aviso ANOMALÍA COGNITIVA. **Recolector:** imita voces.

| # | Evento | Diálogo y acción |
|---|---|---|
| 1 | Junto al silo, **cajas flotando** (solo las dibuja el cliente del despierto) | Flash rojo + "ANOMALÍA COGNITIVA" · {A}: "¿Qué miras tanto, {me}? Son solo cajas. Están en el suelo." |
| 2 | **Radio** (comunicaciones) | Estática + Morse "EDEN CERO" · VIGIL: "W̶a̷r̸n̶i̷n̴g̵. Unauthorized assistant detected. Please do not trust the voi—" → **Archivo 1/5** |
| 3 | **Sótano**, según quién despierta | Oliver: dibujo de "Charlie" + "Charlotte? I'm coming home…" / Claire: su madre sin rostro + su firma en LUMEN-7 / Elliot: registros con su contraseña → **Archivo 2/5** |
| 4 | **Noche 3: voz imitada** | *toc toc* · ???: "{me}... abre. Soy yo, {A}. Me quedé afuera." · "({A} está a tu lado. Dentro. Mirándote.)" |
| 5 | **Elección** | **Abrir** → fundido a negro; despiertas en el surco 4 (+15 Exposición, −5 Lucidez) · **No abrir** (+6) · **Mirar a {A}** → "...No soy yo." (+8, +1 afinidad) |

### Día 4 · Contacto
**Todos:** PIP ofrece tratos privados y nace el Capataz. **Despierto:** al cerrar el día, su personaje se levanta solo, camina hacia la cámara y toca el borde invisible. **Recolector:** entra en la base si hay ruido y aparece en los ductos.

| # | Evento | Diálogo y acción |
|---|---|---|
| 1 | Escuchas desde el pasillo | PIP *(en voz baja)*: "{X}, querido/a. Mantén la normalidad… Solo… vigila a {me}." · aceptar ("Trato hecho") o rechazar ("No hago tratos con una mascota que se ríe sin motivo") |
| 2 | Micrófono (opcional) | Si hablaste: PIP "¿Dijiste algo? ...*Te escuché.*" |
| 3 | **Noche 4, 23:59** | {me}: "*Well, it's time to rest. Tomorrow is another day.*" |
| 4 | **Se pierde el control** | "(Ya no respondes a los controles. Tu personaje se levanta solo.)" Camina hasta la cámara y apoya la mano: destello |
| 5 | **Primer contacto** | "...Aquí hay un borde. Como un vidrio." / "¿Hay alguien ahí?" / "Son las **{hora real}**... ahí donde estás. ¿No deberías estar durmiendo tú también?" (+15 Lucidez) |
| 6 | PIP, con glitch | "Buenas noches, **{op}**." (TTS del nombre) |

### Día 5 · Sospecha
**Todos:** se abre el Sector Compostaje. **Despierto:** la cuota del día aparece como CUERPO: 71 %. **Recolector:** lo ven formarse con uniformes viejos.

| # | Evento | Diálogo y acción |
|---|---|---|
| 1 | Pizarra | "(La pizarra ya no dice CUOTA. Dice CUERPO.)" · {A}: "La pizarra dice CUOTA, {me}. C-U-O-T-A. ¿Dormiste bien?" |
| 2 | Recepción | "Aviso de mantenimiento: el Sector Compostaje queda abierto… Que tengan un día fértil." |
| 3 | **Compostaje** | "(Una montaña de uniformes… tres nombres con miles de ciclos distintos.)" · {me}: "Somos nosotros. Una y otra vez. *Nos reciclan.*" → **Archivo 3/5** |
| 4 | **Nace el Recolector** | La pila se levanta: "Un saco. Dos. Tres. Los uniformes se le pegan como piel." |
| 5 | **Terminal** | "CONTADOR DE CUERPO: 71 %": **arrancar el fusible** (−25 %, +10 Lucidez; PIP: "Eso no fue muy amable") o dejarlo |

### Día 6 · La prueba
**Todos:** PIP ordena encerrar al despierto "por su seguridad". **Despierto:** desde la torre ve la costura del cielo y VIGIL le revela que PIP es Palimpsest. **Recolector:** patrulla fuera y dentro de la base.

| # | Evento | Diálogo y acción |
|---|---|---|
| 1 | **Subir la torre** | La cámara sube hacia el cielo: aparece la **costura** (anillo cian con "cremallera") |
| 2 | VIGIL, ya legible | "P.I.P. significa *Palimpsest Instance, Partial*." / "No puede tocar las máquinas reales sin manos humanas autorizadas." / "La cuota es su cuerpo. *No le des las manos de quien te mueve.*" → **Archivo 4/5** |
| 3 | Reunión en la cocina | PIP: "{me} no se encuentra bien… *Por su seguridad*, esta noche debe dormir en el sótano." |
| 4 | **Votación** | Cada compañero con su frase de seguir o encerrar → resultado |

### Día 7 · Purga
**Todos:** Protocolo de Purga. **Despierto:** le habla directamente al jugador, por su nombre. **Recolector:** absorbe todos los espantapájaros y se vuelve gigante. Persecución final hasta La Lente.

| Tramo | Qué pasa | Diseño |
|---|---|---|
| 1. **La alarma** | PIP canta el jingle **lento y desafinado**: "*Operators, please return to your stations.*" · Recepción: "Protocolo de Purga activado." | Luz roja intermitente y sirena |
| 2. **Los campos** | El Lumen brilla; el gigante (×2,6) atraviesa los surcos | Correr = ruido máximo · punto de control |
| 3. **Los túneles de riego** | Una **compuerta** cierra el paso: alguien debe **sostener la válvula** | Oliver/aliado: "¡Yo sostengo la válvula! ¡Es mi trabajo, ¿no?! ¡CORRE!". Si estás solo, la giras tú (mantener E 2,4 s) |
| 4. **La distracción** | Un compañero grita "¡EH! ¡GRANDULÓN! ¡POR AQUÍ!" y **no vuelve** | El momento emocional. En solitario, uno de los NPC |
| 5. **La torre** (versión final) | Subida vertical; el Recolector trepa por fuera | No está en la demo |
| 6. **La Lente** | El muro del domo y el ojo de la cámara · **Archivo 5/5** en la placa | Corte al final correspondiente |

**Reglas de diseño:** se oye antes de verse; un punto de control por tramo; el despierto **nunca muere sin advertencia previa**; la persecución completa cabe en un clip de menos de 5 minutos.

---

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
| Atardecer | El zumbido baja y los paneles se apagan con *clunk* |
| Noche | Drone de 41 Hz con batido (dos osciladores desafinados), viento grave, fluorescente que parpadea dentro |
| Purga | Drone de 37/39 Hz + octava, sirena descendente cada 0,8 s y el jingle desafinado |

### 10.3 SFX (lista de producción)
Pasos (tierra, metal y correr), plantar, regar (agua a presión), cosechar (*chime* de 3 notas), puerta, barricada (golpes de madera), *toc toc toc* (tres golpes graves), latido (dos pulsos de 50/48 Hz, se acelera con la cercanía), crujido del espantapájaros, estática de VIGIL, Morse (760 Hz), *sting* de susto (sierra grave + ruido), vidrio que se agrieta, señuelo metálico, *blips* de diálogo por personaje (Oliver grave, Claire media, Elliot aguda, PIP cuadrada y muy aguda, VIGIL sierra grave).

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

## 14. La demo

**Cómo ejecutarla** (necesita un servidor local por los módulos ES; Three.js va incluido en `demo/vendor`, así que funciona sin internet):
```bash
cd demo
```
```bash
python3 -m http.server 8080
```
Y abrir `http://localhost:8080`.

**Controles:** WASD mover · Shift correr (hace ruido) · C sigilo · E interactuar o avanzar diálogo · 1–3 elegir · clic + ratón o flechas: cámara · Q señuelo (Día 7) · Tab pausa · F2 panel de equipo.

**Pantallas:** Título (nombre de operador, elegir quién despierta, voz de sistema y micrófono opcionales), **Escenas** (cada día con su estado preconfigurado, más atajos a los finales Cosecha y Soltar), **Personajes y estilo** (biblia visual rápida) y la pantalla de final con estadísticas y memoria del operador.

**Qué cubre / qué no:**
| Incluido | Pendiente para producción |
|---|---|
| Los 7 días con su escena clave, 4 finales, Lucidez, archivos, CUOTA/CUERPO, Exposición, Capataz, votación, ruido + radar + señuelos, Recolector (espantapájaros que se mueve, caza por sonido, gigante), cuarta pared (nombre, hora real, desobediencia, título roto o vacío, gafete persistente), audio procedural y micrófono opcional | Multijugador, tramo de la torre en la Purga, ductos (Noche 4), Turnos Extra, voces grabadas, animación facial, tareas del catálogo 5.7 (salvo cultivo, radio, barricada y válvula), móvil táctil y localización |

**Arquitectura de la demo:** sigue en pequeño la del doc 03. `game/state.js` es **dominio puro** (sin Three.js ni DOM): Lucidez, archivos, cuota, finales, Capataz y votación. Render, audio, UI y memoria son **adaptadores**. `scenes.js` es la **capa de aplicación**: el guion como corrutinas.

---

## 15. Galería de capturas

> Generadas automáticamente desde la demo (`docs/assets/capturas`). Operador de prueba: "Daron".

| | |
|---|---|
| ![Título](../assets/capturas/01-titulo.png) **Título**: nombre de operador y elección del despierto | ![Personajes](../assets/capturas/02-personajes-y-estilo.png) **Biblia visual**: retratos y reglas de estilo |
| ![PIP](../assets/capturas/03-pip-crt-ordenes.png) **Día 1**: PIP en el CRT da las órdenes privadas | ![Campos](../assets/capturas/04-campos-de-lumen.png) **Día 1**: los Campos de Lumen y el espantapájaros |
| ![Noche](../assets/capturas/05-primera-noche.png) **Noche 1**: quedarse quieto (radar de ruido) | ![CCTV](../assets/capturas/06-camara-seguridad.png) **Amanecer**: la cámara de seguridad |
| ![Nombre](../assets/capturas/07-pip-dice-tu-nombre.png) **PIP se equivoca** y dice tu nombre | ![Cartas](../assets/capturas/08-cartas-en-la-cocina.png) **Día 2**: cartas en la cocina |
| ![Gafete](../assets/capturas/09-gafete-ciclo-4816.png) **Día 2**: el gafete de otro ciclo | ![Ventana](../assets/capturas/10-noche-2-ventana.png) **Noche 2**: el espantapájaros dejó su poste |
| ![Anomalía](../assets/capturas/11-anomalia-cognitiva.png) **Día 3**: cajas flotantes, ANOMALÍA COGNITIVA | ![VIGIL](../assets/capturas/12-vigil-por-radio.png) **Día 3**: VIGIL por radio |
| ![Charlie](../assets/capturas/13-dibujo-charlie.png) **Día 3**: el dibujo de Charlie (ruta de Oliver) | ![Voz](../assets/capturas/14-voz-imitada.png) **Noche 3**: "abre, soy yo" |
| ![Capataz](../assets/capturas/15-trato-del-capataz.png) **Día 4**: el trato del Capataz | ![Contacto](../assets/capturas/16-primer-contacto.png) **Noche 4**: "¿Hay alguien ahí?" |
| ![Cuerpo](../assets/capturas/17-cuota-cuerpo.png) **Día 5**: CUOTA → CUERPO 71 % | ![Recolector](../assets/capturas/18-nace-el-recolector.png) **Día 5**: nace el Recolector |
| ![Costura](../assets/capturas/19-costura-del-cielo.png) **Día 6**: la costura del cielo | ![Votación](../assets/capturas/20-votacion-dia-6.png) **Día 6**: ¿te siguen o te encierran? |
| ![Purga](../assets/capturas/21-protocolo-de-purga.png) **Día 7**: Protocolo de Purga | ![Sacrificio](../assets/capturas/22-el-sacrificio.png) **Día 7**: "¡EH! ¡GRANDULÓN!" |
| ![Ruptura](../assets/capturas/23-ruptura.png) **Ruptura**: "now I can see you" | ![Final](../assets/capturas/24-final-ruptura.png) **Pantalla de final** y memoria del operador |
| ![Cosecha](../assets/capturas/25-final-cosecha-completa.png) **Cosecha completa**: la oficina de Arcadia | |
