# R.O.K. Lite — mismo repositorio

El juego clásico se conserva **sin cambios** y también está archivado en `version-anterior/`.

- [Abrir R.O.K. Lite](./index.html) — versión clásica publicada.
- [Nueva versión](./nueva-version/frontend/index.html) — frontend separado, preparado para el motor continuo.
- [Estructura](./nueva-version/README.md) — módulos y recursos.
- [Etapa 2 corregida](./nueva-version/docs/ETAPA_2.md) — combate **sin turnos**, con invocaciones automáticas, duelos 1v1, tres modos de alcance y relojes propios.
- [Prototipo antiguo por turnos (descartado)](./version-anterior/prototipo-por-turnos/) — se conserva para referencia, no se ejecuta.

Los 399 recursos de arte heredados están organizados bajo `nueva-version/frontend/recursos/`. Se mantienen rutas `assets/` y archivos raíz hasta la migración segura.

**Importante:** GitHub Pages puede publicar el cliente, pero el combate autoritativo necesita un servidor Node.js desplegado. El backend está escrito dentro del repositorio, aún **no está alojado** en un servicio público.
