# Arquitectura — motor continuo

```
Frontend (HTML/CSS/JS) — solo invocar y representar estado/eventos
          |
          | Socket.IO v3: HELLO, CREATE_SESSION, ACTION(summon), SYNC, GET_STATE
          v
Servidor Node.js — 100ms por tick, autoridad sobre la sesión
          |
          +--> motor/estado.js       estado y proyección pública
          +--> motor/unidades.js     plantilla, stats y creación
          +--> motor/objetivos.js    selección, reserva 1v1
          +--> motor/simulacion.js   movimiento, cadencias, proyectiles, muerte
          +--> datos/json/          Kasters y perfiles de prototipos
```

No hay turnos ni órdenes de movimiento/ataque individuales al servidor: las invocaciones actúan solas. La simulación no usa DOM, Three.js ni callbacks de animación para decidir resultados.

Las mecánicas futuras de R.O.K. (habilidades, factores, poderes) serán módulos independientes del motor base. R.O.K. clásico continúa sin cambios. Los módulos por turnos incorrectos se archivan en `version-anterior/prototipo-por-turnos/`.

Solo se permite al cliente solicitar un `summon(cardId)`; el servidor decide posición y comportamiento.

GitHub Pages sirve el cliente estático, no Node.js. El backend necesita despliegue real para jugar.
