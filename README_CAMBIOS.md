# Cambios realizados

## Archivo modificado
- `front/src/pages/admin/AdminSettings.jsx`

## Qué se corrigió
- En Configuración > Links de contacto, el campo `Detalle de dirección` ahora permite escribir espacios normalmente.
- El problema era que el valor se normalizaba con `trim()` en cada tecla, entonces al presionar espacio lo borraba inmediatamente.
- Ahora el formulario conserva el texto tal cual mientras escribís.
- Al guardar, la configuración sigue normalizándose correctamente.

## Se mantienen
- Footer con iconos sociales.
- Dirección visible al lado del icono de ubicación.
- Carrito desplegable hacia abajo.
