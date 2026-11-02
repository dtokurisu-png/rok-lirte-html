# R.O.K. nueva versión — mismo repositorio

Motor separado, combate continuo **sin turnos** y escena 3D nueva, dentro de `rok-lirte-html/nueva-version/`.

| Carpeta | Uso |
| --- | --- |
| `frontend/` | Página de Aventura, renderizador Three.js y HUD de prueba |
| `frontend/js/scene/` | Escenario, cámara, GLB, interpolación y FX; **solo visual** |
| `frontend/recursos/modelos-3d/` | GLB locales y catálogo de recursos |
| `frontend/recursos/animaciones/` | Espacio para clips Mixamo optimizados |
| `frontend/recursos/cartas/` | Imágenes de cartas, tokens y marcos |
| `frontend/recursos/escenarios/` | Mapas e imágenes de arenas |
| `frontend/recursos/efectos/` | FX gráficos |
| `frontend/recursos/interfaz/` | Iconos, menús y HUD |
| `frontend/recursos/mecanicas/` | Iconografía de factores y habilidades |
| `backend/` | Servidor Socket.IO con reloj autoritativo |
| `motor/` | Objetivos, duelos melee, movimiento y ataque continuo |
| `mecanicas/` | Registros para futuros poderes, habilidades, factores |
| `datos/json/` | Definiciones de Kasters, encuentros e invocaciones |
| `compartido/` | Protocolo público v3 |
| `tests/` | Pruebas automáticas Node.js |
| `docs/` | Documentación, límites y fases |

## Estado

- Etapa 1: estructura y archivo del viejo R.O.K. Lite.
- Etapa 2: motor continuo autoritativo de prueba, sin turnos, con relojes individuales.
- **Etapa 3: arena 3D con cámara y GLB, conectada a los estados/eventos del servidor**. La vista previa se abre desde GitHub Pages incluso sin backend.
- Pendiente: modelos definitivos Kiara/Lioren, clips completos de animación, HUD flotante final, cartas, poderes, factores, optimización final y PvP.

Detalles y limitaciones: `docs/ETAPA_3.md`.

**La vieja versión se conserva en `version-anterior/` y sigue funcionando en la raíz.**

Importante: para jugar el combate real en internet necesitamos desplegar el servidor Node.js. GitHub Pages no ejecuta el backend.
