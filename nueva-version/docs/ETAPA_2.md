# Etapa 2 — Motor de combate autoritativo (prototipo)

La nueva versión vive en **el repositorio existente** `rok-lirte-html`, carpeta `nueva-version/`.

## Implementado

- Servidor de sesiones y protección de propiedad por conexión. Una sesión ajena no admite acciones.
- Estado inicial del combate Lioren vs Kiara y cuadrícula lógica de 9x18.
- Turnos alternos, 2 acciones por turno; mover, atacar, terminar turno.
- Movimiento en 8 direcciones con búsqueda de ruta y comprobación de casillas ocupadas.
- Ataque básico determinista que reduce PV y resuelve la victoria al llegar a cero.
- IA simple del rival ejecutada exclusivamente por el backend.
- Eventos lógicos serializados: `unit.moved`, `unit.attacked`, `turn.started`, `combat.finished`.
- Numeración de revisión, detección de revisiones antiguas e idempotencia por `actionId`.
- Protocolo v2 para iniciar sesión, consultar estado y emitir acciones.
- Cuadrícula web de prueba que **solo presenta** las respuestas del backend; no calcula daño ni movimiento.
- Pruebas automatizadas con Node.js (sin dependencias externas para el núcleo).

## Reglas provisionales (NO canon definitivo)

- 2 acciones por turno; cada movimiento/ataque consume 1.
- Una acción de movimiento permite hasta `movement` casillas por una ruta válida.
- Un ataque básico causa daño fijo igual al parámetro `attack`.
- Alcance por distancia máxima entre diferencias de fila y columna (Chebyshev).
- Lioren: 14 PV, ataque 2, alcance 3, movilidad 3 (valores extraídos de la ficha visual antigua).
- Kiara: 8 PV, ataque 1, alcance 2 (heredados); movilidad 2 elegida **solo para el prototipo**.
- Los factores, la defensa, la precisión, cartas, invocaciones y poderes **NO** se han implementado todavía.
- La IA de Kiara solo acerca al personaje y usa el ataque básico.
- Sin efectos visuales ni Three.js; esa integración será otra etapa.

## Seguridad y límites

- El frontend no puede fijar el daño, la vida, el jugador activo ni alterar el estado del motor.
- La sesión pertenece al socket que la crea; otro cliente recibe `session-not-found`.
- Estados y eventos salen de una copia del estado de juego, no del objeto interno de sesión.
- Acciones duplicadas devuelven la respuesta anterior, sin ejecutar nuevamente el daño.
- Las sesiones viven en memoria, un máximo de 100, caducan a la hora, se eliminan al desconectarse.
- No hay autenticación de cuentas, reconexión de sesiones, persistencia ni PvP reales aún.
- El backend no está desplegado: GitHub Pages **NO ejecuta Node.js**. La UI quedará visible pero el combate requiere desplegar el servidor en hosting.

## Próxima etapa

Integrar el renderizador Three.js sin copiar las reglas de combate del tester. El servidor seguirá siendo la única autoridad.
