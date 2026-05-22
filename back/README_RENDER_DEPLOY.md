# Deploy backend en Render

## 1) Supabase
Si ya ejecutaste el schema inicial, corré también:

```sql
back/sql/supabase_render_backend_migration.sql
```

Esto agrega persistencia de MP3 en Postgres para que los temas subidos desde el admin no se pierdan en Render.

## 2) Render
Crear un Web Service apuntando a este repo.

- Root Directory: `back`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

## 3) Variables de entorno
Copiar las variables de `back/RENDER_ENV_VARS.txt` en Render.

Cuando tengas la URL real de Vercel, reemplazá:

- `CORS_ORIGIN=https://TU-FRONT.vercel.app`
- `FRONTEND_BASE_URL=https://TU-FRONT.vercel.app`

## 4) Verificar
Cuando Render termine el deploy, abrir:

```txt
https://TU-BACKEND.onrender.com/api/health
```

Debe responder JSON con `ok: true`.
