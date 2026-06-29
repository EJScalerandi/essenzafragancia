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
import ButtonGroup from "@mui/material/ButtonGroup";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";

import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { useStore } from "../context/StoreContext.jsx";

const SERIF = '"Playfair Display", Georgia, serif';

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function tagColor(tag) {
  if (tag === "Oferta") return "error";
  if (tag === "Nuevo") return "success";
  if (tag === "Destacado") return "secondary";
  return "default";
}

function hasStock(product, selectedVariant) {
  if (product?.variants?.length) {
    return selectedVariant ? Number(selectedVariant.stock || 0) > 0 : false;
  }
  return true;
}

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { products } = useProducts();
  const { settings } = useStore();

  const [qty, setQty] = useState(1);
  const [snack, setSnack] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);

  const colors = useMemo(() => {
    if (!product?.variants?.length) return [];
    return Array.from(new Set(product.variants.map((v) => v.color)));
  }, [product]);

  const [color, setColor] = useState("");
  const [size, setSize] = useState("");

  useEffect(() => {
    if (!product?.variants?.length) return;
    const first = product.variants[0];
    setColor(first.color);
    setSize(first.size);
    setQty(1);
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product?.variants?.length || !color) return [];
    return product.variants.filter((v) => v.color === color).map((v) => v.size);
  }, [product, color]);

  useEffect(() => {
    if (!sizesForColor.length) return;
    if (!sizesForColor.includes(size)) setSize(sizesForColor[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizesForColor]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return product.variants.find((v) => v.color === color && v.size === size) ?? null;
  }, [product, color, size]);

  const whatsappHref = useMemo(() => {
    const raw = settings.contactLinks?.whatsappNumber || "543572585775";
    const digits = String(raw).replace(/\D+/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }, [settings.contactLinks?.whatsappNumber]);

  if (!product) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontFamily: SERIF, fontStyle: "italic", color: "text.secondary", mb: 1 }}>
          Producto no encontrado
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No existe un producto con id: <b>{id}</b>
        </Typography>
        <Button component={RouterLink} to="/products" variant="contained" startIcon={<ArrowBackIcon />}>
          Volver a productos
        </Button>
      </Box>
    );
  }

  const price = selectedVariant?.price ?? product.basePrice ?? getMinPrice(product);
  const compareAtPrice = Number(
    selectedVariant?.compareAtPrice ||
    product.compareAtPrice ||
    product.variants?.[0]?.compareAtPrice ||
    0
  );
  const transferPrice = Number(product.transferPrice || 0);
  const stock = selectedVariant?.stock ?? 0;
  const canAdd = product.variants?.length ? !!selectedVariant && stock > 0 : true;
  const outOfStock = !canAdd;

  const handleAdd = () => {
    if (!canAdd) return;
    for (let i = 0; i < qty; i++) addItem(product, 1, selectedVariant);
    setSnack(true);
  };

  function getMinPrice(p) {
    if (p.variants?.length) {
      const prices = p.variants.map((v) => Number(v.price || 0)).filter(Boolean);
      return prices.length ? Math.min(...prices) : Number(p.basePrice || 0);
    }
    return Number(p.basePrice || 0);
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ fontSize: "0.82rem" }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit" sx={{ fontWeight: 600 }}>
          Inicio
        </Link>
        <Link component={RouterLink} to="/products" underline="hover" color="inherit" sx={{ fontWeight: 600 }}>
          Perfumes
        </Link>
        <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: "0.82rem" }}>
          {product.name}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={{ xs: 3, md: 5 }}>
        {/* ── IMAGE COLUMN ── */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: { md: "sticky" }, top: { md: 90 } }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                bgcolor: "#f4eadb",
                border: "1px solid rgba(67,48,34,0.10)",
                boxShadow: "0 8px 32px rgba(29,22,18,0.10)",
                cursor: "zoom-in",
              }}
              onClick={() => setZoomed((z) => !z)}
            >
              {product.image ? (
                <Box
                  component="img"
                  src={product.image}
                  alt={product.name}
                  sx={{
                    width: "100%",
                    aspectRatio: "4 / 5",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform 500ms cubic-bezier(0.16,1,0.3,1)",
                    transform: zoomed ? "scale(1.10)" : "scale(1)",
                  }}
                />
              ) : (
                <Box sx={{ width: "100%", aspectRatio: "4 / 5", display: "grid", placeItems: "center", bgcolor: "#f4eadb" }}>
                  <Typography sx={{ color: "text.disabled" }}>Sin imagen</Typography>
                </Box>
              )}

              {/* Tags overlay */}
              <Stack direction="row" spacing={0.75} sx={{ position: "absolute", top: 14, left: 14, flexWrap: "wrap" }}>
                {(product.tags ?? []).map((tag) => (
                  <Chip key={tag} size="small" label={tag} color={tagColor(tag)} sx={{ backdropFilter: "blur(6px)" }} />
                ))}
                {outOfStock && <Chip size="small" label="Sin stock" sx={{ bgcolor: "rgba(255,253,248,0.92)" }} />}
              </Stack>
            </Box>

            {/* Thumbnail hint */}
            {product.image && (
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", textAlign: "center", mt: 1 }}>
                Toca para {zoomed ? "alejar" : "ampliar"}
              </Typography>
            )}
          </Box>
        </Grid>

        {/* ── INFO COLUMN ── */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Category + Tags */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={product.category} size="small" />
              {(product.tags ?? []).map((t) => (
                <Chip key={t} label={t} size="small" variant="outlined" color={tagColor(t)} />
              ))}
            </Stack>

            {/* Name */}
            <Box>
              <Typography
                component="h1"
                sx={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: { xs: "1.9rem", sm: "2.4rem" },
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                {product.name}
              </Typography>
            </Box>

            {/* Price block */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: "rgba(255,253,248,0.90)",
                border: "1px solid rgba(67,48,34,0.10)",
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
                  <Typography
                    sx={{
                      fontFamily: SERIF,
                      fontWeight: 900,
                      fontSize: { xs: "2rem", sm: "2.4rem" },
                      lineHeight: 1,
                      color: compareAtPrice > price ? "error.main" : "text.primary",
                    }}
                  >
                    {money.format(price)}
                  </Typography>
                  {compareAtPrice > price && (
                    <Typography
                      sx={{
                        textDecoration: "line-through",
                        color: "text.disabled",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                      }}
                    >
                      {money.format(compareAtPrice)}
                    </Typography>
                  )}
                </Stack>

                {compareAtPrice > price && (
                  <Typography sx={{ color: "error.main", fontWeight: 800, fontSize: "0.85rem" }}>
                    Ahorrás {money.format(compareAtPrice - price)}
                  </Typography>
                )}

                {product.installments && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {product.installments}
                  </Typography>
                )}

                {transferPrice > 0 && (
                  <>
                    <Divider sx={{ my: 0.5 }} />
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: "text.secondary" }}>
                        Precio por transferencia:
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: SERIF,
                          fontWeight: 900,
                          fontSize: "1.3rem",
                          color: "secondary.main",
                        }}
                      >
                        {money.format(transferPrice)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Con depósito o transferencia bancaria. Coordinamos por WhatsApp.
                    </Typography>
                  </>
                )}
              </Stack>
            </Box>

            <Divider />

            {/* Description */}
            <Typography color="text.secondary" sx={{ lineHeight: 1.7, fontSize: "0.95rem" }}>
              {product.description}
            </Typography>

            <Divider />

            {/* Variants */}
            {product.variants?.length > 0 && (
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="color-label">Presentación</InputLabel>
                    <Select
                      labelId="color-label"
                      label="Presentación"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    >
                      {colors.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="size-label">Tamaño</InputLabel>
                    <Select
                      labelId="size-label"
                      label="Tamaño"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      {sizesForColor.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Inventory2OutlinedIcon sx={{ fontSize: "1rem", color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    Stock disponible:{" "}
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: 900,
                        color: stock > 0 ? "success.main" : "error.main",
                      }}
                    >
                      {stock > 0 ? `${stock} unidades` : "Sin stock"}
                    </Typography>
                  </Typography>
                </Stack>
              </Stack>
            )}

            {/* Quantity + Add */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>Cantidad</Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    border: "1.5px solid rgba(67,48,34,0.20)",
                    borderRadius: 1.5,
                    overflow: "hidden",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    sx={{ borderRadius: 0, px: 1.5 }}
                  >
                    <RemoveIcon sx={{ fontSize: "1rem" }} />
                  </IconButton>
                  <Typography sx={{ width: 36, textAlign: "center", fontWeight: 900, fontSize: "1rem" }}>
                    {qty}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    sx={{ borderRadius: 0, px: 1.5 }}
                  >
                    <AddIcon sx={{ fontSize: "1rem" }} />
                  </IconButton>
                </Box>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAdd}
                  disabled={!canAdd}
                  startIcon={<ShoppingBagOutlinedIcon />}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {canAdd ? "Agregar al carrito" : "Sin stock"}
                </Button>

                {whatsappHref && (
                  <Button
                    component="a"
                    href={`${whatsappHref}?text=${encodeURIComponent(`Hola! Quiero consultar sobre el producto: ${product.name}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="large"
                    startIcon={<WhatsAppIcon />}
                    sx={{ py: 1.5, flexShrink: 0 }}
                  >
                    Consultar
                  </Button>
                )}
              </Stack>
            </Stack>

            {/* Shipping info */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: "rgba(255,253,248,0.70)",
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LocalShippingOutlinedIcon sx={{ color: "text.secondary", fontSize: "1.1rem" }} />
                  <Stack>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.88rem" }}>Envío por VIA CARGO</Typography>
                    <Typography variant="caption" color="text.secondary">
                      El costo se coordina por WhatsApp según el destino.
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </Paper>

            {/* Back link */}
            <Button
              component={RouterLink}
              to="/products"
              variant="text"
              startIcon={<ArrowBackIcon />}
              sx={{ alignSelf: "flex-start", color: "text.secondary", fontSize: "0.85rem" }}
            >
              Seguir comprando
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={snack}
        autoHideDuration={2400}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnack(false)} severity="success" variant="filled">
          {qty > 1 ? `${qty}x ` : ""}Agregado: {product.name}
          {product.variants?.length ? ` · ${color} / ${size}` : ""}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
