import React, { useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { apiFetch } from "../../api/http.js";
import { useProducts } from "../../hooks/useProducts.js";
import { getMinPrice } from "../../utils/pricing.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function normalizeTags(text) {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function makeEmptyProduct() {
  return {
    id: "",
    name: "",
    category: "",
    description: "",
    image: "",
    alternateImage: "",
    basePrice: 0,
    tags: [],
    variants: [{ color: "Negro", size: "Única", price: 0, stock: 0 }],
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

function isDbMediaUrl(value) {
  return String(value || "").startsWith("/media/products/");
}

export default function AdminProducts() {
  const { products, upsertProduct, deleteProduct, resetProductsToSeed, refresh } = useProducts();

  const mainInputRef = useRef(null);
  const altInputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("create"); // create|edit
  const [form, setForm] = useState(makeEmptyProduct());
  const [tagsInput, setTagsInput] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState("");

  const rows = useMemo(() => products, [products]);

  const openCreate = () => {
    setError("");
    setMode("create");
    const p = makeEmptyProduct();
    setForm(p);
    setTagsInput("");
    setOpen(true);
  };

  const openEdit = (p) => {
    setError("");
    setMode("edit");
    setForm({
      ...p,
      alternateImage: p.alternateImage || "",
      variants: Array.isArray(p.variants) ? p.variants : [],
    });
    setTagsInput((p.tags ?? []).join(", "));
    setOpen(true);
  };

  const onClose = () => setOpen(false);

  const setField = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const setNumberField = (key) => (e) => {
    const value = Number(e.target.value);
    setForm((f) => ({ ...f, [key]: Number.isFinite(value) ? value : 0 }));
  };

  const addVariant = () => {
    setForm((f) => ({
      ...f,
      variants: [...(f.variants ?? []), { color: "", size: "", price: 0, stock: 0 }],
    }));
  };

  const updateVariant = (idx, key, value) => {
    setForm((f) => {
      const variants = [...(f.variants ?? [])];
      variants[idx] = { ...variants[idx], [key]: value };
      return { ...f, variants };
    });
  };

  const removeVariant = (idx) => {
    setForm((f) => {
      const variants = [...(f.variants ?? [])].filter((_, i) => i !== idx);
      return { ...f, variants };
    });
  };

  const buildProduct = () => {
    const id = form.id.trim();
    const name = form.name.trim();

    return {
      ...form,
      id,
      name,
      category: form.category.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      alternateImage: String(form.alternateImage || "").trim(),
      basePrice: Number(form.basePrice) || 0,
      tags: normalizeTags(tagsInput),
      variants: (form.variants ?? []).map((v) => ({
        color: String(v.color || "").trim(),
        size: String(v.size || "").trim(),
        price: Number(v.price) || 0,
        stock: Number(v.stock) || 0,
      })),
    };
  };

  const onSave = async () => {
    setError("");

    const product = buildProduct();
    if (!product.id) return setError("El ID es obligatorio (ej: p-010).");
    if (!product.name) return setError("El nombre es obligatorio.");

    await upsertProduct(product);
    setOpen(false);
  };

  const saveBeforeUploadIfNeeded = async () => {
    const product = buildProduct();
    if (!product.id) throw new Error("Completá el ID antes de subir una imagen.");
    if (!product.name) throw new Error("Completá el nombre antes de subir una imagen.");
    if (!product.category) throw new Error("Completá la categoría antes de subir una imagen.");
    if (!product.description) throw new Error("Completá la descripción antes de subir una imagen.");
    if (!product.variants?.length) throw new Error("Agregá al menos una variante antes de subir una imagen.");

    const exists = products.some((p) => p.id === product.id);
    if (!exists || mode === "create") {
      await upsertProduct(product);
      setMode("edit");
    }

    return product.id;
  };

  const uploadImage = async (kind, file) => {
    if (!file) return;
    setError("");
    setUploading(kind);

    try {
      const productId = await saveBeforeUploadIfNeeded();
      const dataUrl = await fileToDataUrl(file);

      const updated = await apiFetch(`/api/admin/products/${encodeURIComponent(productId)}/images/${kind}`, {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
        }),
      });

      setForm((f) => ({
        ...f,
        image: kind === "main" ? (updated.image || f.image) : f.image,
        alternateImage: kind === "alt" ? (updated.alternateImage || f.alternateImage) : f.alternateImage,
      }));

      await refresh();
    } catch (e) {
      setError(e.message || "No se pudo subir la imagen");
    } finally {
      setUploading("");
      if (mainInputRef.current) mainInputRef.current.value = "";
      if (altInputRef.current) altInputRef.current.value = "";
    }
  };

  const onDelete = (id) => {
    if (window.confirm("¿Eliminar este producto?")) deleteProduct(id);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Productos
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => resetProductsToSeed()}>
            Restaurar seed
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 900 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Imagen hover</TableCell>
              <TableCell sx={{ fontWeight: 900 }}>Tags</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">Desde</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">Variantes</TableCell>
              <TableCell sx={{ fontWeight: 900 }} align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{p.name}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>
                  {p.alternateImage ? (
                    <Chip size="small" color={isDbMediaUrl(p.alternateImage) ? "success" : "info"} variant="outlined" label={isDbMediaUrl(p.alternateImage) ? "Subida a DB" : "URL configurada"} />
                  ) : (
                    <Chip size="small" variant="outlined" label="Usa principal" />
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                    {(p.tags ?? []).slice(0, 3).map((t) => (
                      <Chip key={t} label={t} size="small" sx={{ mb: 0.5 }} />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell align="right">{money.format(getMinPrice(p))}</TableCell>
                <TableCell align="right">{p.variants?.length || 0}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(p)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => onDelete(p.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>No hay productos.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {mode === "create" ? "Nuevo producto" : "Editar producto"}
        </DialogTitle>

        <DialogContent>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="ID"
                value={form.id}
                onChange={setField("id")}
                fullWidth
                disabled={mode === "edit"}
                helperText={mode === "create" ? "Ej: p-010 (único)" : ""}
              />
              <TextField label="Nombre" value={form.name} onChange={setField("name")} fullWidth />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Categoría" value={form.category} onChange={setField("category")} fullWidth />
              <TextField
                label="Base price (fallback)"
                value={form.basePrice}
                onChange={setNumberField("basePrice")}
                type="number"
                fullWidth
              />
            </Stack>

            <TextField
              label="Imagen principal URL"
              value={form.image}
              onChange={setField("image")}
              fullWidth
              helperText="Podés pegar URL externa/ruta o subir un archivo a la base de datos con el botón de abajo."
            />

            <TextField
              label="Imagen alternativa para hover URL"
              value={form.alternateImage}
              onChange={setField("alternateImage")}
              fullWidth
              helperText="Podés pegar URL externa/ruta o subir un archivo a la base de datos. Si queda vacío, usa la principal."
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Paper variant="outlined" sx={{ p: 1.25, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 900 }}>Principal</Typography>
                <Box
                  component="img"
                  src={form.image || ""}
                  alt="Imagen principal"
                  sx={{ display: form.image ? "block" : "none", mt: 1, width: "100%", height: 160, objectFit: "contain", bgcolor: "#f5f1eb", borderRadius: 2 }}
                />
                {!form.image ? <Typography variant="body2" color="text.secondary">Sin imagen</Typography> : null}

                <input
                  ref={mainInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => uploadImage("main", e.target.files?.[0])}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={uploading === "main" ? <CircularProgress size={16} /> : <UploadFileIcon />}
                  disabled={!!uploading}
                  onClick={() => mainInputRef.current?.click()}
                  sx={{ mt: 1 }}
                >
                  {uploading === "main" ? "Subiendo..." : "Subir principal a DB"}
                </Button>
              </Paper>

              <Paper variant="outlined" sx={{ p: 1.25, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 900 }}>Alternativa hover</Typography>
                <Box
                  component="img"
                  src={form.alternateImage || form.image || ""}
                  alt="Imagen alternativa"
                  sx={{ display: (form.alternateImage || form.image) ? "block" : "none", mt: 1, width: "100%", height: 160, objectFit: "contain", bgcolor: "#f5f1eb", borderRadius: 2 }}
                />
                {!form.alternateImage ? <Typography variant="body2" color="text.secondary">Usa principal</Typography> : null}

                <input
                  ref={altInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  hidden
                  onChange={(e) => uploadImage("alt", e.target.files?.[0])}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={uploading === "alt" ? <CircularProgress size={16} /> : <UploadFileIcon />}
                  disabled={!!uploading}
                  onClick={() => altInputRef.current?.click()}
                  sx={{ mt: 1 }}
                >
                  {uploading === "alt" ? "Subiendo..." : "Subir hover a DB"}
                </Button>
              </Paper>
            </Stack>

            <Alert severity="info">
              Al subir una imagen, se guarda directamente en Supabase/PostgreSQL como archivo binario y el producto queda apuntando a una URL interna `/media/products/...`.
            </Alert>

            <TextField
              label="Descripción"
              value={form.description}
              onChange={setField("description")}
              fullWidth
              multiline
              minRows={2}
            />

            <TextField
              label="Tags (separados por coma)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              fullWidth
              placeholder="Destacado, Oferta, Nuevo"
            />

            <Divider />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 900 }}>Variantes</Typography>
              <Button startIcon={<AddIcon />} onClick={addVariant}>
                Agregar variante
              </Button>
            </Stack>

            <Paper variant="outlined" sx={{ p: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 900 }}>Color</TableCell>
                    <TableCell sx={{ fontWeight: 900 }}>Talle</TableCell>
                    <TableCell sx={{ fontWeight: 900 }} align="right">Precio</TableCell>
                    <TableCell sx={{ fontWeight: 900 }} align="right">Stock</TableCell>
                    <TableCell sx={{ fontWeight: 900 }} align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(form.variants ?? []).map((v, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <TextField value={v.color} onChange={(e) => updateVariant(idx, "color", e.target.value)} size="small" placeholder="Negro" />
                      </TableCell>
                      <TableCell>
                        <TextField value={v.size} onChange={(e) => updateVariant(idx, "size", e.target.value)} size="small" placeholder="M / 40 / Única" />
                      </TableCell>
                      <TableCell align="right">
                        <TextField value={v.price} onChange={(e) => updateVariant(idx, "price", Number(e.target.value))} size="small" type="number" sx={{ width: 120 }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField value={v.stock} onChange={(e) => updateVariant(idx, "stock", Number(e.target.value))} size="small" type="number" sx={{ width: 110 }} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="error" onClick={() => removeVariant(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}

                  {(form.variants ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>Sin variantes</TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={onSave}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
