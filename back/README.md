# Karolin Active E-commerce Backend (Node.js + Express)

Backend listo para un template e-commerce:
- Auth admin (mock por env) + JWT
- Productos (CRUD admin + listado público)
- Órdenes (crear, listar admin, actualizar estados)
- Settings de tienda (storeName)
- MercadoPago Checkout Pro (opcional)
- Persistencia simple en JSON (carpeta `data/`)

## Requisitos
- Node.js 18+

## Setup
```bash
npm install
cp .env.example .env
npm run dev
```

## Envío de emails con Gmail (SMTP)
El backend usa Nodemailer por SMTP. Para Gmail se recomienda usar **App Password** (requiere 2-Step Verification).

Variables mínimas en `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tuusuario@gmail.com
SMTP_PASS=TU_APP_PASSWORD_16_CHARS
SMTP_FROM="Karolin Active <tuusuario@gmail.com>"
FRONTEND_BASE_URL=http://localhost:5173
```

Test rápido:
```bash
npm run email:test
```

Si `SMTP_*` no está configurado, el backend entra en modo **mock** (no envía, solo loguea en consola).

Servidor: `http://localhost:4000`

## CORS
Configurable por `CORS_ORIGIN` (por defecto Vite: `http://localhost:5173`).

## Auth (mock)
Credenciales desde `.env`:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

Login:
```http
POST /api/auth/login
{ "username": "admin", "password": "admin123" }
```
Respuesta: `{ token, user }`

Usar `Authorization: Bearer <token>` en rutas admin.

## Endpoints principales
### Público
- `GET /api/health`
- `GET /api/store/settings`
- `GET /api/products` (query: `q, cat, tag, sort, page, pageSize`)
- `GET /api/products/:id`
- `POST /api/orders` (crea orden)
- `GET /api/orders/:id` (detalle)

### Admin (JWT)
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/fulfillment`
- `PATCH /api/admin/store/settings`

### MercadoPago (opcional)
- `POST /api/payments/mp/create-preference`
- `POST /api/payments/mp/webhook`
- `GET /api/payments/mp/payment/:id`

> Para que webhooks funcionen en local: usar ngrok y setear `MP_WEBHOOK_URL`.

## Persistencia
Se guarda en `data/`:
- `store.json`
- `products.json`
- `orders.json`

Para resetear seed:
```bash
npm run seed
```
