# Etapa 4 — Integración con el recorrido original de Aventura

La secuencia antigua se **reutiliza íntegra**. No se rediseñaron el menú, regiones, selección de Kaster, preparación, selección del Spellbook, presentación VS ni cuenta atrás 3‑2‑1.

## Recorrido del jugador

1. En la página principal de R.O.K., entrar en **Aventura**.
2. Seleccionar la región **Agua**.
3. Seleccionar a **Kiara**.
4. Confirmar la preparación de combate existente, con Lioren y las cartas disponibles.
5. Pulsar **Combatir**. La introducción VS original muestra ambos Kasters, cartas destacadas y cuenta 3‑2‑1.
6. El punto original `window.ROK_ADVENTURE_START_BATTLE(payload)` abre una arena 3D a pantalla completa, con nombres y arena del encuentro seleccionado.
7. El botón **Volver** devuelve a la pantalla original de preparación, sin reiniciar progreso.

## Archivos

- `index.html`: solo se añadió **una etiqueta script** al final, cargando el puente después de `game.js` y Firebase.
- `game.js`: **no se modificó**.
- `frontend/js/adventure-bridge.js`: conecta el evento de carga con la función existente; precarga la página 3D durante VS.
- `frontend/css/adventure-bridge.css`: aislador visual a pantalla completa para no interferir con el layout original.
- `frontend/arena.html`: página sencilla de arena, sin otro menú de Aventura.
- `frontend/js/arena-entrada.js`: recibe el encuentro elegido, carga vista 3D, retorna a preparación y establece conexión al backend si hay URL.
- `frontend/css/arena-entrada.css`: controles mínimos de cámara y regreso.
- `frontend/config.json`: backendUrl opcional, vacío hasta desplegar servidor.
- `frontend/js/scene/arena.js`: admite textura real de `payload.arena.image` manteniendo geometría fija.

## Límites verificables

El backend aún **no** tiene una URL pública configurada. La navegación entra en la arena 3D real de Three.js, pero sin fingir una sesión de combate ni aplicar daño desde el navegador.

Cuando `backendUrl` esté configurada, el iframe inicia la conexión **durante el VS** y crea la sesión al recibir el payload definitivo. De momento, el servidor prototipo solo reconoce el encuentro `enigma-apprentice` de Kiara y aún no consume las cartas del Spellbook original. Los IDs se transportan como datos de entrada, no se activan mecánicas sin adaptar.

La vista de arena muestra representaciones provisionales de los Kasters. Los modelos definitivos, HUD flotante y combate completo se realizarán en siguientes etapas.

## Seguridad

El puente solo acepta mensajes desde el iframe **del mismo origen** y comprueba `event.source`. La URL del arte se valida a origen local antes de pasar al visualizador. El servidor sigue siendo autoritativo para combate.
