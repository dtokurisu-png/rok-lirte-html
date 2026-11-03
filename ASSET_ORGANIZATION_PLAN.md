# R.O.K. Lite — Organización segura de imágenes y medios (2026-11-03)

## Estado: primera migración física completada sin alterar el juego
Se crearon **175 rutas canónicas** bajo `assets/images/` copiando los archivos binarios existentes con sus mismos SHA de Git. Se registró cada relación origen/destino en:
- [Manifiesto de 175 rutas](./assets/manifests/image-paths.json)

**Importante:** las imágenes antiguas siguen disponibles en sus rutas originales porque `game.js` (~5 MB), `style.css` (~4,4 MB), `index.html` y algunos datos las consumen. El cambio es de organización física/registro, **no significa que ya se hayan migrado todas las referencias del juego ni que sea seguro eliminar las rutas antiguas**.

## Carpetas canónicas creadas
```text
assets/
  images/
    cards/
      casters/
        portraits/
        kiara/
      summons/
        kiara/
      spells/
        kiara/
      skins/
      backgrounds/
      characters/
        illustrations/
        tokens/
      elements/
      abilities/
      guardians/
    ui/
      menu/
      spellbook/
      movement/
    arenas/
      backgrounds/
    props/
      kiara/
    fx/
  manifests/
    image-paths.json
```

## Cómo usarlo
1. Todos los nuevos archivos de carta, invocación, caster, hechizo, skin y fondo se suben a su carpeta canónica, no a la raíz de `assets/`.
2. Los recursos de personaje no identificados inequívocamente como caster o invocación permanecen clasificados en `cards/characters/` hasta confirmar su definición en el catálogo. **No asignar categorías por suposición.**
3. Las imágenes de biblioteca/Spellbook reutilizan las ilustraciones y tokens existentes: no duplicar el mismo binario con otro nombre si no es necesario.
4. `assets/adventure/`, `assets/arenas/`, las familias de iconos y `version-anterior/` no se borran ni cambian mientras haya referencias.
5. Migrar referencias por grupos pequeños: juego antiguo, biblioteca, Spellbook, preparación Aventura, VS, escena 3D y móvil. Comprobar en cada etapa.
6. Solo borrar las rutas originales cuando todos sus consumidores estén actualizados y las pantallas funcionen. Mantener SHA original y mapeo reversible.

## Trabajo pendiente
- Inventariar las referencias completas de los grandes archivos `game.js`, `style.css` e `index.html`. La conexión no proporciona aquí su contenido íntegro para una sustitución segura, por lo que no se modificaron.
- Asignar los recursos genéricos de `cards/characters/` a casters/invocaciones cuando sus tipos estén confirmados.
- Verificar visualmente todas las pantallas tras cada lote de cambio de rutas y retirar alias antiguos.

## Tester 3D
En `dtokurisu-png/rok-3d-test` ya se copiaron 19 binarios a `assets/models/` y `assets/animations/`, se actualizaron referencias del visor y la arena, y se limpiaron nueve GLB decorativos de la raíz. Los archivos originales activos de modelos/animaciones se conservan como alias de compatibilidad hasta terminar la prueba visual.
