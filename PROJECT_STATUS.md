# R.O.K. Lite — Estado del proyecto
Actualizado: 2026-11-02. Fuente de verdad para retomar el trabajo.

## Objetivo inmediato (fase de integración)
Validar el recorrido existente de R.O.K. Lite: menú principal → Aventura → región Agua → Kiara → preparación de Lioren/Spellbook → botón Combatir → VS original, cartas destacadas, cuenta 3-2-1 y «Combatir» → tablero 3D/2.5D con la geometría del tester.
No reconstruir menús ni el sistema de preparación. No sustituir la geometría del tester.

## Evidencia de implementación actual
- `index.html` es la entrada del juego original (según README); `game.js` conserva navegación y presentación (según documentación).
- `nueva-version/frontend/js/adventure-bridge.js` registra `window.ROK_ADVENTURE_START_BATTLE(payload)`, prepara un iframe en `nueva-version/frontend/arena.html` y muestra su overlay cuando se recibe el encuentro.
- `nueva-version/frontend/js/arena-entrada.js` recibe datos del encuentro y presenta la arena con Three.js.
- `nueva-version/frontend/js/scene/arena.js` define la geometría del tablero de pruebas de 9 columnas × 18 filas. **Esta geometría es deseada y debe conservarse.**
- `nueva-version/frontend/config.json` tiene `backendUrl` vacío: no existe una sesión de combate online verificable sin desplegar/configurar el servidor.

## Estado de verificación
- [x] Inspeccionados README, documento ETAPA_4_FLUJO, puente, entrada de arena, geometría y configuración.
- [x] Confirmado en código que el puente tiene entrada de batalla y mensajería al iframe.
- [ ] Verificar en el código completo de `game.js` el momento exacto en que invoca el punto de entrada: el conector no devolvió contenido para ese archivo grande en esta revisión.
- [ ] Probar desde el `index.html` real, en navegador, todo el recorrido hasta la arena; comprobar dimensiones móviles, carga de recursos y retorno.
- [ ] Confirmar aparición de caster aliado/enemigo y arte correcto, sin pantalla técnica intermedia.
- [ ] Conectar lógica definitiva del motor tras aprobar el flujo; no adelantarse.

**IMPORTANTE:** código presente ≠ transición comprobada en ejecución. No dar por finalizada la fase antes de una prueba de extremo a extremo.

## Próximo paso único
Inspeccionar la invocación en `game.js` y efectuar prueba real desde el menú original hasta el tablero; reparar solamente el puente si falla. Después pasar a lógica de combate nueva.

## Cómo retomar otra conversación
1. Leer este archivo.
2. Leer `ARCHITECTURE.md`, `INTEGRATION_ROADMAP.md` y `DECISIONS.md`.
3. Revisar `CHANGELOG_DEV.md` y `nueva-version/docs/ETAPA_4_FLUJO.md`.
4. Contrastar la documentación con el código actual antes de modificarlo; registrar los resultados y actualizar estos archivos con cada cambio.
