# Registro de desarrollo — R.O.K. Lite

## 2026-11-02 — Auditoría e inicio de documentación persistente
**Acción:** revisión de archivos del repositorio principal y creación de documentos de continuidad.

**Inspeccionado:** `README.md`, `nueva-version/docs/ETAPA_4_FLUJO.md`, `nueva-version/frontend/arena.html`, `nueva-version/frontend/index.html`, `nueva-version/frontend/js/adventure-bridge.js`, `nueva-version/frontend/js/arena-entrada.js`, `nueva-version/frontend/js/scene/arena.js`, `nueva-version/frontend/config.json` y `nueva-version/frontend/css/adventure-bridge.css`.

**Hallazgos:**
- Ya existe un puente que abre la arena desde `ROK_ADVENTURE_START_BATTLE`.
- Ya existe una arena visual basada en el tablero del tester, con geometría 9×18. Es la geometría **correcta** solicitada por el usuario.
- La URL del backend está vacía y la vista es solo visual sin él.
- La documentación previa describe la transición tras el VS, pero todavía falta prueba de extremo a extremo.
- Intentos de leer `game.js` e `index.html` desde el conector devolvieron contenido vacío, por lo que su implementación completa **no está verificada**.

**Modificaciones de gameplay:** ninguna en esta entrada; no es responsable cambiar el puente sin inspeccionar la llamada original ni probar su recorrido.

**Pruebas:** revisión estática parcial. **NO** realizada prueba funcional desde el menú.

**Próxima intervención:** inspeccionar los archivos originales completos por un método fiable, comprobar y corregir el enlace únicamente donde haga falta; probar recorrido total. Registrar aquí rutas, resultados, commit y pendientes.


## 2026-11-02 — Validación manual e inspección de arquitectura
**Confirmación del usuario:** la secuencia completa Aventura → VS → 3-2-1 → tablero 3D se reprodujo correctamente en la versión publicada. No se han realizado pruebas automatizadas de interfaz ni del botón Volver.

**Inspección técnica:** `nueva-version/backend/src/index.js`, `src/sesiones.js`, `nueva-version/motor/simulacion.js`, `nueva-version/compartido/protocolo.js`, `nueva-version/frontend/js/network.js`, `js/scene/renderer.js` y `js/scene/modelos.js`. Se confirmó separación de autoridad lógica y visual: backend con tick continuo de 100 ms; frontend escucha snapshots y eventos, carga GLB y elige clips por estado.

**Limitaciones reales:** backend no desplegado (`frontend/config.json` sin URL), sesión real y Spellbook original no conectados, casters provisionales y clips definitivos pendientes. Sin cambios de código de juego en esta entrada. Próximo foco: integrar datos reales de combate y despliegue mientras se preparan modelos y animaciones.


## 2026-11-02 — Pruebas de regresión del nuevo backend (trabajo paralelo)
**Nuevo archivo:** `nueva-version/tests/integracion-sesiones.test.js`.
**Cobertura escrita:** tablero lógico 9×18, tick continuo, invocaciones, esquema del protocolo que rechaza daño del cliente, propiedad/aislamiento de sesiones, deduplicación de acciones y sincronización del servidor.
**Cambios en comportamiento del juego:** ninguno. Se preservan el recorrido Aventura → VS → 3-2-1, el tablero y el código del tester.
**Ejecución:** no ejecutada en este entorno (acceso a GitHub mediante conector, sin clonado local por red); pendiente correr `cd nueva-version/backend && npm test` en un entorno con Node 20+.
**Bloqueador de integración de Spellbook:** las IDs de cartas heredadas aún no están mapeadas al catálogo del motor y el backend solamente recibe el identificador de encuentro. No activar cartas a ciegas.


## 2026-11-02 — Puente del Spellbook antiguo con HUD e invocaciones (integración de código)
- El puente `frontend/js/adventure-bridge.js` conserva IDs (incluidas copias) y extrae nombres e imágenes desde `CARD_LIBRARY` original sin modificar `game.js`.
- La nueva arena incluye `frontend/js/ui/spellbook-hud.js` y su banda visual responsive en `frontend/css/arena-entrada.css`; muestra el mazo real, estado de conexión y botones de invocación.
- `frontend/js/arena-entrada.js` envía el mazo al crear la sesión y transmite las pulsaciones por `summonUnit`. No aplica efectos ni daños en frontend.
- El backend filtra solicitudes por cartas equipadas **y explícitamente adaptadas**, evitando el uso accidental de prototipos como si fueran cartas antiguas. La pantalla técnica de prototipos conserva una ruta separada.
- Se ha adaptado únicamente **`kiaraFaroleraUmbral` (Farolera del Umbral)** como ataque básico: PV 2, daño 2, alcance 3 desde `CARD_LIBRARY`; velocidad/cadencia/proyectil aún provisionales del tester. El poder `Farol Enlazado`, costes, Spellbooks completos y sus reglas quedan PENDIENTES.
- Se actualizaron validadores para aceptar los IDs canónicos de cartas antiguas, incluidos identificadores con mayúsculas.
- **Verificación:** revisión estática de archivos y tests ajustados; NO ejecutados en Node ni en navegador todavía. `frontend/config.json` tiene `backendUrl` vacío. El HUD puede mostrar el mazo, pero NO puede invocar en la publicación sin servidor desplegado.
- El Spellbook de Aventura original sigue bloqueado para edición hasta la primera victoria contra Kiara y puede estar inicialmente vacío. No se alteró esta progresión.
- **Seguridad pendiente:** el servidor recibe IDs seleccionados desde el cliente, pero todavía no valida desbloqueos/propiedad contra almacenamiento servidor; por tanto es un prototipo, no autorización definitiva para PvP/progresión.
- Próximos pasos: ejecutar pruebas, desplegar backend compatible, confirmar HUD real y mapeo autoritativo de desbloqueos; después continuar reglas/cartas y diseño en tester.

## Norma de futuras entradas
Fecha · objetivo · archivos editados · comportamiento antes/después · pruebas realizadas y resultado · riesgos/pendientes · commit.
