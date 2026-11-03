# Etapa 3 — Primer renderizador 3D independiente

## Qué se ha integrado

El renderer del tester fue estudiado y se reutilizó su organización espacial: 9 columnas x 18 filas, casillas con centros x = col-4 y z = row-8.5; fondo 2D proyectado en suelo tridimensional, borde, marcadores y cámara OrbitControls.

En `frontend/js/scene/`:
- `arena.js`: malla visual del campo, sin movimiento lógico.
- `modelos.js`: carga asincrónica, clonación de esqueleto GLB, mezclador de animación y modelos provisionales.
- `renderer.js`: escena Three.js, cámara, interpolación visual, etiquetas de vida y reacciones a eventos.

El frontend solo recibe resultados del backend `SYNC` y ejecuta visualmente los eventos:
`unit.summoned`, `unit.moved` (posición de snapshot), `attack.preparing`,
`projectile.launched`, `unit.hit`, `unit.defeated`, `combat.finished`.

**NO se ha trasladado el `updateDuel()` del tester.** Nunca se calcula daño, colisión de ataques, cadencias o victoria en Three.js.

## Modelos y tamaño

- **Farolera**: GLB `chiara_idle.glb`, ~4,9 MB. Se intenta cargar primero desde `frontend/recursos/modelos-3d/farolera/`. Una tarea automática de GitHub lo copia del tester a esta misma carpeta. Hasta que el job termine, se permite cargar temporalmente desde GitHub Pages del tester.
- **Arquera del Desierto**: GLB ~31,5 MB. Se deja como descarga opcional con botón, **solo para escritorio**. En móvil se muestra una representación geométrica provisional.
- **Kiara y Lioren**: aún no hay modelos 3D definitivos; se muestran figuras provisionales con colores diferentes.
- **Animaciones**: el GLB de Farolera incluye Idle; el resto de los Mixamo FBX permanece en el tester. La capa visual admite clips `walk`, `attack`, `death` cuando estén incorporados, pero esos clips **todavía no se han importado**. Mientras tanto, desplazamiento y reacciones tienen interpolaciones y FX provisionales.

## Interfaz

La arena 3D se visualiza **sin backend**, para inspeccionar malla, modelos y cámara. Es una **vista previa estática**, no un combate simulado.

Cuando se conecte el servidor, la escena representará las posiciones, vidas, invocaciones y eventos emitidos por él. La interfaz mantiene controles de invocación, pero nunca ataques manuales.

La cámara permite orbit, zoom y panorámica con límites de distancia. El dibujo ajusta el pixel ratio y desactiva antialias en móviles.

## Estado de publicación

GitHub Pages únicamente publica HTML, CSS, JavaScript y modelos. **No ejecuta el backend Node.js**. El combate en tiempo real sigue requiriendo desplegar el servidor de `nueva-version/backend/` en hosting compatible con Socket.IO.

La integración de animaciones completas, FX por habilidad, modelos definitivos de Kasters y los ajustes de movimiento de Kasters están pendientes. El juego original en la raíz permanece intacto.
