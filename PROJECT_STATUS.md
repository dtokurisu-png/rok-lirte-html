# R.O.K. Lite — Estado del proyecto
Actualizado: 2026-11-02. Fuente de verdad para retomar el trabajo.

## Hito validado por el usuario (2026-11-02)
El usuario probó R.O.K. Lite publicado y confirmó que la secuencia original de Aventura → preparación → VS → 3-2-1 → arena 3D funciona. Validación manual reportada; no equivale a prueba automatizada, ni certifica backend conectado o vuelta desde arena.

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
- [x] El usuario probó en navegador el recorrido original hasta la arena y confirmó que funciona (reporte manual del 2026-11-02).
- [ ] Probar dimensiones móviles, carga de recursos, botón Volver y regresiones.
- [ ] Confirmar aparición de caster aliado/enemigo y arte correcto, sin pantalla técnica intermedia.
- [ ] Conectar lógica definitiva del motor tras aprobar el flujo; no adelantarse.

**IMPORTANTE:** código presente ≠ transición comprobada en ejecución. No dar por finalizada la fase antes de una prueba de extremo a extremo.

## Estado técnico verificado en código (2026-11-02)
- Backend: `nueva-version/backend/src/index.js` (Node + Socket.IO, protocolo, validación, tick 100 ms), `src/sesiones.js` (sesiones/acciones), `nueva-version/motor/simulacion.js` (lógica autoritativa).
- Frontend: `nueva-version/frontend/js/network.js` (conexión/protocolo), `js/scene/renderer.js` (representación 3D), `js/scene/modelos.js` (GLB y elección de clips). El renderizador no calcula daño ni victoria.
- El frontend `arena-entrada.js` actualmente no inicia pelea real sin `backendUrl`, ni incorpora aún el Spellbook original. Casters aún son placeholders.

## Próximo paso
Mientras el usuario prepara los modelos y animaciones de Kiara/Lioren en el tester, revisar y preparar el contrato de entrada a sesión, datos de Spellbook y despliegue/backend, sin modificar la secuencia original validada. Posteriormente integrar modelos/clips y verificar sincronización real. La revisión completa de `game.js` queda como tarea de auditoría, pero NO bloquea ya la navegación confirmada por el usuario.

## Cómo retomar otra conversación
1. Leer este archivo.
2. Leer `ARCHITECTURE.md`, `INTEGRATION_ROADMAP.md` y `DECISIONS.md`.
3. Revisar `CHANGELOG_DEV.md` y `nueva-version/docs/ETAPA_4_FLUJO.md`.
4. Contrastar la documentación con el código actual antes de modificarlo; registrar los resultados y actualizar estos archivos con cada cambio.

## Trabajo paralelo de backend (2026-11-02, fase de pruebas)
- Se añadió `nueva-version/tests/integracion-sesiones.test.js`: comprueba arena 9×18, avance continuo de 100 ms, invocación, rechazo de campos de daño enviados por cliente, autoridad de sesiones por dueño, idempotencia de acciones y emisión de snapshots.
- Pruebas **escritas pero NO ejecutadas en este entorno**; falta instalar dependencias y correr `npm test` desde `nueva-version/backend`. No se han tocado la navegación, el renderizador ni las animaciones.
- Los IDs del Spellbook original sí llegan al puente, pero el servidor actualmente recibe solo `encounterId`; el catálogo de invocaciones es de prueba. La adaptación real requiere un mapeo explícito de IDs y reglas antes de habilitar mecánicas.
- Estado de la integración de modelos: usuario preparando Kiara y Lioren con clips adicionales. No asumir recursos terminados.
