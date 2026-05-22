// src/pages/Products.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Divider from "@mui/material/Divider";

import SearchIcon from "@mui/icons-material/Search";

import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { getMinPrice, getPriceLabel } from "../utils/pricing.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const PAGE_SIZE = 6;

function tagColor(tag) {
  if (tag === "Oferta") return "error";
  if (tag === "Nuevo") return "success";
  if (tag === "Destacado") return "secondary";
  return "default";
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
  const [sort, setSort] = useState("relevance"); // relevance | price_asc | price_desc | name_asc
  const [page, setPage] = useState(1);

  // URL -> State (al entrar desde Home)
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
    const set = new Set(products.map((p) => p.category));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const tags = useMemo(() => {
    const set = new Set(products.flatMap((p) => p.tags ?? []));
    return ["Todos", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;

    if (category !== "Todas") {
      list = list.filter((p) => p.category === category);
    }

    if (tag !== "Todos") {
      list = list.filter((p) => (p.tags ?? []).includes(tag));
    }

    if (q) {
      list = list.filter((p) => {
        const haystack = `${p.name} ${p.description} ${p.category} ${(p.tags ?? []).join(" ")}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    const out = [...list];
    switch (sort) {
      case "price_asc":
        out.sort((a, b) => getMinPrice(a) - getMinPrice(b));
        break;
      case "price_desc":
        out.sort((a, b) => getMinPrice(b) - getMinPrice(a));
        break;
      case "name_asc":
        out.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "relevance":
      default:
        break;
    }

    return out;
  }, [products, query, category, tag, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Clamp page
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // State -> URL (sincronizar URL)
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
    if (currentStr !== nextStr) {
      setSearchParams(next, { replace: true });
    }
  }, [query, category, tag, sort, page, searchParams, setSearchParams]);

  const handleAdd = (p) => {
    addItem(p); // default: primera variante
    setSnackMsg(`Agregado: ${p.name}`);
    setSnackOpen(true);
  };

  return (
    <section>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Productos
        </Typography>

        {/* Barra de búsqueda + orden */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar (nombre, descripción, categoría, tags)..."
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel id="sort-label">Ordenar</InputLabel>
            <Select
              labelId="sort-label"
              value={sort}
              label="Ordenar"
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="relevance">Relevancia</MenuItem>
              <MenuItem value="price_asc">Precio: menor a mayor</MenuItem>
              <MenuItem value="price_desc">Precio: mayor a menor</MenuItem>
              <MenuItem value="name_asc">Nombre: A → Z</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Chips categorías */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              clickable
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
              color={category === c ? "primary" : "default"}
              variant={category === c ? "filled" : "outlined"}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>

        {/* Chips tags */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {tags.map((t) => (
            <Chip
              key={t}
              label={t}
              clickable
              onClick={() => {
                setTag(t);
                setPage(1);
              }}
              color={tag === t ? tagColor(t === "Todos" ? "default" : t) : "default"}
              variant={tag === t ? "filled" : "outlined"}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>

        <Divider />

        <Typography variant="body2" color="text.secondary">
          Resultados: <b>{filtered.length}</b>
        </Typography>
      </Stack>

      {/* Grid */}
      <Grid container spacing={2}>
        {paginated.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardActionArea component={RouterLink} to={`/products/${p.id}`}>
                <CardMedia component="img" height="180" image={p.image} alt={p.name} />
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                      <Chip size="small" label={p.category} />
                      {(p.tags ?? []).slice(0, 2).map((t) => (
                        <Chip key={t} size="small" label={t} color={tagColor(t)} />
                      ))}
                    </Stack>

                    <Typography sx={{ fontWeight: 800 }}>
                      {getPriceLabel(p)} {money.format(getMinPrice(p))}
                    </Typography>
                  </Stack>

                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {p.name}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {p.description}
                  </Typography>
                </CardContent>
              </CardActionArea>

              <CardActions sx={{ px: 2, pb: 2, mt: "auto" }}>
                <Button variant="contained" fullWidth onClick={() => handleAdd(p)}>
                  Agregar al carrito
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Sin resultados */}
      {filtered.length === 0 && (
        <Typography sx={{ mt: 3 }} color="text.secondary">
          No hay productos que coincidan con tu búsqueda.
        </Typography>
      )}

      {/* Paginación */}
      {filtered.length > 0 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Stack>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity="success" variant="filled">
          {snackMsg}
        </Alert>
      </Snackbar>
    </section>
  );
}