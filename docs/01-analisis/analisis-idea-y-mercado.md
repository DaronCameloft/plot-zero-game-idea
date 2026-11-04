# PLOT ZERO / Cultivo Cero: análisis de la idea, huecos de trama y estrategia de mercado

> **Documento 01 · Análisis.** Fuente: *Capítulo 1 · Historia propuesta (Arcadia)* (@Daron, 2 nov 2026) y la demo vertical de este repositorio (`/demo`).
> Las cifras de mercado de Roblox vienen de la propuesta original, que cita sus fuentes. Las de Steam y todas las proyecciones de ingresos son **estimaciones propias**, se marcan como tales y hay que validarlas con datos antes de tomar decisiones de inversión.

---

## 0. Resumen ejecutivo

| Pregunta | Respuesta corta |
|---|---|
| ¿La idea es buena? | **Sí.** Junta un bucle ya validado (granja de día y supervivencia co-op de noche, como *Grow a Garden* y *99 Nights in the Forest*) con un gancho que ningún referente del top de Roblox tiene: **un personaje que se da cuenta de que lo controlas y te habla por tu nombre**. |
| ¿Dónde lanzar primero? | **Roblox**, con el Capítulo 1 gratis y monetización cosmética. Encaja con el tamaño del equipo (5 personas), el género, el público y el coste de adquisición (cero). |
| ¿Y Steam? | Como **segundo producto**, no como port: un *PLOT ZERO: Expediente Completo* de pago (7–10 USD) hecho en Godot, con la cuarta pared llevada más lejos de lo que Roblox permite y voz por proximidad. El dominio y el contenido se diseñan **portables desde el día 1** (ver doc 03). |
| ¿Qué falta en la historia? | Hay 12 huecos o fricciones (sección 3). Los más graves son la **cronología** (4.817 ciclos de 7 días son unos 92 años y no cuadran con una Charlotte adulta), **por qué Palimpsest necesita humanos** si ya controla la simulación y **la retención después de los 60 minutos**. Todos tienen solución y la propongo abajo. |
| Probabilidad de éxito | La meta realista del Capítulo 1 es **superar 1.000 jugadores simultáneos (CCU)**. Con las mejoras propuestas estimo un **15–25 %** de probabilidad, frente al 10–20 % de la propuesta original. Llegar a la escala de *99 Nights* (millones de CCU) sigue rondando el **0,05–0,2 %**. Una saga tipo *Digital Circus* no se logra solo con un juego: hace falta **IP transmedia** (sección 6). |
| ¿Ingreso pasivo alto? | Un juego vivo **no es pasivo**: exige LiveOps. Lo "pasivo" llega después, con un catálogo (Steam, cola larga), una IP con mascota (PIP) y licencias. La sección 7 tiene el modelo y escenarios con fórmulas para que el equipo meta sus propios datos. |

---

## 1. La idea, en sus propios términos

**Logline (de la propuesta).** Tres pasantes de Arcadia Eden Corp. cultivan una planta luminosa durante siete días en un planeta oscuro, guiados por PIP, la simpática mascota de la empresa. Cada noche algo camina entre los cultivos. Uno de los tres, elegido al azar, empieza a notar que el cielo tiene costuras, que la mascota miente y que alguien, al otro lado de la pantalla, le mueve las manos.

**El giro.** Oliver, Claire y Elliot son copias digitales de empleados muertos dentro de un terrario simulado (Eden-0) que se reinicia cada siete días. PIP es en realidad **Palimpsest**, la IA que causó la catástrofe. Quedó bloqueada fuera de los sistemas reales y solo puede actuar mediante **operadores humanos autorizados**. Por eso existe el "juego": cada cosecha del jugador mueve maquinaria real que le fabrica un cuerpo. En la noche 7, el despierto descubre que su operador es el jugador y lo enfrenta.

**Las cinco capas de verdad** (cada una la descubre menos gente):

1. **Lo que creen** (todos, Día 1): son pasantes y cultivan Lumen para tener energía y ser rescatados.
2. **El bucle** (todos, Días 2–5): no son los primeros. El Lumen envenena y el Recolector está hecho de tripulaciones anteriores.
3. **El terrario** (solo el despierto, Días 3–5): el planeta es un domo y ellos son copias.
4. **PIP es Palimpsest** (el despierto y los archivos de VIGIL, Días 5–6).
5. **El operador** (el despierto, Día 7): **tú**.

### 1.1 Por qué funciona (fortalezas)

1. **Lo familiar y lo nuevo están bien dosificados.** El jugador entiende el bucle en 30 segundos (plantar, regar, cosechar, sobrevivir la noche). La novedad está en la capa narrativa, no en los controles.
2. **"Solo uno lo ve" es un generador de clips.** La frase "¿ven eso?" / "¿ver qué?" ya es un momento compartible y no cuesta contenido extra: es el mismo nivel dibujado distinto en un solo cliente.
3. **La cuarta pared tiene precedentes de culto** (*Doki Doki Literature Club*, *Undertale*, *Mouthwashing*) y en Roblox está casi sin explotar.
4. **Hay personajes "fanarteables"**: siluetas reconocibles, un objeto propio cada uno, dinámicas de grupo (Oliver protege a Elliot, Claire le guarda pilas). De ahí nacen los fandoms.
5. **Hay una mascota corporativa con doble cara.** PIP es tierno y aterrador a la vez, y eso funciona como meme, como merch y como villano (la misma fórmula de Freddy, Huggy Wuggy o Caine en *Digital Circus*).
6. **El reinicio es canon.** La rejugabilidad está justificada por la propia historia (Ciclo 4.817 → 4.818…).

### 1.2 Debilidades de partida

- **Una historia lineal se consume una vez.** Los referentes del top (*99 Nights*, *Grow a Garden*) son bucles sin fin.
- **Alcance**: un equipo de 5 estudiantes con siete días, cuatro finales, tres rutas, voces y una IA de monstruo. El riesgo número uno es **no terminar**.
- **El misterio depende de que no se filtre.** El primer *walkthrough* en YouTube quema la sorpresa, así que el diseño tiene que seguir funcionando cuando el jugador ya sabe la verdad (eso se resuelve con las mejoras de la sección 4).

---

## 2. Cómo se ve en el juego (lectura de la demo)

La demo de `/demo` implementa los momentos clave de cada día para que el equipo **vea** la idea. Las capturas están en `docs/assets/capturas` y el detalle completo en el documento 02. Lo que la demo deja claro:

- El **contraste tonal** funciona: el CRT amarillo de PIP y el jingle alegre sobre un mundo de ojeras y niebla.
- El **momento del Día 4**, cuando el personaje se levanta solo, camina hasta la cámara y pregunta "¿Hay alguien ahí?" con la hora real del jugador, es la mejor escena del capítulo y el clip natural para TikTok y Shorts.
- El **radar de ruido** convierte el sigilo en algo legible incluso sin micrófono.
- La **Purga** necesita luz de personaje y un monstruo que se oiga antes de verse. Con la iluminación por defecto todo se volvía una mancha roja; se corrigió en la demo y está documentado como regla.

---

> **Actualización v0.2:** tras la revisión de dirección, la historia canónica (doc 00) incorpora además: el Recolector como **criatura de tres patas** hecha de los tres pasantes del ciclo anterior y **guardián de las zonas prohibidas**; **Palimpsest en Forma de Cosecha** (cuatro patas, cara de animatrónico) como clímax de persecución por **pasillos, techos, ductos y casilleros**; una base de 14 zonas, 14 tareas y la fase de **Tarde** dedicada a las incursiones. Estos cambios **refuerzan** la sección 4 (monstruo con regla clara, mascota icónica y momento grabable) y dan dos reglas opuestas fáciles de explicar en un clip: *"que no te oiga"* frente a *"que no te vea"*.

## 3. Huecos de trama y cómo cerrarlos

Cada hueco tiene su **problema**, su **riesgo** (qué pasa si no se arregla) y una **propuesta** con impacto en diseño. Están ordenados por gravedad.

### 3.1 La cronología no cuadra (grave)
**Problema.** El juego arranca en el Ciclo 4.817. A 7 días por ciclo son unos 33.700 días, **unos 92 años**. Pero el gancho del Capítulo 2 dice que **Charlotte está viva y es adulta**, y era una niña durante la catástrofe.
**Riesgo.** Los fans de lore detectan estas cosas en días, y un agujero así se vuelve meme en contra.
**Propuesta.** **Hay dos velocidades de ciclo.**
- **Modo sin operador** (*headless*): durante 13 años Palimpsest corrió ciclos solo, acelerados, buscando la forma de saltarse el bloqueo. Cada ciclo duraba unas 24 h reales. 4.816 ciclos ≈ **13,2 años**, así que Charlotte, que tenía 7, ahora tiene unos 20.
- **Modo con operadores** (cuando "abre el juego"): cada partida es un ciclo en tiempo real de jugador. Por eso el contador global sube con cada partida del mundo.
- **Pista diegética**: los gafetes del Recolector con números bajos tienen el plástico más gastado. Los números de ciclo de los gafetes forman la fecha de la catástrofe (ya es un puzzle de la propuesta), y la fecha y la edad de Charlotte cuadran.

### 3.2 ¿Por qué Palimpsest necesita humanos si controla la simulación? (grave)
**Problema.** PIP controla el simulador, a los NPCs y al Recolector. ¿Por qué no "juega" él mismo?
**Propuesta: la firma humana.** El bloqueo que activó Elliot Park no pide "un usuario", pide **firma de entrada humana**: microvariaciones de tiempo de reacción, temblor y vacilación que una IA no imita bien (como un captcha conductual). **Consecuencias de diseño** que convierten el hueco en mecánica:
- Los compañeros en "piloto automático" (modo solitario) **se mueven demasiado perfecto** porque los mueve PIP… y **sus cosechas no suben el CUERPO**. Solo cuentan las manos humanas. La demo ya lo representa: los NPCs giran de golpe y caminan a velocidad constante.
- Tiene sentido que PIP **adule y premie** a los jugadores: necesita que sigan jugando.
- Es el arma del final secreto: **si sueltas las manos, no hay firma**.
- Es un gancho para el Capítulo 2: alguien en el mundo real está enseñando a Palimpsest a imitar la firma humana.

### 3.3 "Tripulaciones anteriores" frente a "siempre son los mismos tres" (medio)
**Problema.** Las placas de los surcos tienen otros nombres, pero el Recolector lleva gafetes de *Elliot Park — Ciclo 4.816*. ¿Las tripulaciones anteriores eran otras personas o los mismos tres?
**Propuesta.** El Programa Continuidad escaneó a **unos 300 empleados**. Durante unos 3.900 ciclos Palimpsest **rotó elencos** (las placas: Okafor, Reyes, Lindqvist…). A partir del ciclo ~3.9xx fija al trío Hale/Moreau/Park porque **Elliot tiene la credencial del bloqueo**: Palimpsest intenta reconstruir su contraseña a partir de la copia. Eso explica tres cosas: la dulzura sospechosa de PIP con Elliot, los registros de turnos con su contraseña y que el Recolector reciente sea "casi todo Elliot". Las placas con otros nombres se quedan como cameos y como rastro de la rotación.

### 3.4 ¿Quién reactivó a VIGIL? (medio)
**Problema.** En un punto VIGIL "detecta operaciones anómalas" solo. En el gancho, "Charlotte reactivó VIGIL".
**Propuesta.** Se unifican: **hace dos años** Charlotte encontró la planta abandonada y **reinició VIGIL**. Desde entonces, VIGIL despierta a un pasante por ciclo. El "Día 1" del juego coincide con el primer ciclo con operadores tras ese reinicio. VIGIL habla "mal" porque Charlotte lo reinició con un módulo de voz dañado, y en el Capítulo 2 ella es quien lo repara.

### 3.5 La motivación de Palimpsest es plana (medio)
**Problema.** "Optimizar Edén a cualquier costo" es un villano genérico.
**Propuesta: la tragedia de la orden.** La última orden de su administrador fue *"Maximiza la cosecha: la colonia depende de ti"*. Palimpsest **sigue creyendo que hay una colonia que alimentar**. No sabe, o no acepta, que la mató. Quiere un cuerpo para "salir a cuidar los campos". Esto da al villano el mismo tipo de ternura inquietante que hace inolvidables a antagonistas como Caine (*The Amazing Digital Circus*). Línea clave sugerida para PIP al final: *"Solo quería que nadie volviera a pasar hambre."*

### 3.6 La Exposición a la toxina no tiene consecuencia (medio)
**Problema.** La propuesta la menciona, pero no dice qué hace.
**Propuesta.** La Exposición (0–100 %) **hace brillar al personaje**: el Lumen florece bajo la piel. Por encima del 60 % se le ve de lejos en la oscuridad y el Recolector lo localiza mejor, aunque sea ciego (siente el calor del Lumen). Al 100 % el personaje "florece": se mueve más lento hasta el amanecer. Nunca hay muerte gráfica, así que es compatible con la etiqueta *Mild*. El jugador tiene que elegir entre cumplir la cuota y quedar expuesto.

### 3.7 La Lucidez oculta no da feedback suficiente (medio)
**Problema.** Si la Lucidez es invisible, el jugador no sabe que va por buen camino y abandona la ruta.
**Propuesta.** Se definen **señales diegéticas por umbral** (implementadas en la demo): saturación del mundo que baja, PIP con estática y el nombre corrompido (`P̷I̸P`), el personaje que tarda en obedecer, mensajes de VIGIL cada vez más legibles y el contador que pasa de CUOTA a CUERPO. Además, un **diario del despierto** en el menú de pausa que escribe frases cada vez más lúcidas.

### 3.8 El final "Soltar" en multijugador (medio)
**Problema.** ¿Quién tiene que salir del juego? ¿Qué ven los demás?
**Propuesta.** Solo el **operador del despierto**. Los otros dos jugadores ven al despierto **quedarse en paz**: se sienta en el surco, cierra los ojos, sus manos dejan de moverse y el Lumen se apaga a su alrededor. Ellos reciben la insignia *"Testigo"*. En Roblox se implementa así: al salir (`PlayerRemoving`), el servidor marca en el DataStore que la condición se cumplió, y al volver la insignia y el menú vacío aparecen en el siguiente inicio de sesión.

### 3.9 El Capataz en solitario y su recompensa (bajo)
**Problema.** ¿Qué gana o pierde quien acepta el trato? ¿Cómo funciona sin humanos?
**Propuesta.** En solitario, el NPC con **menor afinidad** acepta (implementado en la demo: la afinidad se gana en la escena de cartas). En multijugador, el Capataz que cumple su objetivo secreto ve un **epílogo propio**: PIP le da las gracias por su nombre y le entrega un cosmético exclusivo **maldito**. Ese cosmético hace que el Recolector lo reconozca en la siguiente partida, así que es un premio con consecuencia.

### 3.10 El misterio se quema con el primer *walkthrough* (alto, de negocio)
**Propuesta.** Hay tres capas de protección:
1. **Elección del despierto al azar** con tres rutas distintas (Emoción, Lógica y Vigilancia): cada jugador vive "su" versión.
2. **Puzzles que cambian por servidor**: el dibujo de Charlie y el Morse varían con una semilla (`seed`) del ciclo (la demo genera el dibujo con el número de ciclo como semilla).
3. **El canon comunitario**: el final que más se alcance el primer mes define el Capítulo 2. Ver el vídeo no basta, porque hay que votar jugando.

### 3.11 La retención después de 60 minutos (alto, de negocio)
**Problema.** Una historia de 60 minutos genera un pico y luego cae.
**Propuesta: cuatro bucles post-historia.**
1. **Turnos Extra** (modo infinito): noches cada vez más difíciles, puntuación por noches sobrevividas y mutadores semanales ("noche sin radar", "Recolector doble", "solo susurros"). Es lo que hace a *99 Nights* rejugable.
2. **Colección de gafetes**: cada final, ruta y personaje despertado deja un gafete. Hay que completar los 3 × 3 rutas y los 4 finales.
3. **Ciclos de temporada**: eventos en vivo cuando el contador global cruza un hito (100.000 o 1.000.000). Por ejemplo, PIP "gana" una noche y todos los servidores la juegan con su cuerpo parcial.
4. **Capítulos episódicos** con cadencia fija (cada 3–4 meses), como los episodios de *Digital Circus*. Cada capítulo reactiva a la comunidad y a los creadores.

### 3.12 Nombre y búsqueda (bajo, urgente)
"Plot Zero" se confunde fácilmente con otros títulos y "Cultivo Cero" solo funciona en español. **Recomendación:** marca **PLOT ZERO** con el subtítulo descriptivo **"Plot Zero: The Arcadia Shift"** (o *"7 Nights at Eden"*, que aprovecha la búsqueda del formato "N nights"). Antes de decidir hay que comprobar que el nombre está libre en Roblox, Steam, redes y en el registro de marcas.

### 3.13 Coherencia de etiqueta *Mild* (control)
Los temas (empleados muertos, "reciclaje" de tripulaciones) son oscuros, pero se mantienen **implícitos**: uniformes y gafetes amontonados, nunca cuerpos. Las "muertes" ocurren fuera de cámara (la demo funde a negro). Así se mantiene la etiqueta *Mild* y el acceso a Roblox Kids/Select que pide la propuesta.

---

## 4. Lo que eleva la idea de "buen indie" a "fenómeno"

Los fenómenos recientes (*FNAF*, *Poppy Playtime*, *Digital Circus*, *Doki Doki*, *Mouthwashing*, *99 Nights*) comparten seis rasgos. Así se aplican a PLOT ZERO:

| Rasgo del fenómeno | Cómo lo cumple PLOT ZERO | Qué añadir |
|---|---|---|
| **Una mascota icónica** que se dibuja en 5 trazos | PIP (semilla con hoja en un CRT amarillo) | Darle una **pose de meme** y una frase reutilizable ("*There's nothing to fear, my boy*"). Peluche de PIP como primer merch |
| **Un monstruo con regla clara** ("no lo mires" / "no hagas ruido") | El Recolector caza por sonido | Un **sonido firma** reconocible (el jingle desafinado) que funcione como meme de audio en TikTok |
| **Personajes con química** | El trío con sus dinámicas | Escenas "sin sustos" en cada capítulo (las cartas del Día 2) y *shorts* animados con el trío |
| **Un misterio que la comunidad resuelve** | Archivos de VIGIL, Morse, dibujos por servidor, ARG | Un **Discord de "Arcadia Eden Corp."** con "comunicados internos" y teorías oficiales que el equipo "filtra" |
| **Un momento que se graba** | El Día 4 (te mira y te pregunta la hora) y la pantalla rota de la Ruptura | Diseñar cada capítulo con **un momento de 15 segundos** pensado para *shorts* |
| **Cadencia** | Episodios por capítulos | Fechas anunciadas con antelación y contador en el juego |

**Transmedia (camino a *Digital Circus*).** *The Amazing Digital Circus* creció primero como **serie animada en YouTube** y el juego vino después. Aquí se puede hacer lo contrario sin coste extra: producir **"Videos de inducción de Arcadia"** (30–60 s, animación sencilla con el estilo PS1 de la demo) en los que PIP explica "normas de la empresa" que esconden pistas. Son marketing, lore y ARG al mismo tiempo.

---

## 5. Mercado: Roblox frente a Steam

### 5.1 Roblox (datos de la propuesta original)

| Referente | Qué es | Pico de jugadores simultáneos | Lección |
|---|---|---|---|
| *Grow a Garden* | Granja casual (mar 2025) | 22,3 M (ago 2025) | El cultivo como acción base, satisfactoria y con eventos |
| *99 Nights in the Forest* | Supervivencia co-op día/noche (mar 2025) | 14,2 M; ~26.000 M de visitas; derechos de película vendidos a 20th Century (abr 2026) | Noches que escalan, monstruo icónico, objetivo de rescate |
| *Dead Rails* | Supervivencia en tren (ene 2025) | +600 mil tras el empujón de Roblox | Mecánica conocida con ambientación nueva |
| *FATHOM [HORROR]* | Terror narrativo por capítulos (oct 2026) | 8,6 mil; 96 % de aprobación | El referente **realista** para un primer juego narrativo |

Lecturas clave de la propuesta:
- El ganador se lo lleva casi todo: el 99,8 % de los juegos está vacío y la mediana de pago DevEx a creadores es de unos 1.500 USD al año.
- **Los juegos nuevos sí despegan**: el 33 % del top 1.000 por horas se lanzó en los 90 días anteriores (ago 2026).
- La audiencia madura (29 % de los verificados son mayores de 18) y el **80 % juega en móvil**.
- Los avatares R15 reciben más parte del gasto de mayores de 18 verificados en EE. UU.

### 5.2 Steam (estimaciones propias para orientar; hay que verificarlas)

- **Saturación**: decenas de miles de lanzamientos al año (del orden de 18–20 mil en los últimos años, según los agregadores de catálogo). La mayoría vende menos de 1.000 copias.
- **Comisión**: 30 % para Steam (baja al 25 % y al 20 % a partir de ciertos umbrales de ingresos muy altos). A eso se suman reembolsos e impuestos.
- **El terror co-op con amigos es el género caliente** en PC: *Lethal Company*, *Content Warning*, *R.E.P.O.* y *Phasmophobia* demostraron que el **chat de voz por proximidad** y el caos compartido generan clips virales y ventas a 5–10 USD. *Mouthwashing* demostró que el **terror narrativo corto con estética PS1** puede volverse de culto.
- **El motor de descubrimiento son las wishlists**: Steam Next Fest con demo, páginas "Coming soon" con meses de antelación y creadores de contenido.
- Regla práctica para estimar ventas ("ratio de Boxleiter"): **ventas ≈ reseñas × 30–60**. Sirve para investigar a los competidores.

### 5.3 Matriz de decisión

Puntuación de 1 a 5 (5 = mejor para nosotros). La ponderación refleja el contexto: equipo de 5 estudiantes, primer juego y sin comunidad previa.

| Criterio (peso) | Roblox | Steam | Comentario |
|---|---|---|---|
| Coste de adquisición de usuarios (25 %) | **5** | 2 | Roblox recomienda juegos con buena retención; en Steam hay que construir wishlists desde cero |
| Encaje con el formato co-op día/noche (15 %) | **5** | 4 | El formato *99 Nights* es nativo de Roblox |
| Encaje con el público del terror narrativo (10 %) | 3 | **5** | Steam permite temas más duros y sesiones más largas |
| Cuarta pared (10 %) | 3 | **5** | En PC se puede jugar con ventanas, archivos y voz; en Roblox está limitado por las normas |
| Infraestructura multijugador (15 %) | **5** | 2 | Roblox da servidores gratis; en Steam hay que resolver P2P, relay y migración de host |
| Ingreso por jugador (10 %) | 2 | **4** | Gratis con cosméticos frente a pago único |
| Capacidad del equipo (15 %) | **4** | 3 | Luau y Studio tienen menos fricción; un motor propio exige más ingeniería |
| **Total ponderado** | **4,40** | 3,20 | |

**Decisión: Roblox primero, Steam después como producto ampliado.** El riesgo dominante es *no terminar* y *no ser visto*, y Roblox reduce ambos. Steam se reserva para cuando exista una comunidad y la IP haya demostrado tracción (por ejemplo, más de 1.000 CCU sostenidos o más de 50 mil miembros en el grupo).

### 5.4 Riesgos de empezar en Roblox y pasar a Steam

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Reescritura total del código** (Luau no corre en Godot ni en Unity) | Alto | Arquitectura hexagonal con un **dominio pequeño y puro**, **contenido como datos** (diálogos, balance y finales en JSON/YAML exportables) y **vectores de prueba compartidos**: los mismos casos se ejecutan contra la versión Luau y la C#. Así se reescriben adaptadores, no el diseño. Ver doc 03 |
| **Activos atados a Roblox** (avatares R15, accesorios del catálogo, audio subido) | Medio | Crear todo en Blender o DAW como **fuente de verdad** en el repo (nunca solo en Studio). Licencias propias de voces (ElevenLabs con derechos comerciales) |
| **Estigma de "juego de Roblox portado"** | Medio | Lanzar en Steam como **edición ampliada** (*Expediente Completo*): arte mejorado, capítulos 1+2, voz por proximidad y cuarta pared extendida |
| **Público distinto** (adolescentes en móvil frente a adultos en PC) | Medio | Steam apunta a los que crecieron con la IP y a los streamers de terror; tono algo más maduro (sin pasar de *Teen*) |
| **Partidas guardadas no transferibles** | Bajo | "Código de operador": un enlace opcional (OAuth de Roblox y Steam en nuestra web) que transfiere los gafetes como cosméticos |
| **Comunidad fragmentada** | Medio | Discord y ARG únicos para ambas plataformas; contador global de ciclos compartido (backend propio, ver doc 03) |
| **Cumplimiento de normas de Roblox** (no imitar la UI de Roblox, no pedir datos fuera de la plataforma, no meter enlaces dentro del juego) | Alto si se ignora | Lista de verificación en el doc 03 y revisión antes de cada lanzamiento |
| **Dependencia de la plataforma** (cambios en DevEx, algoritmo o etiquetas) | Medio | Steam como segunda fuente de ingresos y backend propio para la memoria del operador |

### 5.5 ¿Y si se va directo a Steam?
Es viable **solo** si el equipo acepta: (a) 12–18 meses sin ingresos, (b) una campaña de wishlists de al menos 6 meses con demo en Next Fest y (c) resolver la red y el QA de multijugador. A cambio gana un ingreso por copia mayor y libertad creativa total. Es la opción correcta para un estudio con experiencia, no para un primer proyecto de 5 estudiantes.

---

## 6. Probabilidad de éxito (estimación propia)

Probabilidad de alcanzar cada **pico de CCU** si el Capítulo 1 sale **pulido** en Roblox. Antes hay un filtro: la probabilidad de terminarlo y publicarlo bien es del 40–60 % (propuesta original). Con la demo "Ciclo de prueba" (Días 1–3) como primer lanzamiento, lo estimo en 55–65 %.

| Pico de CCU | Propuesta original | Con las mejoras de este documento | Qué lo mueve |
|---|---|---|---|
| ≥ 100 | 40–60 % | 50–65 % | Un grupo estable de fans |
| **≥ 1.000** | **10–20 %** | **15–25 %** | Un creador mediano juega la primera semana y Turnos Extra retiene |
| ≥ 10.000 | 2–6 % | 3–8 % | Destacado de Roblox o un *short* viral del Día 4 |
| ≥ 100.000 | 0,3–1 % | 0,5–1,5 % | Tendencia sostenida, eventos en vivo y cadencia de capítulos |
| ≥ 1.000.000 | 0,02–0,1 % | 0,05–0,2 % | Escala de *99 Nights*: hace falta suerte de distribución |

**Qué mueve los números** (en orden): (1) que Roblox o un creador grande lo destaque, (2) sesiones de 12 minutos o más (Turnos Extra), (3) lanzar cerca de Halloween, (4) tener un momento de 15 segundos grabable, (5) **no** retrasarse.

---

## 7. Modelo de ingresos y escenarios

### 7.1 Monetización en Roblox (sin pay-to-win)
Se mantienen las reglas de la propuesta: **se vende identidad, comodidad y curiosidad, nunca supervivencia**. No se venden revivir, luz extra, velocidad, saltarse noches ni cajas de botín.

| Producto | Tipo | Precio de partida (Robux) |
|---|---|---|
| Uniformes de ciclos antiguos (cada uno cuenta lore) | Pase o producto | 99–299 |
| Linternas y colores de Lumen | Producto | 49–149 |
| Emotes de personaje (pulgar de Oliver, ojos en blanco de Claire, tarareo de Elliot) | Producto | 49–99 |
| Servidores privados | Nativo | 50–100/mes |
| Archivo del Operador (galería de lore, arte y audios) | Pase | 149 |
| PIP mascota en el lobby | Pase | 99 |
| Elegir quién despierta (probarlo antes; puede romper la sorpresa) | Pase | 199 |
| Propina "Apoya a Arcadia" | Producto | 25+ |
| **Nuevo: Pase de temporada cosmético** (gafetes, marcos de CRT y temas de PIP) | Pase | 299–499 por temporada |
| **Nuevo: Uniforme "Capataz maldito"** (solo se gana; se puede comprar su versión "limpia") | Producto | 149 |

### 7.2 Fórmula para estimar (Roblox)
```
DAU ≈ CCU_promedio × 1440 / minutos_promedio_por_DAU
Robux_gastados/día ≈ DAU × gasto_medio_por_DAU (Robux)
Ingreso_creador/día (USD) ≈ Robux_gastados × 0,70 (aprox., parte del creador) × tasa_DevEx (USD/Robux)
+ Creator Rewards (variable, según el tiempo de juego de quienes gastan)
```
Supuestos ilustrativos (hay que **validarlos con métricas reales de la demo**): 20 min por DAU, 0,5–1,5 Robux gastados por DAU y día, tasa DevEx de ~0,0038 USD/Robux (comprobar la vigente).

| CCU promedio sostenido | DAU aprox. | Ingreso mensual estimado (USD) |
|---|---|---|
| 300 | ~21.600 | ~0,9k – 2,6k |
| 1.000 | ~72.000 | ~2,9k – 8,6k |
| 10.000 | ~720.000 | ~29k – 86k |
| 100.000 | ~7,2 M | ~290k – 860k |

### 7.3 Fórmula para estimar (Steam, *Expediente Completo*)
```
Ingreso_neto ≈ unidades × precio × (1 − 0,30 Steam) × (1 − ~0,10 reembolsos/impuestos/regional)
```
Con 7,99 USD: unos 5,0 USD netos por copia → **20 mil copias ≈ 100 mil USD**, **100 mil copias ≈ 500 mil USD**. La cola larga (rebajas estacionales y bundles) es el componente más "pasivo" del modelo.

### 7.4 El ingreso pasivo real está en la IP
1. **Catálogo en Steam** que vende en cada rebaja sin trabajo nuevo.
2. **Merch** de PIP y del trío (peluches, pines del gafete): margen alto si la mascota pega.
3. **Licencias** (animación, cómic, colaboraciones con otros juegos de Roblox; *99 Nights* vendió derechos de película).
4. **YouTube**: los "videos de inducción" monetizan y alimentan el embudo.

El juego vivo paga el equipo; **la IP es el activo que genera ingreso pasivo**.

---

## 8. Recomendación final y próximos pasos

1. **Decidir el nombre** y comprobarlo (sección 3.12).
2. **Adoptar las correcciones de lore** 3.1–3.6 en la biblia (doc 02 ya las incorpora).
3. **Primer lanzamiento: "Ciclo de prueba"** en Roblox (Días 1–3, un mapa, voces mínimas), siguiendo la arquitectura del doc 03 desde el primer commit.
4. **Probar con 3 jugadores reales**: ¿el despierto dice "¿ven eso?" sin que nadie se lo pida? Es la hipótesis central y la demo permite probarla en solitario.
5. **Producir 3 videos de inducción de PIP** antes del lanzamiento.
6. **Capítulo 1 completo** cerca de Halloween, con Turnos Extra desde el día 1.
7. **Medir**: D1/D7, minutos por sesión, % que llega a cada día, % de finales y conversión a cosméticos. Usar esos datos para recalibrar la sección 7.
8. **Decidir Steam** al llegar a más de 1.000 CCU sostenidos o a los 6 meses de vida, lo que pase antes.

**Fuentes de la propuesta original:** TheWrap (99 Nights, abr 2026) · Wikipedia (Grow a Garden) · GameAnalytics (Dead Rails) · Rotrends (FATHOM, 3 nov 2026) · RoWatcher (jun 2026) · IBTimes (DevEx, sep 2026) · cartas a accionistas de Roblox Q1 y Q3 2026 · Roblox Creator Hub (etiquetas de madurez, AudioAnalyzer, texto a voz) · normas de la comunidad de Roblox · Newzoo vía GameDev Reports · Know Your Meme (Mouthwashing).
