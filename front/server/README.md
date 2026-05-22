# Dflex MercadoPago Server (Express)

## Setup
```bash
cd server
npm install
cp .env.example .env
# edit .env with your MP_ACCESS_TOKEN and FRONTEND_BASE_URL (HTTPS)
npm run dev
```

## Why HTTPS?
MercadoPago Checkout Pro uses `back_urls` and `notification_url`. MercadoPago has been tightening security and may reject HTTP URLs.
For local dev, use **ngrok** or similar to obtain a public HTTPS URL, and set:

- `FRONTEND_BASE_URL=https://xxxx.ngrok-free.app`
- `MP_WEBHOOK_URL=https://xxxx.ngrok-free.app/api/mp/webhook`

## Endpoints
- `POST /api/mp/create-preference` -> returns `checkoutUrl` (init_point or sandbox_init_point)
- `GET /api/mp/payment/:id` -> fetch payment status (optional)
- `POST /api/mp/webhook` -> webhook receiver
