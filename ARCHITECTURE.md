# Arquitectura — R.O.K. Lite + motor nuevo 3D/2.5D

## Repositorios y responsabilidades
- **Juego principal:** `dtokurisu-png/rok-lirte-html`, entrada original `/index.html`. Es propietario de menú, Aventura, elección de región y rival, Spellbook, preparación, presentación VS y cuenta 3-2-1.
- **Tester:** `dtokurisu-png/rok-3d-test`. Banco de desarrollo de modelos, animaciones, escenarios, cámaras y geometría; NO es la navegación del juego final.
- **Nuevo combate:** dentro de `nueva-version/` del juego principal, con vista Three.js y backend autoritativo previsto. Se integra después de la introducción original, no antes.

## Contrato actual del puente (por inspección)
1. El menú original ejecuta su propia preparación y VS.
2. Al concluir la introducción original, se espera que `game.js` llame `window.ROK_ADVENTURE_START_BATTLE(payload)`. **La llamada concreta aún debe verificarse en `game.js`.**
3. `adventure-bridge.js` valida `mode: adventure` y `encounterId`, transporta nombre de casters, arena y IDs de cartas, y abre la vista iframe `arena.html`.
4. Mensajes same-origin: `rok:arena:ping`, `ready`, `preload`, `start`, `displayed`, `reset`, `exit`; el puente comprueba origen y ventana.
5. `arena-entrada.js` crea `Arena3D` y aplica selección, nombres y arte. El botón Volver cierra el overlay hacia preparación.
6. `scene/arena.js` genera el tablero 9×18 y sus controles visuales. **No reemplazar esta geometría por otro escenario.**

## Separación de responsabilidades
- **Frontend original:** selección, preparación, animación de presentación, navegación.
- **Puente:** traducción de payload, precarga, visibilidad y retorno. Sin reglas de daño ni invocaciones.
- **Frontend 3D:** render, cámara, modelos, animaciones, HUD y efectos; consume estado.
- **Backend de combate:** sesión, tiempo, IA, posiciones, colisiones/objetivos, daños, muerte, victoria; única autoridad de estado.
- **Tester:** laboratorio y creador de recursos; sus experimentos no deben sobreescribir el juego sin integración deliberada.

## Límites presentes
`config.json` no contiene backend público. El escenario sin backend es **vista previa**, no combate.
La adaptación de cartas/Spellbook al motor continuo todavía está pendiente. No inventar su activación.
La vista actual usa casters provisionales. Las animaciones y modelos definitivos requieren integración.

## Archivos que revisar para cambios en el enlace
`index.html`, `game.js`, `nueva-version/frontend/js/adventure-bridge.js`, `nueva-version/frontend/arena.html`, `nueva-version/frontend/js/arena-entrada.js`, `nueva-version/frontend/js/scene/arena.js`, `nueva-version/frontend/js/scene/renderer.js`, `nueva-version/frontend/config.json`.
