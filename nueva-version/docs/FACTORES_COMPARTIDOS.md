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

## Alcance del catálogo actual (2026-11-07)

Por decisión del proyecto, el motor registra **solo seis factores**:
`confusion`, `escudo`, `armadura`, `extraccion`, `sanacion`,
`control`. Ningún factor futuro se añade hasta que lo requiera una carta.

**Fuente única:** `nueva-version/compartido/factores-core.js`.
El tester `rok-3d-test` utiliza el módulo externo mediante
`arena-factors-bridge.js`, fijando la revisión de GitHub en la URL de
jsDelivr. Ese archivo es un adaptador de cartas/visualización, no una
segunda implementación de los factores. Si falla el módulo remoto, se
conserva el combate legado y se informa en consola; es necesario comprobar
su carga en el navegador antes de declarar completa la integración.

| Factor | Fuente actual | Estado de migración |
| --- | --- | --- |
| Confusión | Telépata | **Factor 1 migrado en el tester:** ahora el núcleo compartido conserva el estado hasta que se resuelve el ataque obligado (sin caducidad de 1 s). El Telépata conserva pulso de 5 s, radio 6 y resultado 50/50; el atacante golpea a sí mismo o busca/ataca una invocación aliada, luego se restaura si sobrevive. Hay fallback si falla la carga del módulo. |
| Escudo | Cariona; Amor de Astarin | **Factor 2 integrado en tester:** Cariona consume tres impactos desde el motor compartido y refleja el valor en el HUD (fallback legado si el módulo no carga). Astarin tiene protección psíquica por 10 segundos, 10 marcas amarillas y FX de desvanecimiento en los últimos tres segundos. La renovación automática queda pendiente de duración de enfriamiento aprobada. |
| Armadura | Cariona; Roble Antiguo | **Factor 3 integrado en tester:** el motor compartido calcula reducciones planas persistentes por categoría y acumula fuentes base/equipo. La carta mantiene la duración del equipo, penalización de velocidad y destrucción; hay fallback al cálculo legado cuando no carga el módulo. |
| Extracción | Semillera; fuentes de elementos | Definición/evento disponible; economía/stock siguen en runtime original |
| Sanación | Amor de Astarin | Conexión inicial: pulso de 1 HP cada segundo dentro de radio 6, sin exceder HP máximo; depende de carga del núcleo compartido |
| Control | Controladora de Agua | Definición/evento disponibles, sin efecto de carta hasta fijar sus reglas concretas |

Los números actuales del escudo de Cariona en el tester son tres impactos
(`magicShieldHits=3`), diferentes del ejemplo conceptual de dos puntos de
daño; no se deben alterar silenciosamente hasta migrar y aprobar esa carta.
Del mismo modo, la animación, renovación y enfriamiento exacto del escudo
psíquico de Astarin están pendientes de su definición final.

Los **rasgos** no forman parte de esta biblioteca. La fuente de ejecución
(invocación, estructura, equipo, hechizo) y si se activa como poder,
habilidad, efecto de daño, pasiva o disparador, pertenece al perfil de uso
de la carta, no a la definición intrínseca del factor.

### Aclaración: Confusión se resuelve por acción, no por tiempo

La carta Telépata produce un disparador psíquico sobre el objetivo.
El motor central conserva el factor `confusion` con `mode:'action'` hasta
que la Arena confirme la ejecución del ataque forzado mediante
`completeFactorAction`. La elección 50/50, la selección de compañero,
el recorrido hasta él, las animaciones de ataque/hit y la restauración
pertenecen a la **habilidad y adaptador de combate**, no al factor global.

Si no hay otro aliado válido, o la trayectoria se atasca, el ataque
forzado se convierte en autoataque como salida segura. Al morir o
restaurarse de forma externa, la acción se cancela y se libera el factor.
No se ejecuta daño duplicado al finalizar el estado.

### Escudo — etapa 2

Ambas unidades llaman el mismo factor `escudo`, pero cada una aporta
sus propiedades. Cariona conserva **tres impactos por vida** (balance real
del tester) hasta autorizar migrar a la propuesta distinta de **dos puntos
de daño**. El motor guarda la capacidad; `magicShieldHits` es solamente
compatibilidad con el HUD existente. Los ataques físicos y mágicos están
configurados como protegidos, pese a que la naturaleza del escudo es
mágica: naturaleza del escudo y naturaleza del ataque bloqueado no son
sinónimos.

Amor de Astarin usa `mode:time`, `duration:10`, categoría `psiquico`
y bloquea exclusivamente factores negativos psíquicos mediante la
interfaz compartida `factorBlocks`. Su HUD lee tiempo restante, no
puntos de daño, y representa diez segmentos amarillos. El FX visual
parpadea/desaparece progresivamente en sus tres segundos finales.
La recarga/renovación automática se mantiene **sin habilitar** hasta
confirmar si debe tener 6 o 10 segundos de cooldown, para no inventar
una regla. La entrada de una nueva instancia a combate reinicia el
escudo desde 10 segundos.

**Armadura migrada (etapa 3):** el motor compartido reduce daño con `mode:'flat'`, sin consumir cargas. Cariona base: físico 1; con Roble Antiguo: físico +2 y mágico +1, total físico 3/mágico 1. El daño se procesa primero contra Escudo, luego Armadura, luego escudo genérico y vida; los modificadores de velocidad y la rotura al morir continúan en la carta/equipo. Si falla la carga del núcleo central se conserva el cálculo anterior, no se aplican dos reducciones.

Pruebas aisladas del adaptador: tres absorciones de Cariona,
recuperación del escudo al invocar una nueva vida, bloqueo psíquico
activo a 10s/3s e inactivo a 0s, y restablecimiento en vida nueva.
La carga de CDN y el combate visual completo aún requieren QA de
navegador real.

### Armadura — factor 3

- Definición: `armadura` con modo `flat` y potencia configurable; el factor nunca se desgasta al recibir daño, a diferencia de un escudo por cargas.
- Cada fuente (armadura base y equipamiento) crea una instancia independiente del **mismo factor**. El cálculo agrega reducciones compatibles con la categoría del ataque.
- Cariona: defensa física base 1; Armadura de Roble Antiguo concede física +2 y mágica +1. Equipada, su protección es física 3 / mágica 1.
- El adaptador vuelve a calcular las fuentes cuando se equipa, pierde o rompe el objeto. La lógica de casteo, coste, recrafteo, velocidad y selección del equipo se conserva sin alteraciones.
- El motor compartido recibe el daño después del Escudo y devuelve la cantidad neta para evitar dobles reducciones. Si falla su carga, el código anterior sigue disponible.
- Pruebas del factor y del adaptador: sin equipar (1/0), equipada (3/1), desequipada (1/0), sin armadura (0), acumulación, límites y persistencia por golpes.
- Falta confirmar en una partida real en navegador la integración visual completa y la disponibilidad del archivo del CDN.

## Estado real — etapa de base, NO migración completada
- [x] Recuperar la clasificación canónica de R.O.K.
- [x] Crear núcleo compartido puro, independiente del renderizador.
- [x] Probar de forma aislada absorción por daño, inmunidad psíquica y
      pulsos de sanación mediante pruebas unitarias.
- [ ] Mapear todas las declaraciones `semanticBranches`, `pbEffects`
      y `factorApplications` del juego legado.
- [ ] Incorporar un adaptador de reglas a `game.js` (5+ MB) por factor,
      con pruebas de equivalencia por carta antes de retirar su ruta antigua.
- [x] Crear adaptador de consumo versionado para el tester
      (`arena-factors-bridge.js`); pendiente verificar CDN y carga real
      en navegador antes de considerar completa la integración.
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
