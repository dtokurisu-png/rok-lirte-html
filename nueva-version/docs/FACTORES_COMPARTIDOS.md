# R.O.K. — migración del motor de factores compartidos

## Origen verificado (no propuesta nueva)
La clasificación **existente** de R.O.K. Lite v8.32–v8.39 es:
**Raíz → Activación → Categoría → Orientación → Enfoque**.

Fuentes del propio proyecto histórico: `Elberlord/rok/README.txt` (etapas semánticas)
y `Elberlord/rok/PB_UNIVERSAL_v1.txt`.
Ejemplos originales:
- Factor → Pasiva → Físico → Ofensivo → Iniciativa.
- Factor → PDA → Físico → Ofensivo → Control.
- Poder → Disparador → Virtual → Táctico → Movilidad.
- Habilidad → Pasiva → Virtual → Táctica → Saqueo.

`semanticBranches` describe el árbol semántico; `pbEffects` alimenta
la valoración PB Universal; `factorApplications` indica qué factor distribuye
un Poder/Habilidad, a qué objetivos y si hereda un factor nativo
(`inheritedBase`). **No deben eliminarse** ni convertirse directamente
en reglas de combate.

## Interpretación correcta de la taxonomía antigua

La cadena antigua de cinco capas **clasificaba el uso del factor en la carta**,
no cinco propiedades permanentes de la biblioteca de factores.

- **Carta / habilidad / poder:** origen (raíz) y activación (pasiva, activa,
  disparador, PDA), animación, disparadores y objetivos.
- **Instancia del factor:** categoría/naturaleza, orientación y enfoque.
  La carta puede decidir su naturaleza: el mismo escudo puede ser mágico
  en Cariona y psíquico en Astarin.
- **Configuración ejecutable:** modo de consumo, capacidad, potencia,
  duración, intervalo y condiciones de aplicación, definidos al usarlo.
- **Definición reutilizable:** identidad y efecto elemental del factor
  (escudo protege, quemadura causa daño periódico, sanación restaura vida).
- **Rasgos:** quedan explícitamente FUERA de la biblioteca de factores.

`LEGACY_SEMANTIC_LAYERS` conserva origen/activación para la compatibilidad
de las cadenas descriptivas, pero `FACTOR_LAYERS` ya no los presenta
como propiedades intrínsecas del factor. El objeto `application` se
entrega por separado a `createFactorInstance`. Las propiedades
`semantic.root` y `semantic.activation` se aceptan temporalmente
como puente legado, sin mezclarlas en `instance.semantic`.

## Separación de responsabilidades
1. **Biblioteca de factores:** define qué hace un escudo, armadura, quemadura,
   veneno, evasión, confusión o sanación.
2. **Declaración de habilidad/poder:** define activación, destino, categoría,
   potencia, frecuencia, consumo, duración, recarga, condiciones y animaciones.
3. **Instancia activa:** conserva capacidad restante, reloj y emite eventos de
   combate. No conoce nombres de cartas, modelos GLB ni Three.js.
4. **Adaptador de motor:** aplica daño/sanación/control al estado autoritativo.
   No se deben aplicar los mismos efectos simultáneamente desde el motor
   anterior y el compartido.
5. **Adaptador visual:** traduce `category` y estado a HUD, barras, colores,
   partículas y animaciones definidas por la habilidad, nunca por el factor.

Código fuente canónico: `nueva-version/compartido/factores-core.js`.
Pruebas iniciales: `nueva-version/tests/factores-core.test.mjs`.

## Ejemplos requeridos
- Cariona: `escudo`, `magico`, `mode: damage`, `capacity: 2`.
- Amor de Astarin: **el mismo** `escudo`, `psiquico`, `mode: time`,
  `duration: 10`, `blocksCategories: ['psiquico']`.
- Telépata: la confusión debe transportar `category:'psiquico'`,
  `negative:true` para que el escudo pueda bloquearla.
- Astarin también utilizará un factor `sanacion` con intervalo de 1 s
  y radio 6 configurado en su habilidad, no en la biblioteca.

## Estado real — etapa de base, NO migración completada
- [x] Recuperar la clasificación canónica de R.O.K.
- [x] Crear núcleo compartido puro, independiente del renderizador.
- [x] Probar de forma aislada absorción por daño, inmunidad psíquica y
      pulsos de sanación mediante pruebas unitarias.
- [ ] Mapear todas las declaraciones `semanticBranches`, `pbEffects`
      y `factorApplications` del juego legado.
- [ ] Incorporar un adaptador de reglas a `game.js` (5+ MB) por factor,
      con pruebas de equivalencia por carta antes de retirar su ruta antigua.
- [ ] Incorporar la misma fuente al tester `rok-3d-test`, con un mecanismo
      de distribución/versionado verificable y sin duplicar reglas.
- [ ] Migrar tiempo de fases de Lite y segundos de Arena 3D con unidades
      explícitas; no asumir que 1 fase == 1 segundo.
- [ ] Añadir motor de triggers, selección de objetivos, stacking, resistencias,
      cooldowns y efectos especializados todavía no soportados en este núcleo.
- [ ] Integrar con el backend continuo autoritativo, comprobar simultáneamente
      sincronización de estados, HUD, IA y animaciones.
- [ ] Verificación funcional completa y despliegue.

**Prohibición de doble aplicación:** una carta sólo utilizará el núcleo nuevo
cuando su adaptador esté probado y sustituya la ejecución anterior para ese
factor. No montar el nuevo motor como una segunda capa de daño encima del
motor anterior.
