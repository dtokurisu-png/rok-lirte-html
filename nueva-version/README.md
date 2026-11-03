# Nueva arquitectura de R.O.K. — dentro del mismo repositorio

El sistema de **Aventura reutiliza la navegación original** del R.O.K. Lite: selección de región y Kaster, preparación, Spellbook, VS y cuenta atrás. La página inicial sigue siendo `/index.html`.

El puente mínimo `frontend/js/adventure-bridge.js` responde a la función preexistente `ROK_ADVENTURE_START_BATTLE(payload)`. Tras el VS abre `frontend/arena.html`, que presenta la escena 3D y muestra el encuentro/arena seleccionados. Volver regresa a la misma preparación sin tocar progreso.

## Organización técnica

- `frontend/js/scene/`: cámara, escenario, GLB y efectos **solo visuales**.
- `frontend/recursos/`: imágenes, modelos 3D y futuras animaciones organizadas.
- `frontend/arena.html`: vista de combate que usa el flujo original.
- `frontend/index.html`: **banco de pruebas técnico heredado**, no entrada de juego.
- `backend/`: Node.js con sesiones autoritativas.
- `motor/`: combate automático continuo, sin turnos.
- `mecanicas/`: registros futuros de factores, poderes y habilidades.
- `datos/json/`: definición de encuentros, cartas y Kasters.
- `compartido/`: contrato de comunicación Socket.IO.
- `tests/`: pruebas automatizadas del motor y de la navegación.

**Actualmente el backend público no está configurado.** Al terminar el VS podrás ver la arena 3D, pero el combate seguirá pendiente. No se ejecutan reglas en el navegador. Consulta `docs/ETAPA_4_FLUJO.md`.
