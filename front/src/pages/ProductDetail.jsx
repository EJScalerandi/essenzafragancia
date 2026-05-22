import React, { useMemo, useState, useEffect } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import ButtonGroup from "@mui/material/ButtonGroup";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../hooks/useProducts.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function makeMeta(product) {
  const seed = product.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rating = Math.min(5, 3.8 + (seed % 12) / 10);
  const reviews = 12 + (seed % 48);
  return { rating, reviews };
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { products } = useProducts();

  const [qty, setQty] = useState(1);
  const [snack, setSnack] = useState(false);

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const meta = useMemo(() => (product ? makeMeta(product) : null), [product]);

  // Variantes
  const colors = useMemo(() => {
    if (!product?.variants?.length) return [];
    return Array.from(new Set(product.variants.map((v) => v.color)));
  }, [product]);

  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  // Al cargar producto, setear defaults
  useEffect(() => {
    if (!product?.variants?.length) return;

    const first = product.variants[0];
    setColor(first.color);
    setSize(first.size);
    setQty(1);
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product?.variants?.length || !color) return [];
    return product.variants
      .filter((v) => v.color === color)
      .map((v) => v.size);
  }, [product, color]);

  // Cuando cambia color, ajustar talle a uno válido
  useEffect(() => {
    if (!sizesForColor.length) return;
    if (!sizesForColor.includes(size)) {
      setSize(sizesForColor[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizesForColor]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.color === color && v.size === size) ?? null;
  }, [product, color, size]);

  if (!product) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
          Producto no encontrado
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No existe un producto con id: <b>{id}</b>
        </Typography>
        <Button component={RouterLink} to="/products" variant="contained">
          Volver a productos
        </Button>
      </Paper>
    );
  }

  const price = selectedVariant?.price ?? product.basePrice ?? 0;
  const stock = selectedVariant?.stock ?? 0;

  const canAdd = product.variants?.length ? !!selectedVariant && stock > 0 : true;

  const handleAdd = () => {
    if (!canAdd) return;
    addItem(product, qty, selectedVariant);
    setSnack(true);
  };

  return (
    <Stack spacing={2}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/products" underline="hover" color="inherit">
          Productos
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src={product.image}
              alt={product.name}
              sx={{
                width: "100%",
                height: { xs: 280, md: 420 },
                objectFit: "cover",
                borderRadius: 2,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip size="small" label={product.category} />
                <Typography sx={{ fontWeight: 900 }}>{money.format(price)}</Typography>
              </Stack>

              <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                {product.name}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                <Rating value={meta.rating} precision={0.1} readOnly />
                <Typography variant="body2" color="text.secondary">
                  {meta.rating.toFixed(1)} · {meta.reviews} reseñas
                </Typography>
              </Stack>

              <Typography color="text.secondary">{product.description}</Typography>

              <Divider sx={{ my: 1 }} />

              {/* Selectores de variante */}
              {product.variants?.length ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="color-label">Color</InputLabel>
                    <Select
                      labelId="color-label"
                      label="Color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    >
                      {colors.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="size-label">Talle</InputLabel>
                    <Select
                      labelId="size-label"
                      label="Talle"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      {sizesForColor.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              ) : null}

              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 900, mb: 1 }}>
                  Resumen del producto
                </Typography>

                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Inventory2OutlinedIcon fontSize="small" />
                    <Typography variant="body2">
                      Stock: <b>{product.variants?.length ? stock : "Disponible"}</b>
                    </Typography>
                  </Stack>

                  {product.variants?.length ? (
                    <Typography variant="body2" color="text.secondary">
                      Variante: <b>{color}</b> · <b>{size}</b>
                    </Typography>
                  ) : null}

                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocalShippingOutlinedIcon fontSize="small" />
                    <Typography variant="body2">
                      Envío: <b>24/48hs</b> (según zona)
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReplayOutlinedIcon fontSize="small" />
                    <Typography variant="body2">
                      Devolución: <b>10 días</b>
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <VerifiedOutlinedIcon fontSize="small" />
                    <Typography variant="body2">
                      Garantía: <b>30 días</b>
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography sx={{ fontWeight: 800 }}>Cantidad</Typography>

                <ButtonGroup variant="outlined" size="small">
                  <Button onClick={() => setQty((q) => Math.max(1, q - 1))}>-</Button>
                  <Button disabled sx={{ color: "text.primary" }}>
                    {qty}
                  </Button>
                  <Button onClick={() => setQty((q) => Math.min(10, q + 1))}>+</Button>
                </ButtonGroup>

                <Typography variant="body2" color="text.secondary">
                  (máx 10)
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button variant="contained" onClick={handleAdd} disabled={!canAdd}>
                  {canAdd ? "Agregar al carrito" : "Sin stock"}
                </Button>

                <Button component={RouterLink} to="/products" variant="outlined">
                  Seguir comprando
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snack}
        autoHideDuration={2200}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnack(false)} severity="success" variant="filled">
          Agregado al carrito ({qty}) · {product.variants?.length ? `${color} / ${size}` : ""}
        </Alert>
      </Snackbar>
    </Stack>
  );
}