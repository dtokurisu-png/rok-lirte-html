# Arquitectura del nuevo R.O.K. (Etapa 1)

```
frontend/       Cliente web: DOM / HUD / futuro Three.js
     |
     | Socket.IO y API (solo solicitudes y vistas autorizadas)
     v
backend/        Servidor Node.js: autoridad y sesiones
     |  -> motor/        reglas generales y estado
     |  -> mecanicas/    factores, poderes, habilidades
     |  -> datos/json/   Kasters, encuentros, cartas
     |
compartido/     Protocolo público, importable por ambos extremos
```

## Restricciones

1. `motor/` nunca importará módulos de `frontend/`, elementos DOM ni Three.js.
2. El frontend nunca decidirá daño, alcance, recursos, muerte ni resultados de acciones.
3. Los efectos visuales serán respuesta a eventos del servidor, no responsables de la resolución.
4. La primera cuadrícula lógica es 9 columnas x 18 filas. Cámara y animaciones son libres.
5. El servidor define y valida las sesiones; más adelante se añadirán autenticación, reglas PvP autoritativas, secuencias de eventos y persistencia.
6. Los sistemas heredados son referencias, no dependencias activas del nuevo motor.

## Publicación

GitHub Pages aloja `nueva-version/frontend/` como página estática. Node.js requiere un hosting de backend aparte, pero su código vive en el **mismo repositorio**, en `nueva-version/backend/`. La página no simula una conexión que todavía no existe.

## Estrategia de archivo y recursos

`version-anterior/` contiene la versión legacy completa y sus rutas relativas.
El directorio `nueva-version/frontend/recursos/` organiza copias referenciadas por SHA de los 399 assets actuales. Conservamos `assets/` en la raíz como puente de compatibilidad con el juego publicado. Estas rutas solo se retirarán al verificar la migración de sus referencias en HTML, CSS y JavaScript.

Los dos GLB grandes y los FBX de desarrollo están en el laboratorio `rok-3d-test`; se incorporarán al directorio nuevo únicamente después de preparar versiones optimizadas.
