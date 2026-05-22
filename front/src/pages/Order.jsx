import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { apiFetch, apiFetchBuyer } from "../api/http.js";
import { useStore } from "../context/StoreContext.jsx";
import { BANK_TRANSFER_MESSAGE } from "../branding/brand.js";

function estadoLabel(status) {
  const map = {
    created: "Creada",
    processing: "En preparación",
    shipped: "Enviada",
    delivered: "Entregada",
    cancelled: "Cancelada",
  };
  return map[status] || status || "—";
}

function paymentLabel(payment = {}) {
  const provider = payment.provider === "bank_transfer" ? "Transferencia bancaria" : payment.provider === "mercadopago" ? "MercadoPago" : "—";
  const statusMap = {
    created: "creada",
    pending: "pendiente",
    pending_verification: "pendiente de conciliación",
    approved: "pago verificado",
    rejected: "rechazado",
    cancelled: "cancelado",
    in_process: "en proceso",
  };
  return `${provider} · ${statusMap[payment.status] || payment.status || "—"}`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-AR");
  } catch {
    return iso || "";
  }
}

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function Order() {
  const { id } = useParams();
  const location = useLocation();
  const { settings } = useStore();

  const [token, setToken] = useState("");
  const [hasBuyerSession, setHasBuyerSession] = useState(false);

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const bankTransfer = settings.payments?.bankTransfer || {};
  const bankInstructions = bankTransfer.instructions || BANK_TRANSFER_MESSAGE;

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const tFromUrl = sp.get("token") || "";
    const tFromLocal =
      localStorage.getItem(`karolin_active_order_token_${id}`) ||
      localStorage.getItem(`dflex_order_token_${id}`) ||
      "";

    const t = tFromUrl || tFromLocal;
    setToken(t);

    if (tFromUrl) localStorage.setItem(`karolin_active_order_token_${id}`, tFromUrl);

    const buyerToken = localStorage.getItem("karolin_active_buyer_token") || localStorage.getItem("dflex_buyer_token");
    setHasBuyerSession(!!buyerToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const headers = useMemo(() => (token ? { "x-order-token": token } : {}), [token]);

  const fetchMode = useMemo(() => {
    if (hasBuyerSession) return "buyer-session";
    if (token) return "order-token";
    return "none";
  }, [token, hasBuyerSession]);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      if (fetchMode === "order-token") {
        const o = await apiFetch(`/api/orders/${encodeURIComponent(id)}`, { headers });
        setOrder(o);
        setMessages([]);
      } else if (fetchMode === "buyer-session") {
        const o = await apiFetchBuyer(`/api/orders/${encodeURIComponent(id)}`);
        const m = await apiFetchBuyer(`/api/orders/${encodeURIComponent(id)}/messages`);
        setOrder(o);
        setMessages(Array.isArray(m?.items) ? m.items : []);
      } else {
        setOrder(null);
        setMessages([]);
      }
    } catch (e) {
      setError(e.message || "No se pudo cargar el pedido");
      setOrder(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMode]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (fetchMode !== "buyer-session") return;

    try {
      let msg;
      if (fetchMode === "buyer-session") {
        msg = await apiFetchBuyer(`/api/orders/${encodeURIComponent(id)}/messages`, {
          method: "POST",
          body: JSON.stringify({ text: trimmed }),
        });
      } else {
        return;
      }

      setText("");
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      setError(e.message || "No se pudo enviar el mensaje");
    }
  };

  if (fetchMode === "none") {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>Pedido {id}</Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          No se encontró acceso al pedido. Podés:
          <ul style={{ marginTop: 8 }}>
            <li>Entrar con tu cuenta en <b>Mi cuenta</b> si creaste una.</li>
            <li>Abrir el enlace privado que te llegó por email para ver el pedido.</li>
          </ul>
        </Alert>

        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/account" variant="contained">Ir a Mi cuenta</Button>
          <Button component={RouterLink} to="/" variant="outlined">Volver al inicio</Button>
        </Stack>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 900 }}>Cargando pedido...</Typography>
      </Paper>
    );
  }

  const isBankTransfer = order?.payment?.provider === "bank_transfer";
  const isMercadoPago = order?.payment?.provider === "mercadopago";
  const isMercadoPagoApproved = isMercadoPago && order?.payment?.status === "approved";

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
        <Stack>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>Pedido {id}</Typography>
          <Typography variant="body2" color="text.secondary">Creado: {formatDate(order?.createdAt)}</Typography>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Typography><b>Estado:</b> {estadoLabel(order?.fulfillmentStatus)}</Typography>
            <Typography><b>Pago:</b> {paymentLabel(order?.payment)}</Typography>
          </Stack>

          {isMercadoPago ? (
            <Alert severity={isMercadoPagoApproved ? "success" : "info"} icon={isMercadoPagoApproved ? <CheckCircleIcon /> : <CreditCardIcon />}>
              {isMercadoPagoApproved ? (
                <>
                  El pago por MercadoPago se realizó correctamente. Ya quedó verificado y asociado a este pedido.
                </>
              ) : (
                <>
                  El pago por MercadoPago está pendiente de confirmación. Si ya pagaste, puede demorar unos minutos en actualizarse.
                </>
              )}
            </Alert>
          ) : null}

          {isBankTransfer ? (
            <Alert severity={order?.payment?.status === "approved" ? "success" : "warning"} icon={<AccountBalanceIcon />}>
              {order?.payment?.status === "approved" ? (
                <>La transferencia bancaria ya fue verificada.</>
              ) : (
                <>
                  {bankInstructions}
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {bankTransfer.accountHolder ? <Typography variant="body2"><b>Titular:</b> {bankTransfer.accountHolder}</Typography> : null}
                    {bankTransfer.bankName ? <Typography variant="body2"><b>Banco:</b> {bankTransfer.bankName}</Typography> : null}
                    {bankTransfer.alias ? <Typography variant="body2"><b>Alias:</b> {bankTransfer.alias}</Typography> : null}
                    {bankTransfer.cbu ? <Typography variant="body2"><b>CBU/CVU:</b> {bankTransfer.cbu}</Typography> : null}
                    {bankTransfer.cuit ? <Typography variant="body2"><b>CUIT:</b> {bankTransfer.cuit}</Typography> : null}
                  </Stack>
                </>
              )}
            </Alert>
          ) : null}

          <Divider />

          <Stack spacing={0.5}>
            {(order?.items ?? []).map((i) => (
              <Stack key={i.id} direction="row" justifyContent="space-between">
                <Typography variant="body2">{i.name}{i.variant ? ` (${i.variant.color} / ${i.variant.size})` : ""} x{i.qty}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{money.format((i.price || 0) * (i.qty || 0))}</Typography>
              </Stack>
            ))}
          </Stack>

          <Divider />

          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontWeight: 900 }}>Total</Typography>
            <Typography sx={{ fontWeight: 900 }}>{money.format(order?.totals?.total || 0)}</Typography>
          </Stack>
        </Stack>
      </Paper>

      {fetchMode === "buyer-session" ? (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Canal privado</Typography>

          <Stack spacing={1} sx={{ mb: 2 }}>
            {messages.length === 0 ? (
              <Typography color="text.secondary">Sin mensajes.</Typography>
            ) : (
              messages.map((m) => (
                <Box key={m.id} sx={{ p: 1, borderRadius: 1, bgcolor: m.sender === "admin" ? "action.selected" : "background.default" }}>
                  <Typography variant="body2" sx={{ fontWeight: 900 }}>
                    {m.sender === "admin" ? "Tienda" : "Vos"} <span style={{ fontWeight: 400, color: "#666" }}>· {formatDate(m.createdAt)}</span>
                  </Typography>
                  <Typography variant="body2">{m.text}</Typography>
                </Box>
              ))
            )}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí tu mensaje..." fullWidth multiline minRows={2} />
            <Button variant="contained" onClick={send}>Enviar</Button>
          </Stack>
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>Contacto del pedido</Typography>
          <Alert severity="info">
            El chat directo está disponible únicamente para clientes con cuenta. Si compraste como invitado, el contacto se realiza por correo usando el email que cargaste en la compra.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <Button component={RouterLink} to="/account" variant="contained">
              Crear cuenta / iniciar sesión
            </Button>
            <Button component={RouterLink} to="/" variant="outlined">
              Volver al inicio
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
