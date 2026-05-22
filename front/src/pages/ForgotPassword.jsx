import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { apiFetchBuyer } from "../api/http.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDone(false);
    setLoading(true);

    try {
      await apiFetchBuyer("/api/account/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      setDone(true);
    } catch (e2) {
      // no filtramos si existe o no, pero si el server falla sí avisamos
      setError(e2.message || "No se pudo procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 6, px: 2 }}>
      <Paper sx={{ p: 3, width: "100%", maxWidth: 520 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Recuperar contraseña
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Ingresá tu email. Si existe una cuenta, te vamos a enviar un link para restablecer la contraseña.
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {done ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Listo. Revisá tu email (y spam). Si la cuenta existe, ya enviamos el link.
          </Alert>
        ) : null}

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
            />

            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>

            <Button component={RouterLink} to="/account" variant="outlined">
              Volver a Mi cuenta
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
