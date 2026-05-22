import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import DescriptionIcon from "@mui/icons-material/Description";

import { apiFetch, buildApiUrl } from "../../api/http.js";
import { STORAGE_KEYS } from "../../branding/brand.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

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

function estadoColor(value) {
  if (value === "created") return "default";
  if (value === "processing") return "warning";
  if (value === "shipped") return "info";
  if (value === "delivered") return "success";
  if (value === "cancelled") return "error";
  return "default";
}

function paymentLabel(payment = {}) {
  const provider = payment.provider === "bank_transfer" ? "Transferencia" : payment.provider === "mercadopago" ? "MercadoPago" : "—";
  const statusMap = {
    created: "creada",
    pending: "pendiente",
    pending_verification: "por conciliar",
    approved: "verificado",
    rejected: "rechazado",
    cancelled: "cancelado",
  };
  return `${provider} · ${statusMap[payment.status] || payment.status || "—"}`;
}

function paymentColor(payment = {}) {
  if (payment.status === "approved") return "success";
  if (payment.status === "pending_verification") return "warning";
  if (payment.status === "pending") return "info";
  if (payment.status === "rejected" || payment.status === "cancelled") return "error";
  return "default";
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-AR");
  } catch {
    return iso || "";
  }
}

function buildProofFileName(order) {
  const original = order?.payment?.proof?.fileName || "comprobante";
  const hasExtension = /\.[a-z0-9]+$/i.test(original);
  return `${order.id}-${original}${hasExtension ? "" : ".pdf"}`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [downloadingProofId, setDownloadingProofId] = useState("");

  const load = async () => {
    setError("");
    try {
      const res = await apiFetch("/api/admin/orders");
      setOrders(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e.message || "No se pudieron cargar las órdenes");
      setOrders([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeEstado = async (id, fulfillmentStatus) => {
    try {
      await apiFetch(`/api/admin/orders/${encodeURIComponent(id)}/fulfillment`, {
        method: "PATCH",
        body: JSON.stringify({ fulfillmentStatus }),
      });
      await load();
    } catch (e) {
      setError(e.message || "No se pudo actualizar la orden");
    }
  };

  const downloadPaymentProof = async (order) => {
    if (!order?.id || !order?.payment?.proof) return;

    setError("");
    setDownloadingProofId(order.id);

    try {
      const token = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const res = await fetch(buildApiUrl(`/api/orders/${encodeURIComponent(order.id)}/payment-proof`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || data?.error || "No se pudo descargar el comprobante");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildProofFileName(order);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      setError(e.message || "No se pudo descargar el comprobante");
    } finally {
      setDownloadingProofId("");
    }
  };

  const rows = useMemo(() => orders, [orders]);

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Órdenes
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 1, overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 900 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">Total</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Mensajes</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Pago</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="center">Comprobante</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.id}</TableCell>
                <TableCell>{formatDate(o.createdAt)}</TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 700 }}>{o.customer?.fullName || "—"}</Typography>
                  <Typography variant="body2" color="text.secondary">{o.customer?.email || ""}</Typography>
                </TableCell>
                <TableCell align="right">{money.format(o.totals?.total || 0)}</TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={estadoLabel(o.fulfillmentStatus)} color={estadoColor(o.fulfillmentStatus)} size="small" />
                    <FormControl size="small" sx={{ minWidth: 170 }}>
                      <Select value={o.fulfillmentStatus || "created"} onChange={(e) => changeEstado(o.id, e.target.value)}>
                        <MenuItem value="created">Creada</MenuItem>
                        <MenuItem value="processing">En preparación</MenuItem>
                        <MenuItem value="shipped">Enviada</MenuItem>
                        <MenuItem value="delivered">Entregada</MenuItem>
                        <MenuItem value="cancelled">Cancelada</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </TableCell>

                <TableCell>
                  {(o.unreadBuyerMessages || 0) > 0 ? (
                    <Chip label={`${o.unreadBuyerMessages} nuevo`} color="warning" size="small" />
                  ) : (
                    <Chip label="—" size="small" variant="outlined" />
                  )}
                </TableCell>

                <TableCell>
                  <Chip label={paymentLabel(o.payment)} color={paymentColor(o.payment)} size="small" variant={o.payment?.status === "approved" ? "filled" : "outlined"} />
                </TableCell>

                <TableCell align="center">
                  {o.payment?.provider === "bank_transfer" && o.payment?.proof ? (
                    <Tooltip title={`Descargar ${o.payment.proof.fileName}`}>
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => downloadPaymentProof(o)}
                          disabled={downloadingProofId === o.id}
                          aria-label="Descargar comprobante"
                        >
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Chip label="—" size="small" variant="outlined" />
                  )}
                </TableCell>

                <TableCell align="right">
                  <Button component={RouterLink} to={`/admin/orders/${o.id}`} variant="outlined" size="small">
                    Ver / Chat
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No hay órdenes.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
