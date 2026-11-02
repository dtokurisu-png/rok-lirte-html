# Ruta de integración R.O.K. Lite — 3D/2.5D

## Etapa A — Puente de Aventura (PRIORIDAD ACTUAL)
- [x] Implementación de un punto de entrada `ROK_ADVENTURE_START_BATTLE` en el puente.
- [x] Definición de la vista de arena con tablero derivado del tester.
- [ ] Inspección completa de la llamada desde `game.js`.
- [ ] Prueba funcional: menú → Aventura → Agua → Kiara → preparar → Combatir → VS → 3-2-1 → arena.
- [ ] Comprobar que se ve el tablero correcto y que no aparece el banco de pruebas como menú.
- [ ] Confirmar retorno a la preparación, sesión visual restablecida y ausencia de regresiones.
**Criterio de aceptación:** navegación completa reproducible en el juego real, con el tablero de pruebas como arena visual, sin exigir backend.

## Etapa B — Motor nuevo dentro de Aventura
- [ ] Configurar y verificar backend disponible.
- [ ] Crear y sincronizar sesión de combate real al terminar la transición.
- [ ] Convertir payload de región, encuentro, casters y Spellbook en datos válidos del motor.
- [ ] Mantener lógica autoritativa en backend y visuales desacoplados.

## Etapa C — Recursos 3D/animación
- [ ] Integrar modelos de Kiara y Lioren y su carga optimizada en móvil.
- [ ] Integrar invocaciones, armas, animaciones y eventos de ataque.
- [ ] Reutilizar y adaptar componentes verificados en `rok-3d-test` sin importar su UI de pruebas.
- [ ] Separar efectos visuales y reglas.

## Etapa D — Combate completo y progresión
- [ ] Sincronizar movimiento, objetivos, ataques, daños y victoria.
- [ ] Integrar cartas y Spellbook reales.
- [ ] Resultado, recompensas y regreso al recorrido de Aventura.
- [ ] Pruebas de rendimiento, móviles y reconexión.

Los checks significan **código identificado**, no aprobación de QA, salvo que se indique prueba expresamente en `CHANGELOG_DEV.md`.
