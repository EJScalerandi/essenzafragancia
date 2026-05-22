import React, { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SearchIcon from "@mui/icons-material/Search";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";

import { buildApiUrl } from "../api/http.js";
import brandLogo from "../assets/karolina-logo.png";
import { BRAND } from "../branding/brand.js";
import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { useStore } from "../context/StoreContext.jsx";
import { getMinPrice, getPriceLabel } from "../utils/pricing.js";

const HOME_MAX_WIDTH = 1080;

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

function resolveImageUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/media/")) return buildApiUrl(url);
  return url;
}

function SectionShell({ children, sx }) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: HOME_MAX_WIDTH,
        mx: "auto",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function ProductHoverCard({ product, onAdd }) {
  const mainImage = resolveImageUrl(product.image);
  const alternateImage = resolveImageUrl(product.alternateImage || product.image);

  return (
    <Card
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 430,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: 1.5,
        overflow: "hidden",
        border: "1px solid rgba(17,17,17,0.08)",
        transformOrigin: "center center",
        transition: "transform 950ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 950ms cubic-bezier(0.16, 1, 0.3, 1), z-index 0ms",
        willChange: "transform",
        "& .hoverImage": {
          opacity: 0,
          transform: "scale(0.985)",
        },
        "& .productDetails": {
          transition: "opacity 420ms ease",
        },
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover": {
            zIndex: 40,
            transform: "scale(1.18)",
            boxShadow: "0 32px 70px rgba(17,17,17,0.24)",
          },
          "&:hover .hoverImage": {
            opacity: 1,
            transform: "scale(1)",
          },
          "&:hover .mainImage": {
            opacity: 0,
          },
          "&:hover .productDetails": {
            opacity: 0,
            pointerEvents: "none",
          },
        },
      }}
    >
      <CardActionArea component={RouterLink} to={`/products/${product.id}`} sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <Box sx={{ height: 240, position: "relative", bgcolor: "#f5f1eb", overflow: "hidden" }}>
          {mainImage ? (
            <Box
              component="img"
              className="mainImage"
              src={mainImage}
              alt={product.name}
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 420ms ease" }}
            />
          ) : null}
        </Box>

        <CardContent className="productDetails" sx={{ width: "100%", flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }} gap={1}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip size="small" label={product.category} />
              {(product.tags ?? []).slice(0, 1).map((t) => (
                <Chip key={t} size="small" label={t} color={tagColor(t)} />
              ))}
            </Stack>
            <Typography sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>
              {getPriceLabel(product)} {money.format(getMinPrice(product))}
            </Typography>
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {product.description}
          </Typography>
        </CardContent>
      </CardActionArea>

      <CardActions className="productDetails" sx={{ px: 2, pb: 2, mt: "auto" }}>
        <Button fullWidth variant="contained" onClick={() => onAdd(product)}>
          Agregar al carrito
        </Button>
      </CardActions>

      <Box
        className="hoverImage"
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          bgcolor: "#f5f1eb",
          transition: "opacity 700ms ease, transform 950ms cubic-bezier(0.16, 1, 0.3, 1)",
          display: "grid",
          placeItems: "center",
          p: 0,
          pointerEvents: "none",
        }}
      >
        {alternateImage ? (
          <Box
            component="img"
            src={alternateImage}
            alt={`${product.name} imagen alternativa`}
            sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        ) : (
          <Typography sx={{ fontWeight: 900 }}>{product.name}</Typography>
        )}
      </Box>
    </Card>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { addItem, count } = useCart();
  const { products } = useProducts();
  const { settings } = useStore();

  const [q, setQ] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("Agregado al carrito");

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const tags = useMemo(() => {
    const set = new Set();
    products.forEach((p) => (p.tags ?? []).forEach((tag) => tag && set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const heroImages = useMemo(() => {
    return (settings.homeImages || [])
      .filter((image) => image.enabled !== false && image.url)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [settings.homeImages]);

  const featured = useMemo(() => {
    const source = selectedTag
      ? products.filter((p) => (p.tags ?? []).includes(selectedTag))
      : products.filter((p) => (p.tags ?? []).includes("Destacado"));

    const fallback = selectedTag ? [] : products;
    return (source.length ? source : fallback).slice(0, 8);
  }, [products, selectedTag]);

  const goSearch = () => {
    const query = q.trim();
    if (!query) return navigate("/products");
    navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  const handleAdd = (p) => {
    addItem(p);
    setSnackMsg(`Agregado: ${p.name}`);
    setSnackOpen(true);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={4} alignItems="center" sx={{ width: "100%" }}>
        <SectionShell>
          <Paper
            sx={{
              position: "relative",
              overflow: "hidden",
              p: { xs: 2.25, sm: 3, md: 5 },
              borderRadius: { xs: 1.5, md: 2 },
              bgcolor: "#ffffff",
              border: "1px solid rgba(17,17,17,0.10)",
              boxShadow: "0 26px 80px rgba(17,17,17,0.10)",
              width: "100%",
              mx: "auto",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(17,17,17,0.06), transparent 44%), radial-gradient(circle at 90% 0%, rgba(159,143,114,0.22), transparent 34%)",
                pointerEvents: "none",
              },
            }}
          >
            <Grid container spacing={4} alignItems="center" justifyContent="center" sx={{ position: "relative" }}>
              <Grid
                item
                xs={12}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", justifyContent: "center" }}>
                  <Chip label={BRAND.segment} color="primary" />
                  <Chip label="Activewear" variant="outlined" />
                  <Chip label="Nueva colección" variant="outlined" />
                </Stack>

                <Typography
                  variant="h2"
                  sx={{
                    maxWidth: 720,
                    mx: "auto",
                    lineHeight: 0.95,
                    fontSize: { xs: 44, sm: 58, md: 76 },
                    textTransform: "uppercase",
                  }}
                >
                  {settings.storeName || BRAND.name}
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    fontSize: { xs: 14, sm: 16 },
                    fontWeight: 800,
                    letterSpacing: "0.45em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                  }}
                >
                  {BRAND.segment}
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 2, maxWidth: 620, mx: "auto", fontSize: { sm: 18 } }}>
                  Prendas activas, cómodas y minimalistas. Una experiencia simple para comprar,
                  consultar y seguir cada pedido desde la tienda.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 3, justifyContent: "center", alignItems: { xs: "stretch", sm: "center" } }}>
                  <Button component={RouterLink} to="/products" variant="contained" size="large" startIcon={<ShoppingBagOutlinedIcon />}>
                    Ver productos
                  </Button>
                  <Button component={RouterLink} to={count > 0 ? "/checkout" : "/cart"} variant="outlined" size="large">
                    {count > 0 ? "Finalizar compra" : "Ver carrito"}
                  </Button>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 3, width: "100%", maxWidth: 700, mx: "auto", justifyContent: "center" }}>
                  <TextField
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar remeras, conjuntos, abrigos..."
                    fullWidth
                    onKeyDown={(e) => { if (e.key === "Enter") goSearch(); }}
                    InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                    sx={{ bgcolor: "#ffffff", borderRadius: 1.25 }}
                  />
                  <Button variant="contained" onClick={goSearch} sx={{ px: 3 }}>Buscar</Button>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: "wrap", justifyContent: "center" }}>
                  {categories.map((c) => (
                    <Chip key={c} label={c} clickable variant="outlined" onClick={() => navigate(`/products?cat=${encodeURIComponent(c)}`)} sx={{ mb: 1, bgcolor: "rgba(255,255,255,0.72)" }} />
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
                <Paper variant="outlined" sx={{ width: "100%", maxWidth: 900, mx: "auto", p: { xs: 2, md: 3 }, borderRadius: 1, bgcolor: "rgba(255,255,255,0.78)", backdropFilter: "blur(8px)" }}>
                  <Box component="img" src={brandLogo} alt={`${BRAND.name} ${BRAND.segment}`} sx={{ display: "block", width: "72%", maxWidth: 300, mx: "auto", borderRadius: 1.25, mixBlendMode: "multiply" }} />
                  <Divider sx={{ my: 2 }} />

                  {heroImages.length ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
                      {heroImages.map((image, idx) => (
                        <Box key={image.id || image.url} component="img" src={resolveImageUrl(image.url)} alt={image.title || `Imagen de portada ${idx + 1}`} sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 1.25, border: "1px solid rgba(17,17,17,0.08)", boxShadow: "0 12px 28px rgba(17,17,17,0.10)" }} />
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ px: 2, py: 5, textAlign: "center", borderRadius: 1.5, bgcolor: "#f5f1eb", border: "1px dashed rgba(17,17,17,0.18)" }}>
                      <Typography sx={{ fontWeight: 900 }}>Karolin Active</Typography>
                      <Typography variant="body2" color="text.secondary">Nueva colección disponible.</Typography>
                    </Box>
                  )}

                  <Typography sx={{ mt: 2, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", textAlign: "center", fontSize: { xs: 24, sm: 30 }, lineHeight: 1.1 }}>
                    {BRAND.tagline}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </SectionShell>

        <SectionShell>
          <Grid container spacing={2} justifyContent="center">
            {[
              [<LocalShippingOutlinedIcon />, "Envíos coordinados", "La compra queda lista para coordinar entrega."],
              [<ReplayOutlinedIcon />, "Cambios simples", "Base preparada para gestionar pedidos y consultas."],
              [<VerifiedOutlinedIcon />, "Catálogo visual", "Imágenes y productos administrables."],
            ].map(([icon, title, text]) => (
              <Grid item xs={12} sm={6} md={4} key={title}>
                <Paper sx={{ p: 2.25, height: "100%", border: "1px solid rgba(17,17,17,0.08)" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: "#111111", color: "#ffffff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {icon}
                    </Box>
                    <Stack><Typography sx={{ fontWeight: 900 }}>{title}</Typography><Typography variant="body2" color="text.secondary">{text}</Typography></Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </SectionShell>

        <SectionShell>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "rgba(255,255,255,0.72)",
              borderColor: "rgba(17,17,17,0.08)",
              textAlign: "center",
            }}
          >
            <Stack spacing={1} alignItems="center">
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center" alignItems="center" spacing={1}>
                <Box>
                  <Typography sx={{ fontWeight: 900 }}>Filtrar por etiquetas</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usá las etiquetas para ver rápido productos destacados, nuevos u ofertas.
                  </Typography>
                </Box>
                {selectedTag ? (
                  <Button variant="text" onClick={() => setSelectedTag("")}>
                    Limpiar filtro
                  </Button>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
                <Chip
                  label="Todas"
                  clickable
                  color={!selectedTag ? "primary" : "default"}
                  variant={!selectedTag ? "filled" : "outlined"}
                  onClick={() => setSelectedTag("")}
                  sx={{ mb: 1 }}
                />
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    clickable
                    color={selectedTag === tag ? tagColor(tag) : "default"}
                    variant={selectedTag === tag ? "filled" : "outlined"}
                    onClick={() => setSelectedTag(tag)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Stack>
          </Paper>
        </SectionShell>

        <SectionShell>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center" alignItems="center" spacing={1.5} sx={{ textAlign: "center" }}>
            <Stack>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                {selectedTag ? `Productos con etiqueta ${selectedTag}` : "Colección destacada"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pasá el mouse por un producto para ver su imagen alternativa.
              </Typography>
            </Stack>
            <Button component={RouterLink} to={selectedTag ? `/products?tag=${encodeURIComponent(selectedTag)}` : "/products?tag=Destacado"} variant="text">
              Ver todos
            </Button>
          </Stack>
        </SectionShell>

        {featured.length === 0 ? (
          <SectionShell>
            <Alert severity="info">No hay productos con esa etiqueta.</Alert>
          </SectionShell>
        ) : null}

        <SectionShell sx={{ overflow: "visible" }}>
          <Grid container spacing={2} justifyContent="center" sx={{ overflow: "visible" }}>
            {featured.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id} sx={{ overflow: "visible", display: "flex" }}>
                <ProductHoverCard product={p} onAdd={handleAdd} />
              </Grid>
            ))}
          </Grid>
        </SectionShell>

        <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">{snackMsg}</Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
}
