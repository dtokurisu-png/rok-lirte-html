# R.O.K. — repositorio único

R.O.K. Lite y el nuevo motor comparten **este mismo repositorio**. No se creó ningún repositorio adicional ni se requiere instalar archivos para ver el frontend.

- **[R.O.K. Lite actual](./index.html)** — versión publicada, conservada sin cambios en código ni recursos.
- **[Nueva versión](./nueva-version/frontend/index.html)** — frontend separado con cuadrícula de prueba para el nuevo combate lógico.
- **[Arquitectura](./nueva-version/docs/ARQUITECTURA.md)** — responsabilidades y límites de cada capa.
- **[Etapa 2](./nueva-version/docs/ETAPA_2.md)** — combate provisional en servidor, acciones, IA, pruebas y limitaciones.
- **[Versión anterior archivada](./version-anterior/index.html)** — copia completa de referencia.

La web actual sigue usando rutas raíz y `assets/` para evitar romper enlaces. Los recursos gráficos se han clasificado en `nueva-version/frontend/recursos/`. Los modelos 3D y paquetes de animaciones del tester se incorporarán tras su optimización.

**Importante:** GitHub Pages no puede ejecutar Node.js. Por eso la nueva interfaz se puede abrir desde GitHub Pages, pero el combate requiere desplegar el backend `nueva-version/backend/` en un servidor. No hay backend público configurado todavía; no afirmar que el combate online ya funciona.
