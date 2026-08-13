import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";

import { apiFetch, buildApiUrl } from "../../api/http.js";
import { STORAGE_KEYS } from "../../branding/brand.js";
import { useProducts } from "../../hooks/useProducts.js";
import { getMinPrice } from "../../utils/pricing.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const CHANNEL_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "presencial", label: "Venta presencial" },
  { value: "otro", label: "Otra venta externa" },
];

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
  const providerMap = {
    bank_transfer: "Transferencia",
    mercadopago: "MercadoPago",
    manual: "Carga manual",
  };
  const provider = providerMap[payment.provider] || "—";
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

function makeEmptyManualOrder() {
  return {
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
    zip: "",
    channel: "whatsapp",
    fulfillmentStatus: "created",
    shipping: 0,
    note: "",
  };
}

function ManualOrderDialog({ open, onClose, onCreated }) {
  const { products } = useProducts();

  const [form, setForm] = useState(makeEmptyManualOrder());
  const [items, setItems] = useState([]);
  const [pickerProductId, setPickerProductId] = useState("");
  const [pickerVariantKey, setPickerVariantKey] = useState("");
  const [pickerPrice, setPickerPrice] = useState(0);
  const [pickerQty, setPickerQty] = useState(1);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(makeEmptyManualOrder());
    setItems([]);
    setPickerProductId("");
    setPickerVariantKey("");
    setPickerPrice(0);
    setPickerQty(1);
    setError("");
  }, [open]);

  const pickerProduct = useMemo(
    () => products.find((p) => p.id === pickerProductId) || null,
    [products, pickerProductId]
  );

  const pickerVariants = pickerProduct?.variants ?? [];

  const onPickProduct = (productId) => {
    setPickerProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product?.variants?.length) {
      const first = product.variants[0];
      setPickerVariantKey(`${first.color}__${first.size}`);
      setPickerPrice(Number(first.price) || 0);
    } else {
      setPickerVariantKey("");
      setPickerPrice(getMinPrice(product));
    }
    setPickerQty(1);
  };

  const onPickVariant = (key) => {
    setPickerVariantKey(key);
    const variant = pickerVariants.find((v) => `${v.color}__${v.size}` === key);
    if (variant) setPickerPrice(Number(variant.price) || 0);
  };

  const addItem = () => {
    if (!pickerProduct) return;
    const variant = pickerVariants.length
      ? pickerVariants.find((v) => `${v.color}__${v.size}` === pickerVariantKey)
      : null;

    setItems((prev) => [
      ...prev,
      {
        key: `${pickerProduct.id}__${pickerVariantKey}__${prev.length}`,
        productId: pickerProduct.id,
        name: pickerProduct.name,
        price: Number(pickerPrice) || 0,
        qty: Math.max(1, Number(pickerQty) || 1),
        variant: variant ? { color: variant.color || "", size: variant.size || "" } : null,
      },
    ]);

    setPickerProductId("");
    setPickerVariantKey("");
    setPickerPrice(0);
    setPickerQty(1);
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const total = subtotal + (Number(form.shipping) || 0);

  const canSave = form.fullName.trim() && items.length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");

    try {
      await apiFetch("/api/admin/orders", {
        method: "POST",
        body: JSON.stringify({
          customer: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            province: form.province.trim(),
            zip: form.zip.trim(),
          },
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            qty: i.qty,
            variant: i.variant,
          })),
          shipping: Number(form.shipping) || 0,
          channel: form.channel,
          fulfillmentStatus: form.fulfillmentStatus,
          note: form.note.trim(),
        }),
      });

      onCreated();
      onClose();
    } catch (e) {
      setError(e.message || "No se pudo crear la orden");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>Nueva orden manual</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Alert severity="info">
            Para registrar una venta hecha por fuera de la web (WhatsApp, en persona, etc.). Queda guardada como
            cualquier otra orden, marcada como "Carga manual".
          </Alert>

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 900 }}>Datos del cliente</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Nombre y apellido"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Teléfono"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="manual-channel-label">Canal de venta</InputLabel>
                  <Select
                    labelId="manual-channel-label"
                    label="Canal de venta"
                    value={form.channel}
                    onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                  >
                    {CHANNEL_OPTIONS.map((c) => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Dirección"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Ciudad"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Provincia"
                  value={form.province}
                  onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Código postal"
                  value={form.zip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 900 }}>Productos</Typography>

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Grid container spacing={1.5} alignItems="center">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="manual-product-label">Producto</InputLabel>
                    <Select
                      labelId="manual-product-label"
                      label="Producto"
                      value={pickerProductId}
                      onChange={(e) => onPickProduct(e.target.value)}
                    >
                      {products.map((p) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth size="small" disabled={!pickerVariants.length}>
                    <InputLabel id="manual-variant-label">Variante</InputLabel>
                    <Select
                      labelId="manual-variant-label"
                      label="Variante"
                      value={pickerVariantKey}
                      onChange={(e) => onPickVariant(e.target.value)}
                    >
                      {pickerVariants.map((v) => (
                        <MenuItem key={`${v.color}__${v.size}`} value={`${v.color}__${v.size}`}>
                          {v.color} / {v.size}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    label="Precio"
                    type="number"
                    size="small"
                    value={pickerPrice}
                    onChange={(e) => setPickerPrice(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 6, sm: 1.5 }}>
                  <TextField
                    label="Cant."
                    type="number"
                    size="small"
                    value={pickerQty}
                    onChange={(e) => setPickerQty(e.target.value)}
                    fullWidth
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 1.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addItem}
                    disabled={!pickerProduct}
                  >
                    Agregar
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right">Precio</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right">Cant.</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right">Subtotal</TableCell>
                  <TableCell sx={{ fontWeight: 900 }} align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.key}>
                    <TableCell>
                      {i.name}
                      {i.variant ? ` (${i.variant.color} / ${i.variant.size})` : ""}
                    </TableCell>
                    <TableCell align="right">{money.format(i.price)}</TableCell>
                    <TableCell align="right">{i.qty}</TableCell>
                    <TableCell align="right">{money.format(i.price * i.qty)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => removeItem(i.key)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>Sin productos agregados.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Stack>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Envío"
                type="number"
                value={form.shipping}
                onChange={(e) => setForm((f) => ({ ...f, shipping: e.target.value }))}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel id="manual-status-label">Estado</InputLabel>
                <Select
                  labelId="manual-status-label"
                  label="Estado"
                  value={form.fulfillmentStatus}
                  onChange={(e) => setForm((f) => ({ ...f, fulfillmentStatus: e.target.value }))}
                >
                  <MenuItem value="created">Creada</MenuItem>
                  <MenuItem value="processing">En preparación</MenuItem>
                  <MenuItem value="shipped">Enviada</MenuItem>
                  <MenuItem value="delivered">Entregada</MenuItem>
                  <MenuItem value="cancelled">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Stack alignItems="flex-end" justifyContent="center" sx={{ height: "100%" }}>
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: "1.2rem" }}>{money.format(total)}</Typography>
              </Stack>
            </Grid>
          </Grid>

          <TextField
            label="Nota (opcional)"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={!canSave}>
          {saving ? "Creando..." : "Crear orden"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [downloadingProofId, setDownloadingProofId] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Órdenes
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setManualOpen(true)}>
          Nueva orden manual
        </Button>
      </Stack>

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

      <ManualOrderDialog open={manualOpen} onClose={() => setManualOpen(false)} onCreated={load} />
    </Stack>
  );
}
