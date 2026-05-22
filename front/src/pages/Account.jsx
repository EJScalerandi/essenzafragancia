import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { apiFetchBuyer } from "../api/http.js";

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
  const provider =
    payment.provider === "mercadopago"
      ? "MercadoPago"
      : payment.provider === "bank_transfer"
        ? "Transferencia"
        : "Pago";

  const statusMap = {
    created: "creado",
    pending: "pendiente",
    pending_verification: "por verificar",
    preference_created: "pendiente",
    approved: "aprobado",
    rejected: "rechazado",
    cancelled: "cancelado",
    in_process: "en proceso",
  };

  return `${provider}: ${statusMap[payment.status] || payment.status || "—"}`;
}

function paymentColor(payment = {}) {
  if (payment.status === "approved") return "success";
  if (payment.status === "pending_verification" || payment.status === "pending" || payment.status === "preference_created") return "warning";
  if (payment.status === "rejected" || payment.status === "cancelled") return "error";
  return "default";
}

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const emptyProfile = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  zip: "",
};

function profileFromUser(user) {
  return {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    province: user?.province || "",
    zip: user?.zip || "",
  };
}

export default function Account() {
  const { user, booting, login, register, logout, updateUser } = useCustomerAuth();

  const [mode, setMode] = useState("login"); // login|register
  const [tab, setTab] = useState("profile");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(emptyProfile);
  const [savingProfile, setSavingProfile] = useState(false);
  const [snack, setSnack] = useState("");

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fullProfileName = useMemo(() => {
    const name = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
    return name || user?.fullName || user?.email || "";
  }, [profile, user]);

  useEffect(() => {
    if (user) {
      setProfile(profileFromUser(user));
    } else {
      setProfile(emptyProfile);
    }
  }, [user]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    setError("");
    try {
      const res = await apiFetchBuyer("/api/account/orders");
      setOrders(Array.isArray(res?.items) ? res.items : []);
    } catch (e) {
      setError(e.message || "No se pudo cargar el historial");
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "login") {
      const res = await login(email.trim(), password);
      if (!res.ok) return setError(res.message || "Login inválido");
      setTab("history");
      return;
    }

    const res = await register({ email: email.trim(), password, fullName: fullName.trim() });
    if (!res.ok) return setError(res.message || "No se pudo crear la cuenta");
    setTab("profile");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError("");

    try {
      const res = await apiFetchBuyer("/api/account/me", {
        method: "PUT",
        body: JSON.stringify(profile),
      });

      if (res?.user) {
        updateUser(res.user);
        setProfile(profileFromUser(res.user));
      }

      setSnack("Datos guardados");
    } catch (e2) {
      setError(e2.message || "No se pudieron guardar los datos");
    } finally {
      setSavingProfile(false);
    }
  };

  const onProfileChange = (key) => (e) => {
    setProfile((prev) => ({ ...prev, [key]: e.target.value }));
  };

  if (booting) return null;

  if (!user) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Mi cuenta
        </Typography>

        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button
              variant={mode === "login" ? "contained" : "outlined"}
              onClick={() => setMode("login")}
            >
              Iniciar sesión
            </Button>
            <Button
              variant={mode === "register" ? "contained" : "outlined"}
              onClick={() => setMode("register")}
            >
              Crear cuenta
            </Button>
          </Stack>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          <form onSubmit={onSubmit}>
            <Stack spacing={2}>
              {mode === "register" ? (
                <TextField
                  label="Nombre y apellido"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  fullWidth
                />
              ) : null}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                helperText={mode === "register" ? "Mínimo 6 caracteres" : ""}
              />

              {mode === "login" ? (
                <Button component={RouterLink} to="/forgot-password" variant="text" sx={{ alignSelf: "flex-start" }}>
                  ¿Olvidaste tu contraseña?
                </Button>
              ) : null}

              <Button type="submit" variant="contained">
                {mode === "login" ? "Entrar" : "Crear cuenta"}
              </Button>

              <Divider />

              <Typography variant="body2" color="text.secondary">
                También podés comprar sin cuenta. Si ya compraste como invitado, usá el enlace privado del email para ver tu pedido y chatear.
              </Typography>

              <Button component={RouterLink} to="/products" variant="outlined">
                Volver a la tienda
              </Button>
            </Stack>
          </form>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Mi cuenta
        </Typography>
        <Button variant="outlined" onClick={logout}>
          Salir
        </Button>
      </Stack>

      <Paper sx={{ p: 1 }}>
        <Tabs
          value={tab}
          onChange={(event, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="profile" label="Mis datos" />
          <Tab value="history" label="Historial de compras" />
        </Tabs>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {tab === "profile" ? (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{fullProfileName}</Typography>
              <Typography variant="body2" color="text.secondary">{user.email}</Typography>
            </Box>

            <Alert severity="info">
              Estos datos se usan para completar automáticamente el checkout. También se actualizan con los datos del último pago realizado con esta cuenta.
            </Alert>

            <form onSubmit={saveProfile}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Nombre" value={profile.firstName} onChange={onProfileChange("firstName")} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Apellido" value={profile.lastName} onChange={onProfileChange("lastName")} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Teléfono" value={profile.phone} onChange={onProfileChange("phone")} fullWidth />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Email" value={user.email} fullWidth disabled />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Dirección" value={profile.address} onChange={onProfileChange("address")} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Ciudad" value={profile.city} onChange={onProfileChange("city")} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Provincia" value={profile.province} onChange={onProfileChange("province")} fullWidth />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Código postal" value={profile.zip} onChange={onProfileChange("zip")} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button type="submit" variant="contained" disabled={savingProfile}>
                      {savingProfile ? "Guardando..." : "Guardar datos"}
                    </Button>
                    <Button variant="outlined" onClick={() => setProfile(profileFromUser(user))} disabled={savingProfile}>
                      Deshacer cambios
                    </Button>
                    <Button component={RouterLink} to="/products" variant="text">
                      Seguir comprando
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </form>
          </Stack>
        </Paper>
      ) : null}

      {tab === "history" ? (
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ mb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Historial de compras</Typography>
              <Typography variant="body2" color="text.secondary">
                Acá aparecen las compras hechas con esta cuenta.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={loadOrders} disabled={loadingOrders}>
              Actualizar
            </Button>
          </Stack>

          {loadingOrders ? (
            <Typography color="text.secondary">Cargando...</Typography>
          ) : orders.length === 0 ? (
            <Alert severity="info">
              Todavía no hay compras en esta cuenta.
            </Alert>
          ) : (
            <Stack spacing={1}>
              {orders.map((o) => (
                <Paper key={o.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.25}>
                    <Stack>
                      <Typography sx={{ fontWeight: 900 }}>Pedido {o.id}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(o.createdAt).toLocaleString("es-AR")}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip label={`Estado: ${estadoLabel(o.fulfillmentStatus)}`} />
                      <Chip label={paymentLabel(o.payment)} color={paymentColor(o.payment)} variant="outlined" />
                      {(o.unreadAdminMessages || 0) > 0 ? (
                        <Chip
                          label={`${o.unreadAdminMessages} mensaje(s) nuevo(s)`}
                          color="info"
                          variant="filled"
                        />
                      ) : null}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                      <Typography sx={{ fontWeight: 900 }}>{money.format(o.totals?.total || 0)}</Typography>
                      <Button component={RouterLink} to={`/order/${o.id}`} variant="contained">
                        Ver pedido
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      ) : null}

      <Snackbar open={!!snack} autoHideDuration={2200} onClose={() => setSnack("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack("")} severity="success" variant="filled">{snack}</Alert>
      </Snackbar>
    </Stack>
  );
}
