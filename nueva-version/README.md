# R.O.K. — nueva arquitectura, mismo repositorio

## Dónde está cada cosa

| Carpeta | Función |
| --- | --- |
| `frontend/` | Sitio web visible desde GitHub Pages |
| `frontend/js/` | JavaScript del cliente, sin reglas de combate |
| `frontend/css/` | Estilos de interfaz |
| `frontend/recursos/cartas/` | Ilustraciones, fichas y marcos de cartas |
| `frontend/recursos/escenarios/` | Mapas y arenas |
| `frontend/recursos/personajes/` | Artes y referencias de Kasters |
| `frontend/recursos/modelos-3d/` | Modelos GLB, aún pendientes de optimización/importación |
| `frontend/recursos/animaciones/` | Animaciones y manifiestos, aún pendientes |
| `frontend/recursos/efectos/` | Ilustraciones para efectos visuales |
| `frontend/recursos/mecanicas/` | Iconos de factores, habilidades, cualidades, armas |
| `frontend/recursos/interfaz/` | Menús, HUD e indicadores |
| `frontend/recursos/tienda/` | Artes de tienda |
| `frontend/recursos/otros/` | Recursos sin clasificación semántica definitiva |
| `backend/` | Servidor Node.js / Socket.IO, sin lógica del navegador |
| `motor/` | Estado, reglas generales y, en el futuro, resolución del combate |
| `mecanicas/` | Factores, poderes y habilidades reutilizables |
| `datos/json/` | Definiciones de Kasters, encuentros, cartas y datos históricos |
| `compartido/` | Contratos de mensajes compartidos cliente/servidor |
| `tests/` | Pruebas de módulos sin motor gráfico |
| `docs/` | Documentación técnica y plan de migración |

## Qué está listo

- Nueva estructura y aislamiento de capas.
- 399 imágenes previas clasificadas en el directorio nuevo mediante referencias a sus objetos Git, sin volver a subir los binarios.
- Nuevo frontend estático para inspeccionar la preparación del encuentro Kiara vs. Lioren.
- Protocolo inicial y backend de **creación de sesiones preparatorias**.
- Archivo independiente de la versión vieja en `version-anterior/`.

## Qué NO está hecho

- El backend todavía NO está desplegado en un servidor. GitHub Pages no puede ejecutar Node.js.
- No se ejecutan todavía ataques, invocaciones ni otros resultados de combate.
- Los modelos del tester aún no se han trasladado a GLB optimizados.
- La ficha de Lioren es provisional; falta completar estadísticas, cartas y animaciones.
- El R.O.K. Lite actual permanece conectado a sus rutas existentes: se desconectará durante un cambio de versión probado, no de golpe.
