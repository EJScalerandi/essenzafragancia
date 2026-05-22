import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const from = location.state?.from || "/admin";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await login(username.trim(), password);
    if (!res.ok) {
      setError(res.message || "Login inválido");
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <Stack alignItems="center" sx={{ mt: 6, px: 2 }}>
      <Paper sx={{ p: 3, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Admin Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mock: admin / admin123
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
            />
            <Button type="submit" variant="contained" fullWidth>
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
