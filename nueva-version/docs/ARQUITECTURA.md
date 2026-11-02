# Arquitectura R.O.K. Next — Etapa 2

```
frontend/ (HTML, CSS, JavaScript de UI)
      |
      | Socket.IO, protocolo v2, comandos / instantaneas
      v
backend/ (Node.js, sesiones, autentica por socket, limita solicitudes)
      | --> motor/ (estado, movimiento, combate, IA, sin DOM)
      | --> mecanicas/ (factores, poderes, habilidades: registros futuros)
      | --> datos/json/ (Kasters, encuentros, cartas)
      |
compartido/ (solo eventos y validadores de mensajes publicos)
```

- El frontend dibuja una cuadrícula **de prueba**; el servidor determina los resultados.
- Los eventos `unit.moved`, `unit.attacked`, `turn.started` y `combat.finished` son solo descripciones lógicas; nunca reproducen ni calculan animaciones.
- El backend comprueba propiedad de sesión, versión, secuencia y acciones válidas.
- La IA del rival ejecuta órdenes a través del mismo motor, sin poderes especiales.
- Los módulos del motor no importan Three.js, DOM, Socket.IO ni Firebase.
- Esta etapa usa reglas provisionales; `docs/ETAPA_2.md` documenta lo que falta.
- El servidor aún necesita hosting externo, porque GitHub Pages es estático.
- No se ha tocado el código existente de `game.js`, `firebase-online.js` o `style.css`.
- El archivo original sigue en `version-anterior/`; las rutas de raíz se mantienen temporalmente para no romper R.O.K. Lite.
