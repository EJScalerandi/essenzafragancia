import React, { useEffect, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import { buildApiUrl } from "../../api/http.js";
import { DEFAULT_CONTACT_LINKS, DEFAULT_PAYMENTS, normalizeContactLinks, normalizeMusicSettings, normalizePayments } from "../../branding/brand.js";
import { useStore } from "../../context/StoreContext.jsx";

const MAX_TRACKS = 10;
const MAX_FILE_MB = 18;

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("es-AR");
  } catch {
    return "";
  }
}

export default function AdminSettings() {
  const {
    settings,
    setStoreName,
    setMusicSettings,
    setPaymentSettings,
    setContactLinks,
    uploadMusicTrack,
    deleteMusicTrack,
  } = useStore();

  const inputRef = useRef(null);

  const [name, setName] = useState(settings.storeName || "");
  const [musicDraft, setMusicDraft] = useState(() => normalizeMusicSettings(settings.music));
  const [paymentsDraft, setPaymentsDraft] = useState(() => normalizePayments(settings.payments || DEFAULT_PAYMENTS));
  const [contactDraft, setContactDraft] = useState(() => normalizeContactLinks(settings.contactLinks || DEFAULT_CONTACT_LINKS));
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(settings.storeName || "");
    setMusicDraft(normalizeMusicSettings(settings.music));
    setPaymentsDraft(normalizePayments(settings.payments || DEFAULT_PAYMENTS));
    setContactDraft(normalizeContactLinks(settings.contactLinks || DEFAULT_CONTACT_LINKS));
  }, [settings]);

  const showSuccess = (message) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 1800);
  };

  const updateMusicField = (key, value) => {
    setMusicDraft((current) => normalizeMusicSettings({ ...current, [key]: value }));
  };

  const updateTrack = (id, patch) => {
    setMusicDraft((current) =>
      normalizeMusicSettings({
        ...current,
        tracks: current.tracks.map((track) => (track.id === id ? { ...track, ...patch } : track)),
      })
    );
  };

  const updatePayment = (section, key, value) => {
    setPaymentsDraft((current) =>
      normalizePayments({
        ...current,
        [section]: {
          ...(current[section] || {}),
          [key]: value,
        },
      })
    );
  };

  const updateContact = (key, value) => {
    setContactDraft((current) => ({ ...current, [key]: value }));
  };

  const onSaveStoreName = async () => {
    setError("");
    setLoading(true);
    try {
      await setStoreName(name);
      showSuccess("Nombre guardado");
    } catch (err) {
      setError(err.message || "No se pudo guardar el nombre");
    } finally {
      setLoading(false);
    }
  };

  const onSaveMusic = async () => {
    setError("");
    setLoading(true);
    try {
      await setMusicSettings(musicDraft);
      showSuccess("Música guardada");
    } catch (err) {
      setError(err.message || "No se pudo guardar la música");
    } finally {
      setLoading(false);
    }
  };

  const onSavePayments = async () => {
    setError("");
    setLoading(true);
    try {
      await setPaymentSettings(paymentsDraft);
      showSuccess("Formas de pago guardadas");
    } catch (err) {
      setError(err.message || "No se pudieron guardar las formas de pago");
    } finally {
      setLoading(false);
    }
  };

  const onSaveContactLinks = async () => {
    setError("");
    setLoading(true);
    try {
      await setContactLinks(contactDraft);
      showSuccess("Links de contacto guardados");
    } catch (err) {
      setError(err.message || "No se pudieron guardar los links de contacto");
    } finally {
      setLoading(false);
    }
  };

  const onUploadFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setError("");
    setLoading(true);

    try {
      const currentCount = musicDraft.tracks.length;
      const remaining = MAX_TRACKS - currentCount;
      if (remaining <= 0) throw new Error(`Ya tenés el máximo de ${MAX_TRACKS} temas.`);

      const selected = files.slice(0, remaining);

      for (const file of selected) {
        const isMp3 = file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3");
        if (!isMp3) throw new Error(`El archivo ${file.name} no es MP3.`);
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          throw new Error(`${file.name} supera el máximo de ${MAX_FILE_MB} MB.`);
        }

        const dataUrl = await readAsDataUrl(file);
        await uploadMusicTrack({
          fileName: file.name,
          title: file.name.replace(/\.mp3$/i, ""),
          mimeType: file.type || "audio/mpeg",
          dataUrl,
        });
      }

      showSuccess(selected.length === 1 ? "Tema subido" : "Temas subidos");
    } catch (err) {
      setError(err.message || "No se pudieron subir los temas");
    } finally {
      setLoading(false);
    }
  };

  const onDeleteTrack = async (id) => {
    setError("");
    setLoading(true);
    try {
      await deleteMusicTrack(id);
      showSuccess("Tema eliminado");
    } catch (err) {
      setError(err.message || "No se pudo eliminar el tema");
    } finally {
      setLoading(false);
    }
  };

  const activeCount = musicDraft.tracks.filter((track) => track.enabled !== false).length;
  const musicEnabled = musicDraft.enabled !== false;

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 950, lineHeight: 1 }}>
            Configuración
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Ajustá tienda, formas de pago y música de fondo.
          </Typography>
        </Box>
        <Chip icon={<MusicNoteIcon />} label={`${activeCount}/${musicDraft.tracks.length} temas activos`} />
      </Stack>

      {status ? <Alert severity="success">{status}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: "100%" }}>
            <Typography sx={{ fontWeight: 950, mb: 1 }}>Datos de tienda</Typography>
            <Stack spacing={2}>
              <TextField label="Nombre de la tienda" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              <Button variant="contained" onClick={onSaveStoreName} disabled={loading}>
                Guardar nombre
              </Button>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 }, height: "100%" }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>Música de fondo</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Podés subir hasta {MAX_TRACKS} archivos MP3.
                  </Typography>
                </Box>

                <FormControlLabel
                  control={<Switch checked={musicEnabled} onChange={(e) => updateMusicField("enabled", e.target.checked)} />}
                  label={musicEnabled ? "Activada" : "Desactivada"}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel id="music-mode-label">Reproducción</InputLabel>
                  <Select labelId="music-mode-label" label="Reproducción" value={musicDraft.mode} onChange={(e) => updateMusicField("mode", e.target.value)}>
                    <MenuItem value="sequential">En orden</MenuItem>
                    <MenuItem value="random">Aleatoria</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => inputRef.current?.click()}
                  disabled={loading || musicDraft.tracks.length >= MAX_TRACKS}
                  sx={{ minWidth: { sm: 190 } }}
                >
                  Subir MP3
                </Button>

                <input ref={inputRef} type="file" accept="audio/mpeg,audio/mp3,.mp3" multiple hidden onChange={onUploadFiles} />
              </Stack>

              <Button variant="contained" onClick={onSaveMusic} disabled={loading}>
                Guardar música
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography sx={{ fontWeight: 950 }}>Links de contacto</Typography>
            <Typography variant="body2" color="text.secondary">
              Estos datos se muestran como iconitos en el footer. Si dejás un campo vacío, ese icono no aparece.
            </Typography>
          </Box>

          <Grid container spacing={1.5}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Link de Instagram"
                value={contactDraft.instagramUrl}
                onChange={(e) => updateContact("instagramUrl", e.target.value)}
                fullWidth
                placeholder="https://instagram.com/tuusuario"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Link de Facebook"
                value={contactDraft.facebookUrl}
                onChange={(e) => updateContact("facebookUrl", e.target.value)}
                fullWidth
                placeholder="https://facebook.com/tupagina"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Número de WhatsApp"
                value={contactDraft.whatsappNumber}
                onChange={(e) => updateContact("whatsappNumber", e.target.value)}
                fullWidth
                placeholder="54911XXXXXXXX"
                helperText="Usá código de país y característica. Ej: 54911XXXXXXXX"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Detalle de dirección"
                value={contactDraft.addressText}
                onChange={(e) => updateContact("addressText", e.target.value)}
                fullWidth
                placeholder="Ej: Av. Siempre Viva 123, CABA"
                helperText="Este texto queda como referencia interna y ayuda al icono de dirección."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Punto en Google Maps"
                value={contactDraft.addressUrl}
                onChange={(e) => updateContact("addressUrl", e.target.value)}
                fullWidth
                placeholder="https://maps.google.com/..."
                helperText="Pegá acá el link exacto del punto de Google Maps."
              />
            </Grid>
          </Grid>

          <Button variant="contained" onClick={onSaveContactLinks} disabled={loading}>
            Guardar links de contacto
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography sx={{ fontWeight: 950 }}>Formas de pago</Typography>
              <Typography variant="body2" color="text.secondary">
                Activá MercadoPago o transferencia bancaria. Los datos de transferencia se muestran al comprador.
              </Typography>
            </Box>
            <Chip icon={<AccountBalanceIcon />} label="Transferencia configurable" />
          </Stack>

          <Divider />

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={paymentsDraft.mercadopago.enabled !== false}
                      onChange={(event) => updatePayment("mercadopago", "enabled", event.target.checked)}
                    />
                  }
                  label="MercadoPago activo"
                />
                <Typography variant="body2" color="text.secondary">
                  Por ahora se muestra como botón de prueba. Después se vincula con las credenciales reales.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paymentsDraft.bankTransfer.enabled !== false}
                        onChange={(event) => updatePayment("bankTransfer", "enabled", event.target.checked)}
                      />
                    }
                    label="Transferencia bancaria activa"
                  />

                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Titular" value={paymentsDraft.bankTransfer.accountHolder} onChange={(e) => updatePayment("bankTransfer", "accountHolder", e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Banco" value={paymentsDraft.bankTransfer.bankName} onChange={(e) => updatePayment("bankTransfer", "bankName", e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Alias" value={paymentsDraft.bankTransfer.alias} onChange={(e) => updatePayment("bankTransfer", "alias", e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="CBU / CVU" value={paymentsDraft.bankTransfer.cbu} onChange={(e) => updatePayment("bankTransfer", "cbu", e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField label="CUIT" value={paymentsDraft.bankTransfer.cuit} onChange={(e) => updatePayment("bankTransfer", "cuit", e.target.value)} fullWidth />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Mensaje para compradores"
                        value={paymentsDraft.bankTransfer.instructions}
                        onChange={(e) => updatePayment("bankTransfer", "instructions", e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Button variant="contained" onClick={onSavePayments} disabled={loading}>
            Guardar formas de pago
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1} sx={{ mb: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 950 }}>Temas cargados</Typography>
            <Typography variant="body2" color="text.secondary">
              Activá o desactivá temas y ordenalos con el número de orden.
            </Typography>
          </Box>
          <Chip label={`${musicDraft.tracks.length}/${MAX_TRACKS}`} />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {musicDraft.tracks.length === 0 ? (
          <Alert severity="info">Todavía no hay temas cargados.</Alert>
        ) : (
          <Grid container spacing={1.5}>
            {musicDraft.tracks.map((track, index) => (
              <Grid item xs={12} key={track.id}>
                <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 3 }}>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={12} md={5}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: "50%",
                            bgcolor: track.enabled === false ? "action.disabledBackground" : "#111111",
                            color: track.enabled === false ? "text.secondary" : "#ffffff",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MusicNoteIcon />
                        </Box>
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <TextField label="Título" value={track.title} onChange={(e) => updateTrack(track.id, { title: e.target.value })} fullWidth size="small" />
                          <Typography variant="caption" color="text.secondary" noWrap component="div" sx={{ mt: 0.5 }}>
                            {track.fileName || track.url} {formatDate(track.uploadedAt) ? `· ${formatDate(track.uploadedAt)}` : ""}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <TextField
                        label="Orden"
                        type="number"
                        size="small"
                        value={track.sortOrder || index + 1}
                        onChange={(e) => updateTrack(track.id, { sortOrder: Number(e.target.value) || index + 1 })}
                        fullWidth
                      />
                    </Grid>

                    <Grid item xs={6} sm={4} md={2}>
                      <FormControlLabel
                        control={<Switch checked={track.enabled !== false} onChange={(e) => updateTrack(track.id, { enabled: e.target.checked })} />}
                        label={track.enabled === false ? "Inactivo" : "Activo"}
                      />
                    </Grid>

                    <Grid item xs={12} sm={5} md={3}>
                      <Stack direction="row" spacing={1} justifyContent={{ xs: "space-between", sm: "flex-end" }} alignItems="center">
                        <audio controls preload="metadata" src={track.url.startsWith("/media/") ? buildApiUrl(track.url) : track.url} style={{ maxWidth: 170 }}>
                          Tu navegador no soporta audio.
                        </audio>
                        <IconButton color="error" onClick={() => onDeleteTrack(track.id)} disabled={loading} aria-label="Eliminar tema">
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Stack>
  );
}
