# R.O.K. Lite — Organización de imágenes y recursos

Actualizado: 3 de noviembre de 2026

## Estado real
La migración de rutas de imágenes en el **juego activo** está aplicada:
- **175 archivos de imagen** tienen una ubicación canónica en `assets/images/`. Cada copia coincide con el original y conserva su mismo hash de objeto Git.
- **439 referencias literales** se modificaron en **ocho archivos**: `game.js`, `style.css`, `index.html`, `firebase-online.js`, `sw.js`, `nueva-version/frontend/js/adventure-bridge.js`, `nueva-version/frontend/js/ui/spellbook-hud.js` y `nueva-version/tests/flujo-aventura.test.js`.
- El cambio se aplicó en el commit `dab177d428341aeed5232f4c7ae2645cf529acac` mediante [GitHub Actions](https://github.com/dtokurisu-png/rok-lirte-html/actions/runs/41600531615), que terminó con éxito.
- La caché del service worker se versionó nuevamente para que dispositivos con instalaciones anteriores recuperen los nuevos recursos.
- Todas las referencias literales del manifiesto quedaron eliminadas de esos ocho archivos y los nuevos destinos existen en GitHub.

## Carpetas canónicas
```text
assets/
  images/
    cards/
      casters/portraits/
      casters/kiara/
      summons/kiara/
      spells/kiara/
      skins/
      backgrounds/
      characters/illustrations/
      characters/tokens/
      elements/
      abilities/
      guardians/
    ui/
      menu/
      spellbook/
      movement/
    arenas/backgrounds/
    props/kiara/
    fx/
  manifests/image-paths.json
```
El resto de familias que ya estaban correctamente divididas (por ejemplo, `assets/rarities/`, `assets/weapons/`, `assets/factors/`, `assets/arenas/`) se conservan para no duplicar una migración innecesaria. Los archivos de `version-anterior/` siguen siendo respaldo histórico.

## Compatibilidad con jugadores
**Se mantienen las URLs antiguas como alias de compatibilidad, no como ubicación canónica.** Aunque los archivos actuales ya usan las rutas nuevas, partidas guardadas, perfiles persistentes, datos sincronizados, cachés, enlaces externos o versiones antiguas de cliente pueden contener rutas originales. Borrarlas sin migrar también esos datos podría dejar imágenes faltantes. Las dos rutas de un mismo recurso referencian el **mismo hash de objeto Git**, por lo que no duplican su contenido binario dentro del almacén Git.

**Norma a partir de ahora:** subir cada imagen nueva solo a su carpeta canónica. No agregar recursos nuevos a `assets/` raíz.

## Comprobaciones
- `scripts/migrate-image-references.mjs --verify` comprueba la identidad de los 175 pares de recursos y la ausencia de referencias antiguas en los ocho archivos migrados.
- `.github/workflows/verify-image-assets.yml` verifica hashes, rutas, sintaxis JavaScript y pruebas de las rutas de Aventura y escena.
- Rama de recuperación previa: `backup-before-image-references-2026-11-03`.
- El suite completo del motor revela una **prueba preexistente independiente** en `nueva-version/tests/sesiones-continuas.test.js`: esperaba `unknown-card` y recibió `card-not-adapted-or-not-equipped`. El test y el motor no fueron modificados por esta organización; debe repararse en una tarea de lógica de combate distinta.

## Próxima norma de mantenimiento
La clasificación de ilustraciones genéricas en `cards/characters/` puede refinarse por tipo de unidad cuando el catálogo indique inequívocamente si cada carta es Kaster o invocación. No trasladarlas por suposición.

## Tester 3D
En `dtokurisu-png/rok-3d-test` la migración física también terminó: **19 binarios** distribuidos en `assets/models/` y `assets/animations/`, con cero GLB/FBX/ZIP en la raíz y rama de respaldo `backup-before-asset-root-cleanup-2026-11-03`. Se actualizaron las rutas del visor, la arena y el iniciador local, con pruebas de sintaxis y hashes; la comprobación visual WebGL aún corresponde hacerla en navegador.
