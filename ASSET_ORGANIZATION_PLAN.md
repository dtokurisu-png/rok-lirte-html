# Organización de recursos — R.O.K. Lite
Actualizado: 2026-11-02

## Objetivo
Separar modelos, animaciones, imágenes y recursos de interfaz para evitar mezclar cartas, personajes, skins, fondos y escenarios. El juego principal no debe importar recursos del tester hasta que estén aprobados.

## Estructura de destino propuesta (NO migrada todavía)
```text
assets/
  images/
    cards/
      casters/
      summons/
      spells/
      skins/
      backgrounds/
    ui/
      hud/
      icons/
      library/
      spellbook/
    arenas/
      water/
  models/
    casters/
    summons/
    props/
  animations/
    casters/
    summons/
  scenes/
    water/
  manifests/
```

## Reglas de migración
1. Los recursos existentes en `/assets` y la carpeta `nueva-version/frontend/recursos` pueden estar referidos por `game.js`, HTML, CSS y JSON. No mover/renombrar/borrar en masa.
2. Inventariar cada archivo, SHA, tamaño, tipo y todas sus referencias.
3. Distinguir imagen de carta, token de campo, skin, fondo y arena; el mismo recurso puede usarse en varios lugares: evitar confundir categorías.
4. Copiar primero a una ruta canónica y cambiar las referencias controladamente, preservando la ruta anterior temporalmente.
5. Probar menú, biblioteca, Spellbook, tarjetas, VS, arena 3D y móvil. Solo después retirar las rutas antiguas.
6. Los archivos del tester se revisan primero con `https://dtokurisu-png.github.io/rok-3d-test/caster-lab.html` y su manifest de decisiones.
7. Las imágenes y modelos no deben renombrarse por inferencia. Las variantes de animación necesitan aprobación visual antes de depurar.

## Estado
Documento de estructura y política creado; **no se han movido imágenes ni reorganizado físicamente el árbol histórico de R.O.K. Lite**. La futura migración será una etapa aislada para no romper el flujo Aventura → VS → arena ya validado.
