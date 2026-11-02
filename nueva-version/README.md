# Nueva versión de R.O.K. (mismo repositorio)

No se creó otro repositorio ni se reemplazó `game.js`. El juego antiguo permanece en la raíz y archivado en `version-anterior/`.

## Organización

| Carpeta | Responsabilidad |
| --- | --- |
| `frontend/` | Interfaz web, HUD, futura escena Three.js y recursos gráficos |
| `frontend/js/` | Red y presentación, **sin reglas de combate** |
| `frontend/recursos/cartas/` | Arte de cartas, tokens y marcos |
| `frontend/recursos/escenarios/` | Fondos y arenas |
| `frontend/recursos/personajes/` | Kasters e ilustraciones |
| `frontend/recursos/modelos-3d/` | GLB optimizados (pendientes de migración) |
| `frontend/recursos/animaciones/` | Clips de animación (pendientes de migración) |
| `frontend/recursos/efectos/` | Recursos visuales de hechizos y efectos |
| `frontend/recursos/mecanicas/` | Iconos de poderes, factores y cualidades |
| `frontend/recursos/interfaz/` | HUD, menús e indicadores |
| `backend/` | Servidor Node.js y sesiones autoritativas |
| `motor/` | Estado de combate, turnos, movimiento, daño, ataque, IA |
| `mecanicas/` | Registros separados de poderes, factores y habilidades (aún vacíos) |
| `datos/json/` | Definiciones de Kasters, cartas y encuentros |
| `compartido/` | Protocolo v2 entre frontend y backend |
| `tests/` | Pruebas automatizadas Node.js |
| `docs/` | Arquitectura y plan |

## Etapa 2

Motor prototipo por turnos implementado y conectado a una cuadrícula de prueba del frontend.
**No es todavía el combate final de R.O.K.** Consulta `docs/ETAPA_2.md` para las reglas provisionales y límites.

## Publicación

El frontend puede abrirse desde la ruta de GitHub Pages `/nueva-version/frontend/`.
El backend necesita desplegarse en alojamiento Node.js; **GitHub Pages no puede ejecutar un servidor**. Hasta desplegarlo, los botones de combate permanecen desconectados. El nuevo juego no está listo para PvP.

La raíz `index.html`, `game.js` y `assets/` se mantienen para no romper el sitio antiguo. Los 399 recursos categorizados están en `nueva-version/frontend/recursos/`.
