import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim());
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_MODE = (process.env.MP_MODE || "test").toLowerCase(); // test | prod

// IMPORTANT: For Checkout Pro, MercadoPago recommends HTTPS return URLs.
// Use FRONTEND_BASE_URL like: https://xxxx.ngrok-free.app
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5173";
const WEBHOOK_URL = process.env.MP_WEBHOOK_URL || ""; // e.g. https://xxxx.ngrok-free.app/api/mp/webhook

if (!MP_ACCESS_TOKEN) {
  console.warn("[WARN] MP_ACCESS_TOKEN is missing. MercadoPago endpoints will fail until you set it.");
}

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: CORS_ORIGIN,
  })
);

const client = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN || "",
  options: { timeout: 5000 },
});

const preference = new Preference(client);
const payment = new Payment(client);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "dflex-mercadopago-server" });
});

app.post("/api/mp/create-preference", async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({ message: "MP_ACCESS_TOKEN no configurado en el backend." });
    }

    const { orderId, items, payer } = req.body || {};

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "orderId es requerido." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items es requerido (array no vacío)." });
    }

    // Mapear items al formato esperado por Preferences API
    const mpItems = items.map((i) => ({
      id: String(i.id || ""),
      title: String(i.title || "Item"),
      quantity: Number(i.quantity || 1),
      unit_price: Number(i.unit_price || 0),
      picture_url: i.picture_url ? String(i.picture_url) : undefined,
      currency_id: i.currency_id ? String(i.currency_id) : "ARS",
    }));

    const back_urls = {
      success: `${FRONTEND_BASE_URL}/payment/success`,
      failure: `${FRONTEND_BASE_URL}/payment/failure`,
      pending: `${FRONTEND_BASE_URL}/payment/pending`,
    };

    const body = {
      items: mpItems,
      payer: payer || undefined,
      back_urls,
      auto_return: "approved",
      external_reference: orderId,
      notification_url: WEBHOOK_URL || undefined,
    };

    const response = await preference.create({ body });

    const checkoutUrl = MP_MODE === "prod" ? response.init_point : response.sandbox_init_point;

    res.json({
      orderId,
      preferenceId: response.id,
      checkoutUrl,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point,
    });
  } catch (err) {
    console.error("create-preference error:", err);
    res.status(500).json({ message: err?.message || "Error creando preferencia." });
  }
});

// (Opcional) Verificar pago por ID (útil para la página success/pending si querés consultar estado real)
app.get("/api/mp/payment/:id", async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({ message: "MP_ACCESS_TOKEN no configurado en el backend." });
    }

    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "payment id requerido" });

    const response = await payment.get({ id });
    res.json(response);
  } catch (err) {
    console.error("payment get error:", err);
    res.status(500).json({ message: err?.message || "Error consultando pago." });
  }
});

// Webhook endpoint: MercadoPago enviará notificaciones aquí
app.post("/api/mp/webhook", async (req, res) => {
  // MercadoPago espera 200 rápido. Procesá async si necesitás.
  console.log("[WEBHOOK] headers:", req.headers);
  console.log("[WEBHOOK] body:", req.body);

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`MercadoPago server listening on http://localhost:${PORT}`);
  console.log(`CORS allowed: ${CORS_ORIGIN.join(", ")}`);
  console.log(`FRONTEND_BASE_URL: ${FRONTEND_BASE_URL}`);
  console.log(`MP_MODE: ${MP_MODE}`);
});
