# Decisiones vinculantes — R.O.K. Lite 3D

2026-11-02 — Alcance aprobado por el usuario:

1. El **juego principal es R.O.K. Lite** (`rok-lirte-html`). La integración comienza desde su menú, no desde una pantalla de tester.
2. **Reutilizar sin reconstruir** menú principal, modo Aventura, regiones, selección del Kaster enemigo, preparación, Spellbook, presentación VS y cuenta regresiva 3-2-1.
3. La nueva arena **aparece inmediatamente después de concluir «3, 2, 1, Combatir»**. No interrumpir la introducción.
4. **Mantener la geometría del tablero del tester**; el usuario sí quiere ese tablero como arena del nuevo combate. Los escenarios visuales podrán evolucionar sobre esa geometría.
5. Al entrar en la arena, el control corresponde al **nuevo motor de combate**; no reactivar el sistema de combate anterior dentro de la nueva arena.
6. Primero demostrar la navegación completa y la carga del tablero; **después** incorporar progresivamente lógica de combate, animaciones, modelos y resto de integraciones.
7. Tester `rok-3d-test` = entorno para crear/probar; no fuente del flujo de menús del juego principal.
8. Nuevos cambios deben incluir documentación persistente de estado, decisiones, arquitectura, pasos y pruebas dentro del repositorio. No registrar como completado lo que solo se proyectó.
9. Evitar modificaciones a funcionalidades no relacionadas. Mantener el código antiguo como respaldo donde corresponda.
10. Al iniciar otra conversación, leer primero `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `INTEGRATION_ROADMAP.md`, `DECISIONS.md` y `CHANGELOG_DEV.md`, contrastando con código fuente.

## Aclaración crítica
No confundir «conservar tablero del tester» con «entrar a la página independiente del tester». Se reutiliza su geometría/renderizador dentro del recorrido original.
