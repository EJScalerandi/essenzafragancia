import React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

import { useProducts } from "../../hooks/useProducts.js";

export default function AdminHome() {
  const { products } = useProducts();

  const totalProducts = products.length;
  const totalVariants = products.reduce((acc, p) => acc + (p.variants?.length || 0), 0);
  const tags = Array.from(new Set(products.flatMap((p) => p.tags ?? [])));

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Resumen
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">Productos</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {totalProducts}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">Variantes</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {totalVariants}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography color="text.secondary">Tags</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {tags.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Tags activos</Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {tags.length ? tags.map((t) => <Chip key={t} label={t} sx={{ mb: 1 }} />) : <Chip label="(sin tags)" />}
        </Stack>
      </Paper>
    </Stack>
  );
}
