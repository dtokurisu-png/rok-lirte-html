# Etapa 2 corregida — Combate continuo, sin turnos

## Motivo del cambio

La primera implementación por turnos fue **incorrecta** respecto al diseño. Se eliminó del motor activo. El código de aquella prueba se archivó en `version-anterior/prototipo-por-turnos/` para consulta.

## Diseño vigente

- Reloj continuo en el backend: un paso de 100 ms de tiempo simulado, sin turnos.
- El jugador **solo invoca**; las invocaciones seleccionan objetivos, caminan y atacan automáticamente.
- Tres modos de combate: `melee` (cuerpo a cuerpo), `range` (rango medio) y `distance` (larga distancia).
- Preparación/cadencia por unidad, no reloj global de ataque; duelos de cuerpo a cuerpo con reserva 1v1.
- Una segunda unidad no puede reclamar a un rival reservado: busca otro o ataca al Kaster enemigo.
- Los ataques a distancia generan proyectiles lógicos que impactan tras un tiempo de vuelo.
- Los eventos del motor describen `unit.summoned`, `unit.moved`, `attack.preparing`, `projectile.launched`, `unit.hit`, `unit.defeated` y `combat.finished`.
- Las animaciones del tester serán conectadas a los eventos en la Etapa 3; el motor **no** lee ni escribe el DOM.
- El backend lleva sesiones y valida comandos; el frontend nunca decide daño.

## Referencias leídas

`rok-3d-test/arena-25d.html`: `ATTACK_PROFILES`, `selectCombatTarget`, `reserveSummonDuel`, `updateDuel`, `updateCast`.
`rok-lirte-html/game.js`: `COMBAT_MODE_DB`, valores de cadencia y movimiento en tiempo real (`REALTIME_TIMING_TUNING_DEFAULTS`), mecanismos de ataques automáticos.

## Advertencias

- Perfil de prototipos en `datos/json/invocaciones/prototipos.json`: Farolera Escudo 2 s, Farolera Maná 2 s, Arquera 3 s; variantes de alcance observadas en el tester.
- Se añadió **Guardia de prueba** (`melee-vanguard`) para verificar combate cuerpo a cuerpo; su modelo visual aún es provisional.
- Kiara invoca automáticamente un modelo cada 5 s. Es una prueba, NO su IA de Aventura definitiva.
- Sin Spellbooks verdaderos, recursos, costes, efectos especiales, estado oculto, precisión, defensa, hechizos ni otros sistemas de R.O.K. todavía.
- Los Kasters están fijos en la cuadrícula mientras desarrollamos su movimiento y modelos.
- Las posiciones son lógicas continuas; el frontend muestra solo un tablero diagnóstico hasta integrar Three.js.
- Un despliegue nuevo tiene recuperación provisional de 1.5 s y límite de 5 invocaciones vivas por lado.
- Sin backend desplegado, GitHub Pages no puede ejecutar el combate. El juego no simula daños locales.
- El servidor mantiene sesiones en RAM y las invalida al desconectar. La persistencia y reconexión quedan pendientes.
- Los proyectiles lógicos siguen la identidad del objetivo: aún no tienen evasión/cobertura ni colisión física avanzada.
