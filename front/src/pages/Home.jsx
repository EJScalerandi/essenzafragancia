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
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import { resolveMediaUrl } from "../api/http.js";
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
            color: "#fffdf8",
            textShadow: "0 2px 10px rgba(0,0,0,0.45)",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ fontWeight: 500, color: "rgba(255,253,248,0.78)", textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}>
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
          sx={{
            flexShrink: 0,
            borderRadius: 2,
            color: "#fffdf8",
            borderColor: "rgba(255,253,248,0.5)",
            "&:hover": { borderColor: "#fffdf8", bgcolor: "rgba(255,253,248,0.08)" },
          }}
        >
          Ver todos
        </Button>
      )}
    </Stack>
  );
}

function ProductCard({ product, onAdd }) {
  const [hovered, setHovered] = useState(false);
  const mainImage = resolveMediaUrl(product.image);
  const alternateImage = resolveMediaUrl(product.alternateImage || product.image);
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
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.4em",
            }}
          >
            {product.name}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: "0.82rem",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "3.6em",
            }}
          >
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
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={product.id} sx={{ overflow: "visible", display: "flex" }}>
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

  // El Hero usa una sola imagen (la primera habilitada) como fondo completo.
  const heroImage = heroImages[0] || null;

  const promotions = useMemo(() => {
    return (settings.promotions || [])
      .filter((promo) => promo.enabled !== false)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  }, [settings.promotions]);

  const offers = useMemo(() => products.filter((p) => (p.tags ?? []).includes("Oferta")).slice(0, 6), [products]);
  const featured = useMemo(() => products.filter((p) => (p.tags ?? []).includes("Destacado")).slice(0, 6), [products]);
  const newest = useMemo(() => products.filter((p) => (p.tags ?? []).includes("Nuevo")).slice(0, 6), [products]);
  const accessories = useMemo(() => products.filter((p) => p.category === "Accesorios").slice(0, 6), [products]);

  const whatsappHref = useMemo(() => {
    const raw = settings.contactLinks?.whatsappNumber || "543572585775";
    const digits = String(raw).replace(/\D+/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }, [settings.contactLinks?.whatsappNumber]);

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
        {/* Es solo la imagen que carga el dueño desde /admin/home-images: el diseño (texto, CTAs, etc.) ya viene resuelto en esa imagen. */}
        <SectionShell>
          {heroImage ? (
            <Box
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                boxShadow: "0 24px 80px rgba(29,22,18,0.12)",
              }}
            >
              <Box
                component="img"
                src={resolveMediaUrl(heroImage.url)}
                alt={heroImage.title || settings.storeName || "Essenza Fragancia"}
                sx={{ display: "block", width: "100%", height: "auto" }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                borderRadius: 3,
                border: "1px dashed rgba(67,48,34,0.25)",
                bgcolor: "#fffdf8",
                py: { xs: 6, md: 9 },
                px: 3,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontFamily: SERIF, fontStyle: "italic", fontSize: { xs: "1.3rem", sm: "1.6rem" }, color: "text.secondary" }}>
                Subí la imagen de portada desde /admin/home-images.
              </Typography>
            </Box>
          )}
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
                text: "Coordinamos el costo y los detalles de entrega por WhatsApp según destino. Los precios no incluyen el envío.",
              },
              {
                icon: <VerifiedOutlinedIcon />,
                title: "Fragancias originales",
                text: "Diseñador, árabes, nicho y decants de 5ML seleccionados.",
              },
            ].map(({ icon, title, text }) => (
              <Grid size={{ xs: 12, sm: 4 }} key={title}>
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

        {/* ── PROMOCIONES POR MONTO DE COMPRA ─────────────────── */}
        {promotions.length > 0 && (
          <SectionShell>
            <SectionHeader
              title="Beneficios por tu compra"
              subtitle="Sumá regalos según el monto de tu pedido."
            />
            <Grid container spacing={2}>
              {promotions.map((promo) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={promo.id}>
                  <Paper
                    sx={{
                      p: 2.5,
                      height: "100%",
                      border: "1px solid rgba(200,164,93,0.32)",
                      bgcolor: "rgba(200,164,93,0.08)",
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
                        <CardGiftcardIcon />
                      </Box>
                      <Stack spacing={0.4}>
                        <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", lineHeight: 1.25 }}>
                          {promo.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                          {promo.description}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#a9812f" }}>
                          Desde {money.format(promo.minAmount)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </SectionShell>
        )}

        {/* ── CATEGORIES ───────────────────────────────────────── */}
        {categories.length > 0 && (
          <SectionShell>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ height: 2, flex: 1, bgcolor: "rgba(255,253,248,0.22)", borderRadius: 1 }} />
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "rgba(255,253,248,0.85)",
                    textShadow: "0 1px 6px rgba(0,0,0,0.4)",
                    px: 1,
                  }}
                >
                  Explorar por categoría
                </Typography>
                <Box sx={{ height: 2, flex: 1, bgcolor: "rgba(255,253,248,0.22)", borderRadius: 1 }} />
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

        {/* ── ACCESORIOS ───────────────────────────────────────── */}
        <ProductSection
          title="Accesorios"
          subtitle="Sumá un plus a tu fragancia."
          products={accessories}
          actionTo="/products?cat=Accesorios"
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
