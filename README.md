# R.O.K. — un solo repositorio

Este repositorio contiene la versión clásica de R.O.K. Lite y la nueva arquitectura. No se creó otro repositorio.

## Entradas

- [R.O.K. Lite actual (estable)](./index.html): continúa funcionando mientras migramos.
- [Nueva versión — Etapa 1](./nueva-version/frontend/index.html): interfaz independiente publicada desde GitHub Pages, sin instalaciones locales.
- [Estructura del nuevo motor](./nueva-version/README.md): carpetas, módulos y estado de la integración.
- [Versión anterior archivada](./version-anterior/index.html): copia íntegra del código y los recursos previos.

## Atención

GitHub Pages **no ejecuta el servidor Node.js**. El frontend nuevo se puede abrir y revisar desde el navegador; el backend está en `nueva-version/backend` pero requiere despliegue posterior para conectar sesiones reales. El combate 3D y sus reglas aún no están implementados.

Los archivos antiguos que permanecen en la raíz y en `assets/` son **rutas de compatibilidad temporales** del juego que sigue publicado. No se eliminarán hasta que la migración termine y se compruebe que no hay enlaces rotos.
