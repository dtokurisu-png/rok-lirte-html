# HallValla Android wrapper — v131

Aplicación Android oficial de continuidad para HallValla.

- applicationId fijo: `com.hallvalla.game`
- versión APK: `versionCode 131`, `versionName 1.0.131`
- URL: `https://elberlord.github.io/Hallvalla/?apk=131`
- orientación: horizontal
- mínimo: Android 7 (API 24)
- objetivo: Android API 35
- Google OAuth Web Client de Firebase: `496903032464-mcru6mkdr99pgos2fdegarg08eb55ujf.apps.googleusercontent.com`

## Cambio v131

La web no se modifica. El wrapper Android intercepta únicamente los botones de acceso Google de HallValla y abre Google Sign-In nativo mediante Google Play Services. El Google ID token vuelve al WebView y se entrega al Firebase Auth JS ya cargado por HallValla mediante `signInWithCredential`/`linkWithCredential`.

Esto evita ejecutar OAuth de Google dentro de Android WebView.

## Requisito OAuth Android

El mismo proyecto Google/Firebase debe tener un cliente OAuth de tipo Android con:

- Package name: `com.hallvalla.game`
- SHA-1 release: `54:ED:93:B1:F9:14:30:D2:B7:E9:91:1D:04:D0:52:E7:EC:93:15:F5`

Si falta esa asociación, Google Play Services devuelve `DEVELOPER_ERROR (10)` y la APK muestra una explicación específica.

## Regla de actualizaciones

1. NO cambiar `applicationId` (`com.hallvalla.game`).
2. Firmar SIEMPRE con el mismo `hallvalla-release.p12` y alias `hallvalla`.
3. Aumentar `versionCode` en cada APK nueva.
4. Conservar la contraseña del keystore fuera del repositorio.
