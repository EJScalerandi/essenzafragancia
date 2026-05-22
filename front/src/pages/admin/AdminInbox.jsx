import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { apiFetch } from "../../api/http.js";

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

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("es-AR");
  } catch {
    return iso || "";
  }
}

export default function AdminInbox() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const res = await apiFetch("/api/admin/inbox");
      setOrders(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e.message || "No se pudo cargar la bandeja");
      setOrders([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => orders, [orders]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Bandeja
        </Typography>
        <Button variant="outlined" onClick={load}>
          Actualizar
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 900 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">Total</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Nuevos</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">Acción</TableCell>
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
                  <Chip label={estadoLabel(o.fulfillmentStatus)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${o.unreadBuyerMessages || 0}`}
                    color="warning"
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    component={RouterLink}
                    to={`/admin/orders/${o.id}`}
                    variant="contained"
                    size="small"
                  >
                    Abrir
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>No hay mensajes nuevos.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
