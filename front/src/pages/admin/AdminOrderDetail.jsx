import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import VerifiedIcon from "@mui/icons-material/Verified";

import { apiFetch, buildApiUrl } from "../../api/http.js";
import { STORAGE_KEYS } from "../../branding/brand.js";

function estadoLabel(value) {
  const map = {
    created: "Creada",
    processing: "En preparación",
    shipped: "Enviada",
    delivered: "Entregada",
    cancelled: "Cancelada",
  };
  return map[value] || value || "—";
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

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminOrderDetail() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [estado, setEstado] = useState("created");

  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setError("");
    try {
      const o = await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}`);
      const m = await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/messages`);
      setOrder(o);
      setEstado(o.fulfillmentStatus || "created");
      setMessages(Array.isArray(m?.items) ? m.items : []);
    } catch (e) {
      setError(e.message || "No se pudo cargar la orden");
      setOrder(null);
      setMessages([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateEstado = async (value) => {
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/fulfillment`, {
        method: "PATCH",
        body: JSON.stringify({ fulfillmentStatus: value }),
      });
      setEstado(value);
      await load();
    } catch (e) {
      setError(e.message || "No se pudo actualizar el estado");
    } finally {
      setSaving(false);
    }
  };

  const verifyBankTransfer = async () => {
    setSaving(true);
    setError("");
    setStatusMsg("");
    try {
      await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/payment/verify-bank-transfer`, {
        method: "PATCH",
      });
      setStatusMsg("Pago verificado. El correo se disparó en modo real o mock según configuración SMTP.");
      await load();
    } catch (e) {
      setError(e.message || "No se pudo verificar el pago");
    } finally {
      setSaving(false);
    }
  };

  const openPaymentProof = async () => {
    setError("");
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const res = await fetch(buildApiUrl(`/api/orders/${encodeURIComponent(id)}/payment-proof`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || data?.error || "No se pudo abrir el comprobante");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e.message || "No se pudo abrir el comprobante");
    }
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSaving(true);
    setError("");
    try {
      const msg = await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: trimmed }),
      });
      setText("");
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      setError(e.message || "No se pudo enviar el mensaje");
    } finally {
      setSaving(false);
    }
  };

  const customerLine = useMemo(() => {
    if (!order?.customer) return "";
    const c = order.customer;
    return `${c.fullName} · ${c.email} · ${c.phone}`;
  }, [order]);

  const isBankTransferPending =
    order?.payment?.provider === "bank_transfer" && order?.payment?.status !== "approved";

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Orden {id}
        </Typography>

        <Button component={RouterLink} to="/admin/orders" variant="outlined">
          Volver
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {statusMsg ? <Alert severity="success">{statusMsg}</Alert> : null}

      {!order ? (
        <Typography color="text.secondary">Cargando...</Typography>
      ) : (
        <>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 900 }}>Cliente</Typography>
              <Typography variant="body2" color="text.secondary">{customerLine}</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.customer.address}, {order.customer.city}, {order.customer.province} ({order.customer.zip})
              </Typography>

              <Divider sx={{ my: 1 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Typography sx={{ fontWeight: 900 }}>Estado</Typography>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="estado-label">Estado</InputLabel>
                  <Select
                    labelId="estado-label"
                    label="Estado"
                    value={estado}
                    onChange={(e) => updateEstado(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="created">Creada</MenuItem>
                    <MenuItem value="processing">En preparación</MenuItem>
                    <MenuItem value="shipped">Enviada</MenuItem>
                    <MenuItem value="delivered">Entregada</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="body2" color="text.secondary">
                  Actual: <b>{estadoLabel(order.fulfillmentStatus)}</b> · {formatDate(order.updatedAt)}
                </Typography>
              </Stack>

              {order.note ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  <b>Nota del comprador:</b> {order.note}
                </Alert>
              ) : null}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>Pago</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {paymentLabel(order.payment)}
                  </Typography>
                  {order.payment?.statusDetail ? (
                    <Typography variant="caption" color="text.secondary">{order.payment.statusDetail}</Typography>
                  ) : null}
                </Box>

                <Chip
                  icon={order.payment?.status === "approved" ? <VerifiedIcon /> : undefined}
                  label={order.payment?.status === "approved" ? "Pago verificado" : "Pendiente"}
                  color={order.payment?.status === "approved" ? "success" : "warning"}
                />
              </Stack>

              {order.payment?.proof ? (
                <Alert
                  severity="info"
                  icon={<AttachFileIcon />}
                  action={
                    <Button color="inherit" size="small" onClick={openPaymentProof} disabled={saving}>
                      Ver comprobante
                    </Button>
                  }
                >
                  <b>Comprobante cargado:</b> {order.payment.proof.fileName} ({formatFileSize(order.payment.proof.sizeBytes)})
                  {order.payment.proof.uploadedAt ? ` · ${formatDate(order.payment.proof.uploadedAt)}` : ""}
                </Alert>
              ) : null}

              {isBankTransferPending ? (
                <Alert
                  severity="warning"
                  action={
                    <Button color="inherit" size="small" startIcon={<MarkEmailReadIcon />} onClick={verifyBankTransfer} disabled={saving}>
                      Marcar pago verificado
                    </Button>
                  }
                >
                  Esta venta fue por transferencia bancaria. Verificá el comprobante y marcala como pago verificado.
                  Al hacerlo se envía un correo automático al comprador; si no hay SMTP configurado queda como prueba/mock en logs.
                </Alert>
              ) : null}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Chat privado del pedido</Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1} sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}>
              {messages.length === 0 ? (
                <Typography color="text.secondary">Sin mensajes.</Typography>
              ) : (
                messages.map((m) => (
                  <Box key={m.id} sx={{ display: "flex", justifyContent: m.sender === "admin" ? "flex-end" : "flex-start" }}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1, maxWidth: "80%", bgcolor: m.sender === "admin" ? "action.hover" : "background.paper" }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {m.sender === "admin" ? "Admin" : "Comprador"} · {formatDate(m.createdAt)}
                      </Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{m.text}</Typography>
                    </Paper>
                  </Box>
                ))
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí la respuesta..." fullWidth multiline minRows={2} />
              <Button variant="contained" onClick={send} disabled={saving}>Enviar</Button>
            </Stack>
          </Paper>
        </>
      )}
    </Stack>
  );
}
