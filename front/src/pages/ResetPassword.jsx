import React, { useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { apiFetchBuyer } from "../api/http.js";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const sp = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const email = sp.get("email") || "";
  const token = sp.get("token") || "";

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = email && token && p1.length >= 6 && p1 === p2;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDone(false);
    setLoading(true);

    try {
      await apiFetchBuyer("/api/account/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword: p1 }),
      });

      setDone(true);
      setTimeout(() => navigate("/account"), 900);
    } catch (e2) {
      setError(e2.message || "No se pudo restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 6, px: 2 }}>
      <Paper sx={{ p: 3, width: "100%", maxWidth: 520 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Restablecer contraseña
        </Typography>

        {!email || !token ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            El link no es válido o está incompleto. Volvé a solicitar uno.
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cuenta: <b>{email}</b>
          </Typography>
        )}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {done ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Contraseña actualizada. Redirigiendo a Mi cuenta...
          </Alert>
        ) : null}

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nueva contraseña"
              type="password"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              fullWidth
              helperText="Mínimo 6 caracteres"
            />

            <TextField
              label="Repetir contraseña"
              type="password"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              fullWidth
              error={p2.length > 0 && p1 !== p2}
              helperText={p2.length > 0 && p1 !== p2 ? "No coincide" : ""}
            />

            <Button type="submit" variant="contained" disabled={!canSubmit || loading || !email || !token}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>

            <Button component={RouterLink} to="/forgot-password" variant="outlined">
              Volver
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
