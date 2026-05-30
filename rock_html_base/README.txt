ROCK / HALLVALLA HTML BASE

Abre index.html con doble clic.
Cuando cambies style.css, guarda y presiona F5 en el navegador.
Si cambias imágenes y no se actualizan, usa Ctrl+F5.

CONTROLES IMPORTANTES EN style.css

1) Grid y transparencia
Busca: CONTROLES VISUALES DEL GRID
- --cell-line-opacity: transparencia de líneas blancas del grid.
- --cell-fill-opacity-a: transparencia de casillas alternas A.
- --cell-fill-opacity-b: transparencia de casillas alternas B.
- --cell-label-opacity: transparencia de etiquetas A1, B1, etc.
- --calibration-opacity: borde/brillo extra para calibrar.

2) Línea central
Busca: LÍNEA CENTRAL
- --battle-center-top-offset: sube/baja la línea central sin mover los grids.
- --battle-center-opacity: transparencia de la línea central.
- --battle-center-glow-opacity: brillo de la línea central.

3) Fichas
Busca: TAMAÑO Y AJUSTE VISUAL DE FICHAS
- --caster-w / --caster-h / --caster-offset-x / --caster-offset-y
- --guardian-w / --guardian-h / --guardian-offset-x / --guardian-offset-y
- --invocation-w / --invocation-h / --invocation-offset-x / --invocation-offset-y

4) Zoom y arrastre
- Rueda del mouse sobre la arena: zoom.
- Click sostenido + arrastrar: desplazar arena.
- Doble click: reinicia zoom y posición.


ACTUALIZACIÓN GRID SEPARADO:
Los controles de opacidad/relleno ya están separados por lado en style.css:
- --enemy-cell-line-opacity
- --enemy-cell-fill-opacity-a
- --enemy-cell-fill-opacity-b
- --enemy-cell-label-opacity
- --enemy-calibration-opacity
- --ally-cell-line-opacity
- --ally-cell-fill-opacity-a
- --ally-cell-fill-opacity-b
- --ally-cell-label-opacity
- --ally-calibration-opacity


ACTUALIZACIÓN LAYOUT ROK
- Se quitó la barra superior.
- Se quitó la barra inferior de elementos.
- Las fases ahora están en columna vertical entre arena y zona de casteo.
- El botón Siguiente fase está debajo de Espera.
- Los elementos consumibles ahora están en el panel izquierdo.
- Por ahora solo se genera elemento Oscuridad.
- Los orbes ya no muestran texto.


VERSION BETA v0.12
- El click izquierdo ya no arrastra la arena.
- El click izquierdo queda libre para casillas y fichas.
- El desplazamiento/pan de la arena ahora usa botón central del mouse.
- La rueda del mouse sigue controlando el zoom.
- Las casillas ocupadas ya no quedan bloqueadas por el cursor de arrastre.


VERSION BETA v0.13 CORREGIDA
- Revertida desde Rok Beta v0.12 como base estable.
- Se eliminó el intento anterior de panel raro del Kaster.
- El panel de info del Kaster ahora es un panel ancho separado.
- El panel del Kaster se extiende desde la izquierda del contador de turno hasta el borde derecho de la ventana.
- La imagen del Kaster dentro del panel está compuesta como carta: background + arte + skin.
- La carta del Kaster mantiene proporción 2:3 y no se estira.
- Los textos/stats se distribuyen dentro del panel ancho.


VERSION BETA v0.14
- Aplica la regla visual nueva: el skin define la proporción de todas las cartas.
- Proporción detectada del skin actual: 1595x1595.
- La carta del Kaster, las cartas del Spellbook y la ventana de info usan esa proporción.
- El panel ancho del Kaster conserva su ubicación pero reduce su altura.
- Textos visibles actualizados a Kaster/Kasteo/Kastear/Kasteando.
- Al hacer click en una carta se abre ventana grande de información.
- La ventana muestra miniatura, nombre, DAÑO y VIDA.
- Botones: Kastear y Salir.
- Kastear activa las casillas alrededor del Kaster.
- Click en casilla válida manda la invocación a la zona de kasteo.
- La zona de kasteo muestra la ficha/token + reloj de arena + fases restantes.


VERSION BETA v0.15
- Se puede abrir la ventana/view de carta desde cualquier fase.
- El botón Kastear queda bloqueado si no estás en fase de Kasteo o no tienes elementos suficientes.
- Las casillas alrededor del Kaster ahora resaltan más fuerte en blanco y usan un ícono visual de punto de kasteo.
- La zona de kasteo ahora muestra dos badges separados: reloj de arena y número de fases.
- Las fichas en zona de kasteo tienen brillo blanco.
- Al kastear una invocación se crea un marcador de respawn en la casilla elegida con miniatura de la carta y glow del elemento.
- Las fichas que entran en zona de kasteo hacen una animación de caída/aparición.


VERSION BETA v0.16
- El ícono visual de las casillas de kasteo ahora cubre toda la extensión de la casilla.
- Se reemplazó por la referencia nueva entregada por el usuario.
- Se aumentó su presencia visual para que se aprecie completa en cada casilla válida.


VERSION BETA v0.17
- El reloj de arena en zona de kasteo ahora es más grande.
- El número de fases queda superpuesto como esquinita sobre el reloj.
- El marcador de respawn en arena también muestra reloj de arena + número mientras la ficha espera entrar.
- La animación de entrada ahora cae desde arriba y hace un pequeño pulso al aterrizar.
- Hover cruzado: ficha en kasteo ↔ carta de respawn (pulso).
- Hover cruzado: ficha en arena ↔ carta de respawn (iluminación blanca).


VERSION BETA v0.17A
- Base estable: v0.17.
- Se redujo aprox. 40% la intensidad visual de las casillas de Kasteo.
- El badge de reloj/número sobre la carta de respawn en arena se hizo más pequeño.
- Se corrigió el hover cruzado: al pasar sobre la carta de arena ahora sí palpita la ficha en zona de Kasteo.


VERSION BETA v0.18A
- Base: v0.17A estable.
- Se agregó outline blanco a Kaster, Guardianes e Invocaciones.
- Se agregó glow del color del elemento, más sutil, a las fichas en arena.
- Hover sobre fichas ajustado: blanco más suave, menos parpadeante.
- Se agregó lógica base de movimiento en Resolución.
- Kaster: movilidad completa, velocidad 1.
- Invocación: movilidad sostenida vertical, velocidad 3.
- Se agregaron flechas visuales en las casillas válidas de movimiento.


VERSION BETA v0.19
- La ficha que termina Kasteo ahora viaja visualmente desde la zona de Kasteo hasta su casilla de arena.
- La ficha temporal se desplaza en línea recta y reduce su tamaño durante el recorrido.
- Al llegar hace un pequeño pulso antes de aparecer como ficha real en arena.
- Se redujo el outline/glow de las fichas aproximadamente un 80% para que no se vea tan pintado.
- Doble click en una coordenada de la arena ahora hace zoom máximo centrado en esa coordenada; doble click otra vez resetea.


VERSION BETA v0.20
- Flechas de movimiento cuadradas, sin esquinas suavizadas.
- Flechas escaladas al tamaño completo de la casilla de arena.
- Flechas renderizadas por encima de las fichas para poder clicarlas siempre.
- Opacidad de flechas reducida aproximadamente 40%.
- Transición de cambio de fase/jugador animada de izquierda a derecha.
- La transición ahora se centra sobre la línea central iluminada de la arena.


VERSION BETA v0.21
- Fix: el hover cruzado del punto de respawn ya no reinicia la animación de entrada del item en zona de Kasteo.
- El reloj de arena del punto de respawn ahora queda centrado sobre la carta.
- Las casillas/sprites de Kasteo suben por encima de todo mientras eliges la ubicación de Kasteo.
- Se agregó orden visual por profundidad: una ficha ubicada más abajo en la arena siempre queda por encima de una ubicada más arriba.
- Se suavizó el hover del punto de respawn para que no se vea tan grande.
- Se refinó la transición de fase/jugador para que salga limpia, sin borde y con degradado lateral.


VERSION BETA v0.22
- La transición de fase ahora cambia de color según el jugador/energía activa.
- Se refinó la transición para evitar el parpadeo previo y mantener el degradado lateral sin borde.
- Las fichas ahora usan un hitbox pequeño en la base: el sprite completo ya no bloquea clicks sobre cartas/casillas detrás.
- Se mantiene el depth sorting visual por fila, pero la interacción ya no queda atrapada por sprites largos superpuestos.


VERSION BETA v0.23
- Se rediseñó la transición de turno/fase con estilo de overlay cinematográfico.
- Fondo negro translúcido centrado, sin borde.
- Laterales con degradado a transparente.
- Texto blanco grande con glow del color del elemento/jugador activo.
- Mantiene la referencia de posición en el centro de la arena.


VERSION BETA v0.24
- Se redujo el tamaño del texto de la transición.
- La transición ahora usa solo textos cortos: INICIA EL COMBATE, EXTRACCIÓN, KASTEO, RESOLUCIÓN, TERMINA EL TURNO y JUGADOR X.
- Se agregó secuencia de transiciones encadenadas al inicio y al cambio de jugador.
- Se eliminó el formato cargado tipo “Jugador X · Fase de ...” en la transición grande.


VERSION BETA v0.25
- Se quitó la pausa entre avisos encadenados del sistema de transición.
- La transición ya no se queda detenida en el centro: ahora cruza de izquierda a derecha de forma continua.
- Se mantuvo el estilo cinematográfico con degradado lateral y glow del color activo.


VERSION BETA v0.26
- La ficha en zona de Kasteo ahora ejecuta primero Drop-in y luego Landing Impact.
- El hover cruzado/palpitación queda bloqueado durante la caída inicial.
- La palpitación solo se activa después de terminar la animación de caída.
- Se separó la animación de nacimiento de la animación de interacción para evitar reinicios visuales raros.


VERSION BETA v0.27
- El Spellbook del jugador local/J1 permanece visible en todo momento, incluso durante el turno del enemigo.
- La vista de carta sigue funcionando desde cualquier fase.
- El botón Kastear queda bloqueado cuando no es turno del jugador local, aunque el Spellbook siga visible.
- Los elementos visibles se mantienen como los recursos del jugador local.
- Se prepara el flujo para futuras pruebas host/invitado sin esconder el Spellbook.


VERSION BETA v0.29
- Calibrada la extracción con la textura enviada por el usuario.
- La carta de extracción ahora nace encima de la fuente inferior izquierda para J1.
- Para J2 queda calibrada encima de la fuente superior derecha.
- Corregidas coordenadas locales del layer de extracción: ya no usa viewport directo dentro del board.
- Los orbes ahora viajan correctamente hacia la barra vertical izquierda.
- La carta de elemento conserva la proporción de la skin usando --card-skin-aspect.


VERSION BETA v0.30
- La extracción ya no usa porcentajes independientes.
- Ahora cada jugador tiene una baraja de elementos simulada de 34 cartas:
  - 25 cartas x1
  - 5 cartas x2
  - 3 cartas x3
  - 1 carta x4
- La baraja se baraja aleatoriamente al iniciar.
- En cada fase de Extracción se roban 2 cartas de esa baraja.
- Si se agota la baraja de elementos, se reconstruye y se vuelve a barajar.
- Esto hace que los x3/x4 aparezcan con rareza real de composición de mazo, no por tirada suelta.


VERSION BETA v0.30A
- Base restaurada desde v0.30.
- Se agregó únicamente el sistema visual de fuente mágica.
- Controles CSS disponibles en :root para tamaño, posición, frecuencia, velocidad, distancia y escala de partículas.
- Cada fuente toma el color del elemento activo mediante --fountain-color.


VERSION BETA v0.30C
- Se usó el CSS entregado por el usuario como style.css.
- Fuente rival usa siempre el color de su propio elemento.
- Durante extracción: partículas aceleradas + brillo temporal de generación, luego vuelve a la normalidad.
- Mantiene la baraja de elementos simulada (25 x1, 5 x2, 3 x3, 1 x4).


VERSION BETA v0.30D
- J1 usa extracción genérica de Oscuridad.
- J2/rival usa extracción genérica de Fuego.
- Se agregaron assets: element-fire-x1/x2/x3/x4 y element-card-bg-fire.
- La fuente rival ahora sí puede leerse visualmente como Fuego.


VERSION BETA v0.30E
- La fase de Extracción avanza automáticamente a Kasteo cuando las cartas extraídas son elementos normales.
- La lógica queda preparada para detenerse si más adelante una carta de fuente no-elemento aparece en la extracción.
- Mantiene J1 Oscuridad y J2 Fuego genérico.


VERSION BETA v0.30F
- Se corrigió la animación de entrada en zona de Kasteo para que no se reinicie al hacer render/click en Kaster.
- La intro ahora usa introStarted/introEndsAt y un finalizador estable.
- Al terminar la intro se hace renderAll para activar hover cruzado entre ficha de Kasteo y carta de respawn.
- Se corrigió el bloqueo visual de .intro-locked en marcador de respawn después de terminar la intro.


VERSION BETA v0.30G
- Cuando termina el turno y cambia de jugador, la vista de la arena vuelve automáticamente a zoom 1 y pan 0.
- Esto permite que la extracción del nuevo jugador se vea completa en vista panorámica.
- El aviso de fase intenta salir sobre la línea central; si queda fuera del viewport por zoom/pan, se ancla arriba de la pantalla.


VERSION BETA v0.30H
- Kasters en E5 relativo por lado.
- MOV 10 temporal para Kaster e invocación.
- 3 Naito Sutoka para ambos jugadores.
- Guardianes de ambos lados con Resistencia 5.
- View al clicar Kaster, invocación o Guardián fuera de selección de movimiento.
- Nuevos stats en view: MOV, Kasteo y Restauración.
- Daño flotante rojo.
- Kaster recibe 1 daño por fase si está en zona enemiga.
- Kaster no puede kastear desde zona enemiga.
- Prototipo de ataque a zona de riesgo: si una invocación llega a la fila de riesgo enemiga, extrae 1 carta extra y entra en restauración.


VERSION BETA v0.30I
- Ajustado badge de resistencia de Guardianes para usar la misma coherencia visual del reloj de arena: icono separado + número de esquina.
- Escudo de ladrillos blanco plano, vectorizado por CSS.


VERSION v1.01
- Resistencia de Guardianes reducida visualmente a la mitad.
- Las invocaciones que entran durante Resolución reciben movesLeft inmediatamente para poder moverse.
- Hitbox de invocaciones ampliado para seleccionar movimiento con más facilidad.
- Botón i del HUD de elementos ahora abre panel de versión/parche.


VERSION BETA v4.0
- IA básica para J2.
- J2 avanza solo Kasteo y Resolución.
- J2 intenta kastear Naito si tiene recursos y espacio.
- J2 mueve unidades hacia amenazas, Kaster rival o zona de riesgo.
- Botón Siguiente Fase bloqueado durante turno IA.


VERSION BETA v4.1
- Target & Attack Core.
- Las invocaciones tienen alcance y perfil de ataque.
- Click en objetivo enemigo en rango muestra Info / Seleccionar.
- Seleccionar objetivo despliega acciones junto a la invocación: Dañar / Cancelar.
- Daño a Kaster, Guardián e invocaciones.
- Zona de riesgo se puede seleccionar como objetivo y extrae 1 carta extra.
- Al morir, la invocación sale de arena y vuelve al slot original del Spellbook.
- IA rival intenta atacar antes y después de moverse.


VERSION BETA v4.2
- Corrección de selección de objetivo y daño manual.
- Se agrega alcance/tipo de ataque al view grande clasificado por Daño, Vida, Kasteo/Restauración y Movilidad.
- Naito tiene ataque cuerpo a cuerpo, alcance 1, daño 3.
- IA intenta atacar antes/después de moverse.


VERSION BETA v4.3
- Naito Sutoka baja a daño 1 para pruebas de combate sostenido.
- El Kaster tiene defensa 2 y el view muestra DEFENSA en la fila de VIDA.
- Cuando J2 ataca el Kaster de J1, se abre menú Defender / Contraatacar.
- Si el Kaster tiene cartas en Kasteo, no puede reaccionar y recibe el daño completo.
- Se agregan animaciones visuales de restauración y retorno al Spellbook.


VERSION BETA v4.4
- Movimiento obligatorio en Resolución: no se puede terminar fase si una ficha activa aún puede moverse.
- Los ataques contra invocaciones ahora entran en combate sostenido.
- El menú usa Combatir en vez de Dañar/Seleccionar para iniciar combate.
- Al entrar o resolver combate aparece COMBATIENDO antes del daño.
- En combate sostenido, golpea primero la invocación del jugador activo y luego responde la rival si sigue viva.


VERSION BETA v4.5
- Se normalizó la velocidad de invocaciones a MOV 3.
- El Kaster queda con MOV 2 para que no se sienta tan lento, pero tampoco atraviese media arena en una acción.
- Mantiene combate sostenido y movimiento obligatorio de v4.4.


VERSION BETA v4.6
- Corrección real de velocidad: invocaciones MOV 3.
- Corrección real de velocidad: Kaster MOV 2.
- Se reemplazó el TEST_MOVE_SPEED viejo que seguía en 10.


VERSION BETA v4.7
- Movimiento obligatorio solo para invocaciones. El Kaster ya no bloquea el cierre de Resolución.
- Invocaciones muestran indicadores de daño y vida en arena con iconos blancos vectoriales.
- Números/círculos de resistencia, daño y vida agrandados para mejor lectura.


VERSION BETA v4.8
- Los badges de invocación ahora quedan abajo de la ficha, uno al lado del otro.
- Se mantiene la misma coherencia visual que el badge de resistencia de Guardianes: icono principal + número superpuesto.
- No se tocó lógica de combate ni movimiento en este parche.


VERSION BETA v4.9
- Iconos de guardianes/invocaciones quedan sin contenedor visual.
- El contenedor circular queda solo en los números.
- Agregados controles CSS para tamaño y posición de iconos/números de resistencia, daño y vida.


VERSION BETA v5.0
- Agregado botón CSS en el HUD de elementos.
- Permite refrescar style.css sin F5 y sin reiniciar estado/partida.
- Implementado con cache-buster sobre el link #mainStylesheet.
