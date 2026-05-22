import React, { useMemo, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";

import { buildApiUrl } from "../../api/http.js";
import { useStore } from "../../context/StoreContext.jsx";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resolveImageUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/media/")) return buildApiUrl(url);
  return url;
}

function normalizeOrder(images) {
  return images.map((image, index) => ({ ...image, sortOrder: index + 1 }));
}

export default function AdminHomeImages() {
  const inputRef = useRef(null);
  const { settings, refreshSettings, setHomeImages, uploadHomeImage, deleteHomeImage } = useStore();

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(() => normalizeOrder(settings.homeImages || []));

  const remoteImages = settings.homeImages || [];

  React.useEffect(() => {
    setDraft(normalizeOrder(remoteImages));
  }, [remoteImages]);

  const enabledCount = useMemo(() => draft.filter((image) => image.enabled !== false).length, [draft]);

  const showMessage = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const uploadFiles = async (files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;

    const freeSlots = Math.max(0, 8 - draft.length);
    const toUpload = selected.slice(0, freeSlots);

    if (!toUpload.length) {
      showMessage("El máximo permitido es de 8 imágenes de portada.");
      return;
    }

    setBusy(true);
    try {
      for (const file of toUpload) {
        const dataUrl = await readFileAsDataUrl(file);
        await uploadHomeImage({
          fileName: file.name,
          title: file.name.replace(/\.(jpg|jpeg|png|webp)$/i, ""),
          mimeType: file.type,
          dataUrl,
        });
      }
      await refreshSettings();
      showMessage("Imagen cargada.");
    } catch (err) {
      showMessage(err?.message || "No se pudo cargar la imagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const updateDraftImage = (id, patch) => {
    setDraft((current) => current.map((image) => (image.id === id ? { ...image, ...patch } : image)));
  };

  const moveImage = (id, direction) => {
    setDraft((current) => {
      const index = current.findIndex((image) => image.id === id);
      if (index < 0) return current;

      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return normalizeOrder(next);
    });
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await setHomeImages(normalizeOrder(draft));
      showMessage("Portada guardada.");
    } catch (err) {
      showMessage(err?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (id) => {
    setBusy(true);
    try {
      await deleteHomeImage(id);
      await refreshSettings();
      showMessage("Imagen eliminada.");
    } catch (err) {
      showMessage(err?.message || "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Portada
          </Typography>
          <Typography color="text.secondary">
            Cargá, ocultá, eliminá o cambiá el orden de las imágenes que aparecen en la home.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshSettings} disabled={busy || saving}>
            Actualizar
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveDraft} disabled={busy || saving}>
            Guardar orden
          </Button>
        </Stack>
      </Stack>

      {message ? <Alert severity="info">{message}</Alert> : null}
      {(busy || saving) ? <LinearProgress /> : null}

      <Paper sx={{ p: 2, borderRadius: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
          <Box>
            <Typography sx={{ fontWeight: 900 }}>
              Imágenes activas: {enabledCount} / {draft.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Se aceptan JPG, PNG o WEBP. Máximo 8 imágenes y 8 MB por archivo.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(event) => uploadFiles(event.target.files)}
            />
            <Button
              startIcon={<AddPhotoAlternateIcon />}
              variant="contained"
              onClick={() => inputRef.current?.click()}
              disabled={busy || draft.length >= 8}
            >
              Cargar imágenes
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {draft.map((image, index) => (
          <Grid item xs={12} sm={6} md={4} key={image.id}>
            <Card sx={{ height: "100%", borderRadius: 4, overflow: "hidden", border: "1px solid rgba(17,17,17,0.08)" }}>
              <CardMedia
                component="img"
                image={resolveImageUrl(image.url)}
                alt={image.title || `Imagen ${index + 1}`}
                sx={{ height: { xs: 220, md: 250 }, objectFit: "cover", bgcolor: "#f5f1eb" }}
              />

              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Chip label={`Posición ${index + 1}`} size="small" />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={image.enabled !== false}
                        onChange={(event) => updateDraftImage(image.id, { enabled: event.target.checked })}
                      />
                    }
                    label={image.enabled !== false ? "Visible" : "Oculta"}
                  />
                </Stack>

                <TextField
                  label="Título interno"
                  value={image.title || ""}
                  onChange={(event) => updateDraftImage(image.id, { title: event.target.value })}
                  size="small"
                  fullWidth
                />

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, wordBreak: "break-all" }}>
                  {image.url}
                </Typography>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2, justifyContent: "space-between" }}>
                <Stack direction="row" spacing={0.5}>
                  <IconButton aria-label="Subir" onClick={() => moveImage(image.id, "up")} disabled={index === 0 || busy || saving}>
                    <KeyboardArrowUpIcon />
                  </IconButton>
                  <IconButton aria-label="Bajar" onClick={() => moveImage(image.id, "down")} disabled={index === draft.length - 1 || busy || saving}>
                    <KeyboardArrowDownIcon />
                  </IconButton>
                </Stack>

                <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={() => removeImage(image.id)} disabled={busy || saving}>
                  Eliminar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!draft.length ? (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 4 }}>
          <Typography sx={{ fontWeight: 900 }}>No hay imágenes de portada</Typography>
          <Typography color="text.secondary">Cargá una imagen para que aparezca en la home.</Typography>
        </Paper>
      ) : null}
    </Stack>
  );
}
