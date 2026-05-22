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

import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import { buildApiUrl } from "../api/http.js";
import brandLogo from "../assets/essenza-logo.svg";
import { BRAND } from "../branding/brand.js";
import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { useStore } from "../context/StoreContext.jsx";
import { getMinPrice } from "../utils/pricing.js";

const HOME_MAX_WIDTH = 1120;

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

function hasStock(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  if (!variants.length) return true;
  return variants.some((variant) => Number(variant.stock || 0) > 0);
}

function SectionShell({ children, sx }) {
  return (
    <Box sx={{ width: "100%", maxWidth: HOME_MAX_WIDTH, mx: "auto", ...sx }}>
      {children}
    </Box>
  );
}

function ProductHoverCard({ product, onAdd }) {
  const mainImage = resolveImageUrl(product.image);
  const alternateImage = resolveImageUrl(product.alternateImage || product.image);
  const outOfStock = !hasStock(product);
  const price = getMinPrice(product);
  const compareAtPrice = Number(product.compareAtPrice || product.variants?.[0]?.compareAtPrice || 0);
  const transferPrice = Number(product.transferPrice || 0);

  return (
    <Card
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 460,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#fffdf8",
        transition:
          "transform 650ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 650ms cubic-bezier(0.16, 1, 0.3, 1)",
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: "0 34px 72px rgba(29,22,18,0.20)",
          },
          "&:hover .productImage": {
            transform: "scale(1.045)",
          },
        },
      }}
    >
      <CardActionArea component={RouterLink} to={`/products/${product.id}`} sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <Box sx={{ height: 255, position: "relative", bgcolor: "#f4eadb", overflow: "hidden" }}>
          {mainImage ? (
            <Box
              component="img"
              className="productImage"
              src={alternateImage || mainImage}
              alt={product.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 650ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          ) : null}

          <Stack direction="row" spacing={0.75} sx={{ position: "absolute", top: 12, left: 12, flexWrap: "wrap" }}>
            {(product.tags ?? []).slice(0, 2).map((tag) => (
              <Chip key={tag} size="small" label={tag} color={tagColor(tag)} sx={{ bgcolor: tag === "Oferta" ? undefined : "rgba(255,253,248,0.92)" }} />
            ))}
            {outOfStock ? <Chip size="small" label="Sin stock" color="default" sx={{ bgcolor: "rgba(255,253,248,0.92)" }} /> : null}
          </Stack>
        </Box>

        <CardContent sx={{ width: "100%", flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 1 }}>
            <Chip size="small" label={product.category} variant="outlined" />
            <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
              {compareAtPrice > price ? (
                <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through", fontWeight: 800 }}>
                  {money.format(compareAtPrice)}
                </Typography>
              ) : null}
              <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>{money.format(price)}</Typography>
            </Stack>
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: "-0.03em", lineHeight: 1.12 }}>
            {product.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {product.description}
          </Typography>

          {transferPrice > 0 ? (
            <Paper
              variant="outlined"
              sx={{
                mt: 1.5,
                px: 1.25,
                py: 1,
                bgcolor: "rgba(200,164,93,0.12)",
                borderColor: "rgba(200,164,93,0.35)",
              }}
            >
              <Typography variant="caption" sx={{ display: "block", fontWeight: 900, color: "text.primary" }}>
                Transferencia o depósito: {money.format(transferPrice)}
              </Typography>
              {product.installments ? (
                <Typography variant="caption" color="text.secondary">
                  {product.installments}
                </Typography>
              ) : null}
            </Paper>
          ) : null}
        </CardContent>
      </CardActionArea>

      <CardActions sx={{ px: 2, pb: 2, mt: "auto" }}>
        <Button fullWidth variant="contained" disabled={outOfStock} onClick={() => onAdd(product)}>
          {outOfStock ? "Sin stock" : "Agregar al carrito"}
        </Button>
      </CardActions>
    </Card>
  );
}

function ProductSection({ title, subtitle, products, actionTo, onAdd }) {
  if (!products.length) return null;

  return (
    <SectionShell sx={{ overflow: "visible" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 2 }}>
        <Stack>
          <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: "-0.03em" }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>
        <Button component={RouterLink} to={actionTo} variant="text">
          Ver todos
        </Button>
      </Stack>

      <Grid container spacing={2} justifyContent="center" sx={{ overflow: "visible" }}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id} sx={{ overflow: "visible", display: "flex" }}>
            <ProductHoverCard product={product} onAdd={onAdd} />
          </Grid>
        ))}
      </Grid>
    </SectionShell>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { addItem, count } = useCart();
  const { products } = useProducts();
  const { settings } = useStore();

  const [q, setQ] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("Agregado al carrito");

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const heroImages = useMemo(() => {
    return (settings.homeImages || [])
      .filter((image) => image.enabled !== false && image.url)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [settings.homeImages]);

  const offers = useMemo(() => products.filter((p) => (p.tags ?? []).includes("Oferta")).slice(0, 6), [products]);
  const featured = useMemo(() => products.filter((p) => (p.tags ?? []).includes("Destacado")).slice(0, 6), [products]);
  const newest = useMemo(() => products.filter((p) => (p.tags ?? []).includes("Nuevo")).slice(0, 6), [products]);

  const whatsappHref = useMemo(() => {
    const raw = settings.contactLinks?.whatsappNumber || "543572585775";
    const digits = String(raw).replace(/\D+/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }, [settings.contactLinks?.whatsappNumber]);

  const goSearch = () => {
    const query = q.trim();
    if (!query) return navigate("/products");
    navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  const handleAdd = (product) => {
    if (!hasStock(product)) return;
    addItem(product);
    setSnackMsg(`Agregado: ${product.name}`);
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
              borderRadius: 3,
              bgcolor: "#fffdf8",
              border: "1px solid rgba(67,48,34,0.12)",
              boxShadow: "0 34px 90px rgba(29,22,18,0.14)",
              width: "100%",
              mx: "auto",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(200,164,93,0.20), transparent 46%), radial-gradient(circle at 90% 0%, rgba(29,22,18,0.12), transparent 36%)",
                pointerEvents: "none",
              },
            }}
          >
            <Grid container spacing={4} alignItems="center" sx={{ position: "relative" }}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2.25} alignItems={{ xs: "center", md: "flex-start" }} textAlign={{ xs: "center", md: "left" }}>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: { xs: "center", md: "flex-start" } }}>
                    <Chip label="3 cuotas sin interés" color="secondary" />
                    <Chip label="Envío gratis en seleccionados" variant="outlined" />
                    <Chip label="VIA CARGO" variant="outlined" />
                  </Stack>

                  <Box component="img" src={brandLogo} alt={`${BRAND.name} logo`} sx={{ width: { xs: 210, sm: 280 }, maxWidth: "100%" }} />

                  <Typography
                    variant="h2"
                    sx={{
                      maxWidth: 620,
                      lineHeight: 0.96,
                      fontSize: { xs: 42, sm: 58, md: 72 },
                      textTransform: "uppercase",
                    }}
                  >
                    {settings.storeName || BRAND.name}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 14 },
                      fontWeight: 900,
                      letterSpacing: "0.32em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    {BRAND.segment}
                  </Typography>

                  <Typography color="text.secondary" sx={{ maxWidth: 560, fontSize: { sm: 18 } }}>
                    Perfumes árabes, diseñador, nicho y decants. Una tienda preparada para mostrar ofertas, productos destacados y compras con coordinación por WhatsApp.
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ justifyContent: { xs: "center", md: "flex-start" }, alignItems: { xs: "stretch", sm: "center" } }}>
                    <Button component={RouterLink} to="/products" variant="contained" size="large" startIcon={<ShoppingBagOutlinedIcon />}>
                      Ver perfumes
                    </Button>
                    <Button component={RouterLink} to={count > 0 ? "/checkout" : "/cart"} variant="outlined" size="large">
                      {count > 0 ? "Finalizar compra" : "Ver carrito"}
                    </Button>
                    {whatsappHref ? (
                      <Button component="a" href={whatsappHref} target="_blank" rel="noopener noreferrer" variant="text" size="large" startIcon={<WhatsAppIcon />}>
                        WhatsApp
                      </Button>
                    ) : null}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ width: "100%", maxWidth: 620 }}>
                    <TextField
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar perfume, marca, decant..."
                      fullWidth
                      onKeyDown={(e) => {
                        if (e.key === "Enter") goSearch();
                      }}
                      InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
                      sx={{ bgcolor: "#fffdf8", borderRadius: 1.25 }}
                    />
                    <Button variant="contained" onClick={goSearch} sx={{ px: 3 }}>
                      Buscar
                    </Button>
                  </Stack>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  variant="outlined"
                  sx={{
                    width: "100%",
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 2,
                    bgcolor: "rgba(255,253,248,0.78)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {heroImages.length ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.25 }}>
                      {heroImages.slice(0, 4).map((image, idx) => (
                        <Box
                          key={image.id || image.url}
                          component="img"
                          src={resolveImageUrl(image.url)}
                          alt={image.title || `Imagen de portada ${idx + 1}`}
                          sx={{
                            width: "100%",
                            aspectRatio: "4 / 5",
                            objectFit: "cover",
                            borderRadius: 1.5,
                            border: "1px solid rgba(67,48,34,0.10)",
                            boxShadow: "0 16px 32px rgba(29,22,18,0.10)",
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ px: 2, py: 5, textAlign: "center", borderRadius: 1.5, bgcolor: "#f4eadb", border: "1px dashed rgba(67,48,34,0.22)" }}>
                      <Typography sx={{ fontWeight: 950 }}>Essenza Fragancia</Typography>
                      <Typography variant="body2" color="text.secondary">Catálogo de perfumes disponible.</Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic", textAlign: "center", fontSize: { xs: 22, sm: 28 }, lineHeight: 1.1 }}>
                    Fragancias que dejan huella.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </SectionShell>

        <SectionShell>
          <Grid container spacing={2} justifyContent="center">
            {[
              [<PaymentsOutlinedIcon />, "Transferencia con precio especial", "Mostramos el valor regular, oferta y precio por transferencia."],
              [<LocalShippingOutlinedIcon />, "Envíos por VIA CARGO", "El costo se coordina por WhatsApp según destino."],
              [<VerifiedOutlinedIcon />, "Perfumes y decants", "Catálogo listo para diseñador, árabes, nicho y decants 5ML."],
            ].map(([icon, title, text]) => (
              <Grid item xs={12} sm={6} md={4} key={title}>
                <Paper sx={{ p: 2.25, height: "100%", border: "1px solid rgba(67,48,34,0.10)" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ width: 44, height: 44, borderRadius: 1.25, bgcolor: "#1d1612", color: "#c8a45d", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {icon}
                    </Box>
                    <Stack>
                      <Typography sx={{ fontWeight: 950 }}>{title}</Typography>
                      <Typography variant="body2" color="text.secondary">{text}</Typography>
                    </Stack>
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
              borderRadius: 2,
              bgcolor: "rgba(255,253,248,0.74)",
              borderColor: "rgba(67,48,34,0.10)",
              textAlign: "center",
            }}
          >
            <Stack spacing={1} alignItems="center">
              <Typography sx={{ fontWeight: 950 }}>Categorías</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    clickable
                    variant="outlined"
                    onClick={() => navigate(`/products?cat=${encodeURIComponent(category)}`)}
                    sx={{ mb: 1, bgcolor: "rgba(255,253,248,0.72)" }}
                  />
                ))}
              </Stack>
            </Stack>
          </Paper>
        </SectionShell>

        <ProductSection
          title="Ofertas"
          subtitle="Productos con descuento y precio especial por transferencia."
          products={offers}
          actionTo="/products?tag=Oferta"
          onAdd={handleAdd}
        />

        <ProductSection
          title="Destacados"
          subtitle="Selección principal de Essenza Fragancia."
          products={featured}
          actionTo="/products?tag=Destacado"
          onAdd={handleAdd}
        />

        <SectionShell>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              textAlign: "center",
              bgcolor: "#1d1612",
              color: "#fffdf8",
              border: "1px solid rgba(200,164,93,0.40)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 950 }}>
              Medios de envío
            </Typography>
            <Typography sx={{ mt: 1, color: "rgba(255,253,248,0.78)" }}>
              Trabajamos con VIA CARGO. Coordinamos el costo y los detalles de entrega por WhatsApp.
            </Typography>
            {whatsappHref ? (
              <Button component="a" href={whatsappHref} target="_blank" rel="noopener noreferrer" variant="contained" color="secondary" sx={{ mt: 2 }} startIcon={<WhatsAppIcon />}>
                Consultar por WhatsApp
              </Button>
            ) : null}
          </Paper>
        </SectionShell>

        <ProductSection
          title="NUEVO!!!"
          subtitle="Últimos ingresos y combos para probar más fragancias."
          products={newest}
          actionTo="/products?tag=Nuevo"
          onAdd={handleAdd}
        />

        {products.length === 0 ? (
          <SectionShell>
            <Alert severity="info">Todavía no hay productos cargados.</Alert>
          </SectionShell>
        ) : null}

        <Snackbar open={snackOpen} autoHideDuration={2000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">{snackMsg}</Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
}
