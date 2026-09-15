# HallValla Android wrapper — v130

Aplicación Android oficial de continuidad para HallValla.

- applicationId fijo: `com.hallvalla.game`
- versión inicial APK: `versionCode 130`, `versionName 1.0.130`
- URL: `https://elberlord.github.io/Hallvalla/`
- orientación: horizontal
- mínimo: Android 7 (API 24)
- objetivo: Android API 35

## Regla de actualizaciones

Para que Android acepte una APK futura como actualización de esta instalación:

1. NO cambiar `applicationId` (`com.hallvalla.game`).
2. Firmar SIEMPRE con el mismo `hallvalla-release.p12` y alias `hallvalla`.
3. Aumentar `versionCode` en cada APK nueva.
4. Guardar la contraseña del keystore. Si se pierde la clave o su contraseña, no se podrá actualizar la instalación existente con una firma diferente.

El juego sigue siendo un proyecto web; esta app es un shell Android de pantalla completa que abre el sitio oficial.
