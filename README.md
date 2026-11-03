# R.O.K. Lite — juego original y nueva arquitectura en un solo repositorio

**Abre el juego desde [index.html](./index.html), como siempre.** La navegación original de Aventura se conserva: región, Kaster, preparación, VS, cartas destacadas, cuenta 3‑2‑1 y, desde ahora, transición a la arena 3D.

- [Aventura: documentación del enlace original → arena nueva](./nueva-version/docs/ETAPA_4_FLUJO.md).
- [Arena 3D](./nueva-version/frontend/arena.html) — componente visual conectado al recorrido original; no es un menú independiente.
- [Motor continuo](./nueva-version/docs/ETAPA_2.md) — simulación sin turnos, autoritativa en backend.
- [Versión anterior archivada](./version-anterior/index.html) — respaldo de las pantallas y reglas antiguas.

La carpeta `nueva-version/frontend/index.html` se mantiene **solo como banco de pruebas técnico** del desarrollo anterior. La ruta de juego para el usuario sigue siendo `/index.html`.

`game.js`, los modales y las pantallas originales no se han reescrito. El archivo principal `index.html` carga un pequeño puente adicional. La escena puede abrirse sin backend en **modo visual**. Para ejecutar un combate real hace falta desplegar el backend Node.js y establecer su URL en `nueva-version/frontend/config.json`.

Todos los cambios siguen en este mismo repositorio.
