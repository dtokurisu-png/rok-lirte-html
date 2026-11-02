# R.O.K. nueva versión — mismo repositorio

La nueva implementación **no usa turnos**. Está separada del juego clásico en `version-anterior/`, mientras se conserva `game.js` de raíz para que R.O.K. Lite siga funcionando.

## Carpetas

- `frontend/` — interfaz de pruebas y recursos clasificados: `cartas/`, `escenarios/`, `personajes/`, `modelos-3d/`, `animaciones/`, `mecanicas/` y `efectos/`.
- `backend/` — servidor Node.js con Socket.IO, sesiones y reloj maestro.
- `motor/` — simulación continua, selección de objetivos, movimiento y combate autónomo.
- `mecanicas/` — módulos para futuras habilidades, factores y poderes reutilizables.
- `datos/json/` — cartas, Kasters y prototipos de invocación separados.
- `compartido/` — protocolo público, solo datos y comandos permitidos.
- `tests/` — validaciones automáticas.
- `docs/` — arquitectura, auditoría y plan de implementación.

## Estado

Etapa 2: el jugador solo **invoca**. Sus unidades se desplazan solas, eligen enemigo, cargan ataques en relojes individuales y combaten con 3 modos: `melee`, `range`, `distance`. Kiara invoca modelos de prueba automáticamente.

La interfaz web es un tablero **diagnóstico**, no el escenario 3D definitivo. La transferencia visual del tester es la próxima etapa. No se han integrado cartas reales ni poderes, y las estadísticas siguen siendo provisionales.

GitHub Pages no ejecuta el backend. El proyecto incluye el servidor, pero aún es necesario alojarlo para probar el combate conectado por internet. **No necesitas instalar archivos locales para ver la web.**
