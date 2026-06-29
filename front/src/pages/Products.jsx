import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import TuneIcon from "@mui/icons-material/Tune";

import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { getMinPrice } from "../utils/pricing.js";

const SERIF = '"Playfair Display", Georgia, serif';

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const PAGE_SIZE = 9;

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

function ProductCard({ product, onAdd }) {
  const [hovered, setHovered] = useState(false);
  const outOfStock = !hasStock(product);
  const price = getMinPrice(product);
  const compareAtPrice = Number(product.compareAtPrice || product.variants?.[0]?.compareAtPrice || 0);
  const transferPrice = Number(product.transferPrice || 0);

  return (
    <Card
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "transform 450ms cubic-bezier(0.16,1,0.3,1), box-shadow 450ms cubic-bezier(0.16,1,0.3,1)",
        "@media (hover: hover) and (pointer: fine)": {
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 24px 56px rgba(29,22,18,0.17)",
          },
        },
      }}
    >
      <CardActionArea component={RouterLink} to={`/products/${product.id}`} sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        {/* Image */}
        <Box sx={{ position: "relative", height: 260, bgcolor: "#f4eadb", overflow: "hidden", flexShrink: 0 }}>
          {product.image ? (
            <Box
              component="img"
              src={product.image}
              alt={product.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 550ms cubic-bezier(0.16,1,0.3,1)",
                transform: hovered ? "scale(1.07)" : "scale(1)",
              }}
            />
          ) : (
            <Box sx={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
              <Typography sx={{ color: "text.disabled", fontSize: 12 }}>Sin imagen</Typography>
            </Box>
          )}

          {/* Gradient overlay on hover */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(29,22,18,0.36) 0%, transparent 55%)",
              opacity: hovered ? 1 : 0,
              transition: "opacity 300ms ease",
              pointerEvents: "none",
            }}
          />

          {/* Tags */}
          <Stack direction="row" spacing={0.75} sx={{ position: "absolute", top: 10, left: 10, flexWrap: "wrap" }}>
            {(product.tags ?? []).slice(0, 2).map((t) => (
              <Chip
                key={t}
                size="small"
                label={t}
                color={tagColor(t)}
                sx={{ backdropFilter: "blur(4px)", bgcolor: t === "Oferta" ? undefined : "rgba(255,253,248,0.92)" }}
              />
            ))}
            {outOfStock && <Chip size="small" label="Sin stock" sx={{ bgcolor: "rgba(255,253,248,0.92)" }} />}
          </Stack>

          {/* Price on hover */}
          <Box
            sx={{
              position: "absolute",
              bottom: 10,
              right: 10,
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 260ms ease, transform 260ms ease",
            }}
          >
            <Paper sx={{ px: 1.25, py: 0.6, bgcolor: "#1d1612", color: "#c8a45d", borderRadius: 1.5 }}>
              <Typography sx={{ fontWeight: 900, fontSize: "0.88rem", lineHeight: 1 }}>
                {money.format(price)}
              </Typography>
            </Paper>
          </Box>
        </Box>

        {/* Content */}
        <CardContent sx={{ flexGrow: 1, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }} gap={1}>
            <Chip size="small" label={product.category} variant="outlined" />
            <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
              {compareAtPrice > price && (
                <Typography variant="caption" sx={{ textDecoration: "line-through", color: "text.disabled", fontWeight: 700, fontSize: "0.7rem" }}>
                  {money.format(compareAtPrice)}
                </Typography>
              )}
              <Typography sx={{ fontWeight: 900, fontSize: "0.98rem", color: compareAtPrice > price ? "error.main" : "text.primary" }}>
                {money.format(price)}
              </Typography>
            </Stack>
          </Stack>

          <Typography
            variant="h6"
            sx={{
              fontFamily: SERIF,
              fontWeight: 700,
              lineHeight: 1.2,
              fontSize: "1rem",
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
              fontSize: "0.8rem",
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
                px: 1.1,
                py: 0.8,
                bgcolor: "rgba(200,164,93,0.12)",
                borderRadius: 1.5,
                border: "1px solid rgba(200,164,93,0.28)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 900, display: "block" }}>
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
          variant={outOfStock ? "outlined" : "contained"}
          fullWidth
          disabled={outOfStock}
          onClick={() => onAdd(product)}
          startIcon={!outOfStock ? <ShoppingBagOutlinedIcon sx={{ fontSize: "1rem" }} /> : undefined}
        >
          {outOfStock ? "Sin stock" : "Agregar al carrito"}
        </Button>
      </CardActions>
    </Card>
  );
}

export default function Products() {
  const { addItem } = useCart();
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("Agregado al carrito");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [tag, setTag] = useState("Todos");
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const q0 = searchParams.get("q") ?? "";
    const cat0 = searchParams.get("cat") ?? "Todas";
    const tag0 = searchParams.get("tag") ?? "Todos";
    const sort0 = searchParams.get("sort") ?? "relevance";
    const page0 = parseInt(searchParams.get("page") ?? "1", 10);

    setQuery(q0);
    setCategory(cat0);
    setTag(tag0);
    setSort(sort0);
    setPage(Number.isFinite(page0) && page0 > 0 ? page0 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const tags = useMemo(() => {
    const set = new Set(products.flatMap((p) => p.tags ?? []));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;

    if (category !== "Todas") list = list.filter((p) => p.category === category);
    if (tag !== "Todos") list = list.filter((p) => (p.tags ?? []).includes(tag));

    if (q) {
      list = list.filter((p) => {
        const haystack = `${p.name} ${p.description} ${p.category} ${(p.tags ?? []).join(" ")}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    const out = [...list];
    switch (sort) {
      case "price_asc": out.sort((a, b) => getMinPrice(a) - getMinPrice(b)); break;
      case "price_desc": out.sort((a, b) => getMinPrice(b) - getMinPrice(a)); break;
      case "name_asc": out.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "stock_first": out.sort((a, b) => Number(hasStock(b)) - Number(hasStock(a))); break;
      default: break;
    }

    return out;
  }, [products, query, category, tag, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    const next = new URLSearchParams();
    const q = query.trim();
    if (q) next.set("q", q);
    if (category && category !== "Todas") next.set("cat", category);
    if (tag && tag !== "Todos") next.set("tag", tag);
    if (sort && sort !== "relevance") next.set("sort", sort);
    if (page && page > 1) next.set("page", String(page));

    const currentStr = searchParams.toString();
    const nextStr = next.toString();
    if (currentStr !== nextStr) setSearchParams(next, { replace: true });
  }, [query, category, tag, sort, page, searchParams, setSearchParams]);

  const handleAdd = (product) => {
    if (!hasStock(product)) return;
    addItem(product);
    setSnackMsg(`Agregado: ${product.name}`);
    setSnackOpen(true);
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontFamily: SERIF, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Perfumes
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
          Fragancias diseñador, árabes, nicho y decants.
        </Typography>
      </Stack>

      {/* Filters */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          border: "1px solid rgba(67,48,34,0.09)",
          bgcolor: "rgba(255,253,248,0.85)",
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <TextField
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Buscar perfume, marca, categoría..."
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: "1.1rem", color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="sort-label">Ordenar</InputLabel>
              <Select
                labelId="sort-label"
                value={sort}
                label="Ordenar"
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
              >
                <MenuItem value="relevance">Relevancia</MenuItem>
                <MenuItem value="stock_first">Con stock primero</MenuItem>
                <MenuItem value="price_asc">Precio: menor a mayor</MenuItem>
                <MenuItem value="price_desc">Precio: mayor a menor</MenuItem>
                <MenuItem value="name_asc">Nombre: A → Z</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TuneIcon sx={{ fontSize: "0.95rem", color: "text.secondary" }} />
              <Typography variant="body2" sx={{ fontWeight: 800, color: "text.secondary", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Categoría
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {categories.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  clickable
                  onClick={() => { setCategory(c); setPage(1); }}
                  color={category === c ? "primary" : "default"}
                  variant={category === c ? "filled" : "outlined"}
                  size="small"
                  sx={{ mb: 0.75 }}
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ fontWeight: 800, color: "text.secondary", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Etiqueta
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              {tags.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  clickable
                  onClick={() => { setTag(t); setPage(1); }}
                  color={tag === t ? tagColor(t === "Todos" ? "default" : t) : "default"}
                  variant={tag === t ? "filled" : "outlined"}
                  size="small"
                  sx={{ mb: 0.75 }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      {/* Result count */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {filtered.length === 0 ? "Sin resultados" : `${filtered.length} producto${filtered.length !== 1 ? "s" : ""}`}
        </Typography>
        {(query || category !== "Todas" || tag !== "Todos") && (
          <Button
            size="small"
            variant="text"
            onClick={() => { setQuery(""); setCategory("Todas"); setTag("Todos"); setPage(1); }}
            sx={{ fontSize: "0.78rem" }}
          >
            Limpiar filtros
          </Button>
        )}
      </Stack>

      {/* Grid */}
      <Grid container spacing={2.5}>
        {paginated.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id} sx={{ display: "flex" }}>
            <ProductCard product={p} onAdd={handleAdd} />
          </Grid>
        ))}
      </Grid>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Paper
          sx={{
            mt: 4,
            p: 5,
            textAlign: "center",
            border: "1px dashed rgba(67,48,34,0.18)",
            bgcolor: "transparent",
          }}
        >
          <Typography variant="h6" sx={{ fontFamily: SERIF, fontStyle: "italic", color: "text.secondary", mb: 1 }}>
            Sin resultados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No hay productos que coincidan con tu búsqueda.
          </Typography>
          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            size="small"
            onClick={() => { setQuery(""); setCategory("Todas"); setTag("Todos"); setPage(1); }}
          >
            Ver todos los productos
          </Button>
        </Paper>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </Stack>
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
    </Box>
  );
}
