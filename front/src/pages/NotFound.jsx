import React from "react";
import { Link } from "react-router-dom";

import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

const SERIF = '"Playfair Display", Georgia, serif';

export default function NotFound() {
  return (
    <Stack alignItems="center" sx={{ mt: { xs: 6, sm: 10 }, px: 2 }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: "100%", maxWidth: 420, textAlign: "center" }}>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "3rem", lineHeight: 1, mb: 1 }}>
          404
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Página no encontrada.
        </Typography>
        <Button component={Link} to="/" variant="contained">
          Volver al inicio
        </Button>
      </Paper>
    </Stack>
  );
}
