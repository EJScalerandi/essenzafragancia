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
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
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

const HOME_MAX_WIDTH = 1400;
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

function SectionHeader({ title, subtitle, actionTo, italic }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 3 }}>
      <Stack spacing={0.5}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: SERIF,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            fontStyle: italic ? "italic" : "normal",
            lineHeight: 1.1,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </Stack>
      {actionTo && (
        <Button
          component={RouterLink}
          to={actionTo}
          variant="outlined"
          size="small"
          sx={{ flexShrink: 0, borderRadius: 2 }}
        >
          Ver todos
        </Button>
      )}
    </Stack>
  );
}

function ProductCard({ product, onAdd }) {
  const [hovered, setHovered] = useState(false);
  const mainImage = resolveImageUrl(product.image);
  const alternateImage = resolveImageUrl(product.alternateImage || product.image);
  const outOfStock = !hasStock(product);
  const price = getMinPrice(product);
  const compareAtPrice = Number(product.compareAtPrice || product.variants?.[0]?.compareAtPrice || 0);
  const transferPrice = Number(product.transferPrice || 0);

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 480,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#fffdf8",
        transition: "transform 500ms cubic-bezier(0.16,1,0.3,1), box-shadow 500ms cubic-bezier(0.16,1,0.3,1)",
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 28px 64px rgba(29,22,18,0.18)",
          },
        },
      }}
    >
      <CardActionArea
        component={RouterLink}
        to={`/products/${product.id}`}
        sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}
      >
        <Box sx={{ height: 280, position: "relative", bgcolor: "#f4eadb", overflow: "hidden", flexShrink: 0 }}>
          {mainImage ? (
            <Box
              component="img"
              src={hovered && alternateImage ? alternateImage : mainImage}
              alt={product.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 600ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease",
                transform: hovered ? "scale(1.06)" : "scale(1)",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
                bgcolor: "#f4eadb",
              }}
            >
              <Typography sx={{ color: "text.disabled", fontSize: 12 }}>Sin imagen</Typography>
            </Box>
          )}

          {/* Image overlay on hover */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(29,22,18,0.40) 0%, transparent 50%)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 300ms ease",
              pointerEvents: "none",
            }}
          />

          <Stack direction="row" spacing={0.75} sx={{ position: "absolute", top: 10, left: 10, flexWrap: "wrap" }}>
            {(product.tags ?? []).slice(0, 2).map((tag) => (
              <Chip
                key={tag}
                size="small"
                label={tag}
                color={tagColor(tag)}
                sx={{ bgcolor: tag === "Oferta" ? undefined : "rgba(255,253,248,0.94)", backdropFilter: "blur(4px)" }}
              />
            ))}
            {outOfStock && (
              <Chip size="small" label="Sin stock" color="default" sx={{ bgcolor: "rgba(255,253,248,0.94)" }} />
            )}
          </Stack>

          {/* Price badge on hover */}
          <Box
            sx={{
              position: "absolute",
              bottom: 12,
              right: 12,
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 280ms ease, transform 280ms ease",
            }}
          >
            <Paper
              sx={{
                px: 1.5,
                py: 0.75,
                bgcolor: "#1d1612",
                color: "#c8a45d",
                borderRadius: 1.5,
              }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", lineHeight: 1 }}>
                {money.format(price)}
              </Typography>
            </Paper>
          </Box>
        </Box>

        <CardContent sx={{ width: "100%", flexGrow: 1, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 1 }}>
            <Chip size="small" label={product.category} variant="outlined" />
            <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
              {compareAtPrice > price && (
                <Typography variant="caption" color="text.disabled" sx={{ textDecoration: "line-through", fontWeight: 700, fontSize: "0.7rem" }}>
                  {money.format(compareAtPrice)}
                </Typography>
              )}
              <Typography sx={{ fontWeight: 900, fontSize: "1rem", color: compareAtPrice > price ? "error.main" : "text.primary" }}>
                {money.format(price)}
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="h6"
            sx={{
              fontFamily: SERIF,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {product.name}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
            {product.description}
          </Typography>

          {transferPrice > 0 && (
            <Box
              sx={{
                mt: 1.5,
                px: 1.25,
                py: 0.85,
                bgcolor: "rgba(200,164,93,0.13)",
                borderRadius: 1.5,
                border: "1px solid rgba(200,164,93,0.30)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 900, color: "text.primary", display: "block" }}>
                Transferencia: {money.format(transferPrice)}
              </Typography>
              {product.installments && (
                <Typography variant="caption" color="text.secondary">
                  {product.installments}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </CardActionArea>

      <CardActions sx={{ px: 2, pb: 2, pt: 0.5 }}>
        <Button
          fullWidth
          variant={outOfStock ? "outlined" : "contained"}
          disabled={outOfStock}
          onClick={() => onAdd(product)}
          startIcon={!outOfStock ? <ShoppingBagOutlinedIcon sx={{ fontSize: "1rem" }} /> : undefined}
          size="medium"
        >
          {outOfStock ? "Sin stock" : "Agregar al carrito"}
        </Button>
      </CardActions>
    </Card>
  );
}

function ProductSection({ title, subtitle, products, actionTo, onAdd, italic }) {
  if (!products.length) return null;

  return (
    <SectionShell sx={{ overflow: "visible" }}>
      <SectionHeader title={title} subtitle={subtitle} actionTo={actionTo} italic={italic} />
      <Grid container spacing={2.5} justifyContent="center" sx={{ overflow: "visible" }}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id} sx={{ overflow: "visible", display: "flex" }}>
            <ProductCard product={product} onAdd={onAdd} />
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
      <Stack spacing={6} alignItems="center" sx={{ width: "100%" }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <SectionShell>
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 3,
              bgcolor: "#fffdf8",
              border: "1px solid rgba(67,48,34,0.10)",
              boxShadow: "0 24px 80px rgba(29,22,18,0.12)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(200,164,93,0.22) 0%, transparent 45%), radial-gradient(ellipse at 85% 5%, rgba(29,22,18,0.10) 0%, transparent 40%)",
                pointerEvents: "none",
                zIndex: 0,
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, position: "relative", zIndex: 1 }}>
              {/* Left: text */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 50%" }, width: { md: "50%" }, p: { xs: 3, sm: 4, md: 5 } }}>
                <Stack spacing={3} alignItems={{ xs: "center", md: "flex-start" }} textAlign={{ xs: "center", md: "left" }}>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: { xs: "center", md: "flex-start" } }}>
                    <Chip label="3 cuotas sin interés" color="secondary" size="small" icon={<AutoAwesomeIcon sx={{ fontSize: "0.85rem !important" }} />} />
                    <Chip label="Envío VIA CARGO" variant="outlined" size="small" />
                  </Stack>

                  <Box component="img" src={brandLogo} alt={`${BRAND.name} logo`} sx={{ width: { xs: 180, sm: 230 }, maxWidth: "100%", filter: "drop-shadow(0 2px 8px rgba(29,22,18,0.14))" }} />

                  <Box>
                    <Typography
                      component="h1"
                      sx={{
                        fontFamily: SERIF,
                        fontWeight: 900,
                        fontSize: { xs: "2.6rem", sm: "3.4rem", md: "4.2rem" },
                        lineHeight: 0.95,
                        letterSpacing: "-0.025em",
                        textTransform: "uppercase",
                        "& em": {
                          fontStyle: "italic",
                          color: "#c8a45d",
                        },
                      }}
                    >
                      {settings.storeName || BRAND.name}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 1.5,
                        fontSize: { xs: "0.68rem", sm: "0.75rem" },
                        fontWeight: 800,
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      {BRAND.segment}
                    </Typography>
                  </Box>

                  <Typography
                    color="text.secondary"
                    sx={{ maxWidth: 480, fontSize: { xs: "0.9rem", sm: "1rem" }, lineHeight: 1.65, fontWeight: 400 }}
                  >
                    Perfumes árabes, diseñador, nicho y decants. Fragancias originales con precio especial por transferencia.
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    sx={{ justifyContent: { xs: "center", md: "flex-start" }, alignItems: { xs: "stretch", sm: "center" }, width: "100%" }}
                  >
                    <Button
                      component={RouterLink}
                      to="/products"
                      variant="contained"
                      size="large"
                      startIcon={<ShoppingBagOutlinedIcon />}
                      sx={{ px: 3, py: 1.4 }}
                    >
                      Ver perfumes
                    </Button>
                    {whatsappHref && (
                      <Button
                        component="a"
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="large"
                        startIcon={<WhatsAppIcon />}
                        sx={{ py: 1.4 }}
                      >
                        Consultar
                      </Button>
                    )}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%", maxWidth: 520 }}>
                    <TextField
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar fragancia, marca, decant..."
                      fullWidth
                      size="small"
                      onKeyDown={(e) => { if (e.key === "Enter") goSearch(); }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: "1.1rem", color: "text.secondary" }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button variant="contained" onClick={goSearch} size="small" sx={{ px: 2.5, flexShrink: 0 }}>
                      Buscar
                    </Button>
                  </Stack>
                </Stack>
              </Box>

              {/* Right: images */}
              <Box sx={{ flex: { xs: "1 1 100%", md: "0 0 50%" }, width: { md: "50%" }, p: { xs: 2, md: 3 }, display: "flex", alignItems: "center" }}>
                {heroImages.length ? (
                  <Box
                    sx={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gridTemplateRows: "repeat(2, 1fr)",
                      gap: 1.5,
                      aspectRatio: { md: "1 / 1.05" },
                    }}
                  >
                    {heroImages.slice(0, 4).map((image, idx) => (
                      <Box
                        key={image.id || image.url}
                        component="img"
                        src={resolveImageUrl(image.url)}
                        alt={image.title || `Imagen ${idx + 1}`}
                        sx={{
                          width: "100%",
                          height: "100%",
                          aspectRatio: idx === 0 ? "4 / 5" : "4 / 5",
                          objectFit: "cover",
                          borderRadius: 2,
                          border: "1px solid rgba(67,48,34,0.08)",
                          boxShadow: "0 8px 28px rgba(29,22,18,0.10)",
                          transition: "transform 400ms ease, box-shadow 400ms ease",
                          "&:hover": {
                            transform: "scale(1.02)",
                            boxShadow: "0 16px 40px rgba(29,22,18,0.18)",
                          },
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      py: { xs: 3, md: 8 },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        bgcolor: "rgba(200,164,93,0.15)",
                        border: "2px solid rgba(200,164,93,0.30)",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <AutoAwesomeIcon sx={{ fontSize: 44, color: "#c8a45d" }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        fontSize: { xs: "1.5rem", sm: "1.9rem" },
                        textAlign: "center",
                        lineHeight: 1.2,
                        color: "text.secondary",
                      }}
                    >
                      Fragancias que<br />dejan huella.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Bottom quote bar */}
            <Box
              sx={{
                borderTop: "1px solid rgba(67,48,34,0.08)",
                px: { xs: 3, md: 5 },
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                bgcolor: "rgba(200,164,93,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: { xs: "1rem", sm: "1.15rem" },
                  color: "text.secondary",
                  textAlign: "center",
                }}
              >
                Fragancias que dejan huella.
              </Typography>
            </Box>
          </Box>
        </SectionShell>

        {/* ── TRUST STRIP ──────────────────────────────────────── */}
        <SectionShell>
          <Grid container spacing={2}>
            {[
              {
                icon: <PaymentsOutlinedIcon />,
                title: "Precio especial por transferencia",
                text: "Además del precio regular y de oferta, mostramos el valor por transferencia.",
              },
              {
                icon: <LocalShippingOutlinedIcon />,
                title: "Envíos por VIA CARGO",
                text: "Coordinamos el costo y los detalles de entrega por WhatsApp según destino.",
              },
              {
                icon: <VerifiedOutlinedIcon />,
                title: "Fragancias originales",
                text: "Diseñador, árabes, nicho y decants de 5ML seleccionados.",
              },
            ].map(({ icon, title, text }) => (
              <Grid item xs={12} sm={4} key={title}>
                <Paper
                  sx={{
                    p: 2.5,
                    height: "100%",
                    border: "1px solid rgba(67,48,34,0.09)",
                    bgcolor: "rgba(255,253,248,0.80)",
                    transition: "box-shadow 250ms ease",
                    "&:hover": { boxShadow: "0 8px 32px rgba(29,22,18,0.10)" },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: 1.5,
                        bgcolor: "#1d1612",
                        color: "#c8a45d",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {icon}
                    </Box>
                    <Stack spacing={0.3}>
                      <Typography sx={{ fontWeight: 900, fontSize: "0.92rem", lineHeight: 1.25 }}>{title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", lineHeight: 1.5 }}>{text}</Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </SectionShell>

        {/* ── CATEGORIES ───────────────────────────────────────── */}
        {categories.length > 0 && (
          <SectionShell>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ height: 2, flex: 1, bgcolor: "rgba(67,48,34,0.12)", borderRadius: 1 }} />
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    px: 1,
                  }}
                >
                  Explorar por categoría
                </Typography>
                <Box sx={{ height: 2, flex: 1, bgcolor: "rgba(67,48,34,0.12)", borderRadius: 1 }} />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    clickable
                    variant="outlined"
                    onClick={() => navigate(`/products?cat=${encodeURIComponent(category)}`)}
                    sx={{
                      mb: 1,
                      bgcolor: "rgba(255,253,248,0.90)",
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      borderColor: "rgba(67,48,34,0.18)",
                      "&:hover": {
                        bgcolor: "#1d1612",
                        color: "#fffdf8",
                        borderColor: "#1d1612",
                      },
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </SectionShell>
        )}

        {/* ── OFERTAS ──────────────────────────────────────────── */}
        <ProductSection
          title="Ofertas"
          subtitle="Productos con descuento y precio especial por transferencia."
          products={offers}
          actionTo="/products?tag=Oferta"
          onAdd={handleAdd}
        />

        {/* ── ENVÍOS BANNER ────────────────────────────────────── */}
        <SectionShell>
          <Box
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              background: "linear-gradient(135deg, #1d1612 0%, #2e2019 100%)",
              color: "#fffdf8",
              border: "1px solid rgba(200,164,93,0.25)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                bgcolor: "rgba(200,164,93,0.08)",
                pointerEvents: "none",
              },
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={0.75}>
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: { xs: "1.4rem", sm: "1.7rem" },
                    lineHeight: 1.1,
                  }}
                >
                  Enviamos a todo el país
                </Typography>
                <Typography sx={{ color: "rgba(255,253,248,0.72)", fontSize: "0.9rem", maxWidth: 420 }}>
                  Trabajamos con VIA CARGO. Coordinamos el costo y los detalles de entrega por WhatsApp.
                </Typography>
              </Stack>
              {whatsappHref && (
                <Button
                  component="a"
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  color="secondary"
                  startIcon={<WhatsAppIcon />}
                  sx={{ px: 3, py: 1.4, flexShrink: 0 }}
                >
                  Consultar por WhatsApp
                </Button>
              )}
            </Stack>
          </Box>
        </SectionShell>

        {/* ── DESTACADOS ───────────────────────────────────────── */}
        <ProductSection
          title="Destacados"
          italic
          subtitle="La selección principal de Essenza Fragancia."
          products={featured}
          actionTo="/products?tag=Destacado"
          onAdd={handleAdd}
        />

        {/* ── NUEVOS ───────────────────────────────────────────── */}
        <ProductSection
          title="Nuevos ingresos"
          subtitle="Últimas incorporaciones y combos para probar más fragancias."
          products={newest}
          actionTo="/products?tag=Nuevo"
          onAdd={handleAdd}
        />

        {products.length === 0 && (
          <SectionShell>
            <Alert severity="info" variant="outlined">
              Todavía no hay productos cargados.
            </Alert>
          </SectionShell>
        )}

        <Snackbar
          open={snackOpen}
          autoHideDuration={2200}
          onClose={() => setSnackOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
            {snackMsg}
          </Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
}
