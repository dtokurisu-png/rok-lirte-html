# Plan de migración

- Etapa 1: estructura única en el repositorio, archivo legacy, recursos clasificados, protocolo y servidor preparatorio.
- Etapa 2: reglas autoritativas de movimiento, turnos, ataques, factores y condiciones de victoria en el backend, con pruebas.
- Etapa 3: mover el escenario y renderizador Three.js del tester a `frontend/` sin su simulador de combate.
- Etapa 4: importar los modelos de Kiara y Lioren y construir el HUD flotante.
- Etapa 5: optimizar GLB, texturas y cargas para móviles.
- Etapa 6: PvP con servidor autoritativo, sincronización, reconciliación y seguridad.

La raíz seguirá funcionando con la versión anterior hasta que el nuevo motor pueda sustituirla de manera segura. La migración de todas las rutas antiguas no está terminada.
