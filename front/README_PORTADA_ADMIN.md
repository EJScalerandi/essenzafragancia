# Karolin Active - Portada administrable

Este ZIP agrega una sección nueva en el admin:

- `/admin/home-images`
- Menú lateral: `Portada`

## Qué permite hacer

- cargar imágenes JPG, PNG o WEBP;
- máximo 8 imágenes;
- ocultar/mostrar cada imagen;
- cambiar el orden;
- borrar imágenes;
- guardar la portada para que impacte en la home pública.

## Backend

Agrega:

- `public.home_images` en Supabase;
- `POST /api/admin/store/home-images`;
- `DELETE /api/admin/store/home-images/:id`;
- `GET /media/home-images/:fileName`.

El backend también crea la tabla `home_images` automáticamente al arrancar. Igual dejé el SQL por si querés ejecutarlo manualmente:

```txt
back/sql/karolin_home_images_migration.sql
```

## Aplicación

1. Descomprimir sobre la raíz del repo.
2. Aceptar reemplazar archivos.
3. Commit + push.
4. Render redeploy.
5. Vercel redeploy.

## Nota

La home ya no usa un array hardcodeado de imágenes. Ahora lee `settings.homeImages` desde el backend.
