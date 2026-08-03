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
import AddIcon from "@mui/icons-material/Add";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import { buildApiUrl } from "../../api/http.js";
import {
  DEFAULT_CONTACT_LINKS,
  DEFAULT_PAYMENTS,
  DEFAULT_PROMOTIONS,
  DEFAULT_WELCOME_POPUP,
  normalizeContactLinks,
  normalizeMusicSettings,
  normalizePayments,
  normalizePromotions,
  normalizeWelcomePopup,
} from "../../branding/brand.js";
import { useStore } from "../../context/StoreContext.jsx";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

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
    setWelcomePopup,
    setPromotions,
    uploadMusicTrack,
    deleteMusicTrack,
  } = useStore();

  const inputRef = useRef(null);

  const [name, setName] = useState(settings.storeName || "");
  const [musicDraft, setMusicDraft] = useState(() => normalizeMusicSettings(settings.music));
  const [paymentsDraft, setPaymentsDraft] = useState(() => normalizePayments(settings.payments || DEFAULT_PAYMENTS));
  const [contactDraft, setContactDraft] = useState(() => normalizeContactLinks(settings.contactLinks || DEFAULT_CONTACT_LINKS));
  const [popupDraft, setPopupDraft] = useState(() => normalizeWelcomePopup(settings.welcomePopup || DEFAULT_WELCOME_POPUP));
  const [promotionsDraft, setPromotionsDraft] = useState(() => normalizePromotions(settings.promotions || DEFAULT_PROMOTIONS));
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(settings.storeName || "");
    setMusicDraft(normalizeMusicSettings(settings.music));
    setPaymentsDraft(normalizePayments(settings.payments || DEFAULT_PAYMENTS));
    setContactDraft(normalizeContactLinks(settings.contactLinks || DEFAULT_CONTACT_LINKS));
    setPopupDraft(normalizeWelcomePopup(settings.welcomePopup || DEFAULT_WELCOME_POPUP));
    setPromotionsDraft(normalizePromotions(settings.promotions || DEFAULT_PROMOTIONS));
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

  const updatePopupField = (key, value) => {
    setPopupDraft((current) => normalizeWelcomePopup({ ...current, [key]: value }));
  };

  const updatePopupStep = (index, value) => {
    setPopupDraft((current) => {
      const steps = [...current.steps];
      steps[index] = value;
      return { ...current, steps };
    });
  };

  const addPopupStep = () => {
    setPopupDraft((current) => {
      if (current.steps.length >= 6) return current;
      return { ...current, steps: [...current.steps, ""] };
    });
  };

  const removePopupStep = (index) => {
    setPopupDraft((current) => ({ ...current, steps: current.steps.filter((_, i) => i !== index) }));
  };

  const updatePromotion = (id, patch) => {
    setPromotionsDraft((current) => current.map((promo) => (promo.id === id ? { ...promo, ...patch } : promo)));
  };

  const addPromotion = () => {
    setPromotionsDraft((current) => [
      ...current,
      {
        id: `perk-${Date.now().toString(36)}`,
        title: "",
        description: "",
        minAmount: 0,
        enabled: true,
        sortOrder: current.length + 1,
      },
    ]);
  };

  const removePromotion = (id) => {
    setPromotionsDraft((current) => current.filter((promo) => promo.id !== id));
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

  const onSaveWelcomePopup = async () => {
    setError("");
    setLoading(true);
    try {
      await setWelcomePopup(popupDraft);
      showSuccess("Popup de bienvenida guardado");
    } catch (err) {
      setError(err.message || "No se pudo guardar el popup de bienvenida");
    } finally {
      setLoading(false);
    }
  };

  const onSavePromotions = async () => {
    setError("");
    setLoading(true);
    try {
      const invalid = promotionsDraft.some((promo) => !promo.title.trim() || !promo.description.trim());
      if (invalid) throw new Error("Completá título y descripción en todas las promociones.");
      await setPromotions(promotionsDraft);
      showSuccess("Promociones guardadas");
    } catch (err) {
      setError(err.message || "No se pudieron guardar las promociones");
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
        <Grid size={{ xs: 12, md: 5 }}>
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

        <Grid size={{ xs: 12, md: 7 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Link de Instagram"
                value={contactDraft.instagramUrl}
                onChange={(e) => updateContact("instagramUrl", e.target.value)}
                fullWidth
                placeholder="https://instagram.com/tuusuario"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Link de Facebook"
                value={contactDraft.facebookUrl}
                onChange={(e) => updateContact("facebookUrl", e.target.value)}
                fullWidth
                placeholder="https://facebook.com/tupagina"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Número de WhatsApp"
                value={contactDraft.whatsappNumber}
                onChange={(e) => updateContact("whatsappNumber", e.target.value)}
                fullWidth
                placeholder="54911XXXXXXXX"
                helperText="Usá código de país y característica. Ej: 54911XXXXXXXX"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Detalle de dirección"
                value={contactDraft.addressText}
                onChange={(e) => updateContact("addressText", e.target.value)}
                fullWidth
                placeholder="Ej: Av. Siempre Viva 123, CABA"
                helperText="Este texto queda como referencia interna y ayuda al icono de dirección."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 4 }}>
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

            <Grid size={{ xs: 12, md: 8 }}>
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
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Titular" value={paymentsDraft.bankTransfer.accountHolder} onChange={(e) => updatePayment("bankTransfer", "accountHolder", e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Banco" value={paymentsDraft.bankTransfer.bankName} onChange={(e) => updatePayment("bankTransfer", "bankName", e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="Alias" value={paymentsDraft.bankTransfer.alias} onChange={(e) => updatePayment("bankTransfer", "alias", e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="CBU / CVU" value={paymentsDraft.bankTransfer.cbu} onChange={(e) => updatePayment("bankTransfer", "cbu", e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField label="CUIT" value={paymentsDraft.bankTransfer.cuit} onChange={(e) => updatePayment("bankTransfer", "cuit", e.target.value)} fullWidth />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
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

            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paymentsDraft.chatPayment.enabled !== false}
                        onChange={(event) => updatePayment("chatPayment", "enabled", event.target.checked)}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <WhatsAppIcon sx={{ fontSize: "1.1rem", color: "#25D366" }} />
                        <span>Chatea con nosotros activo</span>
                      </Stack>
                    }
                  />
                  <Typography variant="body2" color="text.secondary">
                    Lleva al comprador a WhatsApp con un resumen del carrito para coordinar el pago directamente.
                  </Typography>

                  <TextField
                    label="Subtítulo mostrado en el checkout"
                    value={paymentsDraft.chatPayment.subtitle}
                    onChange={(e) => updatePayment("chatPayment", "subtitle", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                  <TextField
                    label="Advertencia sobre intereses por cuotas"
                    value={paymentsDraft.chatPayment.warning}
                    onChange={(e) => updatePayment("chatPayment", "warning", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Button variant="contained" onClick={onSavePayments} disabled={loading}>
            Guardar formas de pago
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography sx={{ fontWeight: 950 }}>Popup de bienvenida</Typography>
              <Typography variant="body2" color="text.secondary">
                Se muestra una vez por visita al ingresar a la tienda.
              </Typography>
            </Box>
            <Chip icon={<WavingHandIcon />} label={popupDraft.enabled ? "Activo" : "Inactivo"} />
          </Stack>

          <Divider />

          <FormControlLabel
            control={<Switch checked={popupDraft.enabled !== false} onChange={(e) => updatePopupField("enabled", e.target.checked)} />}
            label={popupDraft.enabled !== false ? "Activado" : "Desactivado"}
          />

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField label="Título" value={popupDraft.title} onChange={(e) => updatePopupField("title", e.target.value)} fullWidth />
            </Grid>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField label="Subtítulo" value={popupDraft.subtitle} onChange={(e) => updatePopupField("subtitle", e.target.value)} fullWidth />
            </Grid>
          </Grid>

          <Stack spacing={1.25}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>Pasos numerados</Typography>
            {popupDraft.steps.map((step, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <Chip label={index + 1} size="small" sx={{ fontWeight: 900 }} />
                <TextField
                  value={step}
                  onChange={(e) => updatePopupStep(index, e.target.value)}
                  fullWidth
                  size="small"
                  placeholder={`Paso ${index + 1}`}
                />
                <IconButton color="error" onClick={() => removePopupStep(index)} aria-label="Eliminar paso">
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={addPopupStep}
              disabled={popupDraft.steps.length >= 6}
              sx={{ alignSelf: "flex-start" }}
            >
              Agregar paso
            </Button>
          </Stack>

          <Button variant="contained" onClick={onSaveWelcomePopup} disabled={loading} sx={{ alignSelf: "flex-start" }}>
            Guardar popup de bienvenida
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography sx={{ fontWeight: 950 }}>Promociones por monto de compra</Typography>
              <Typography variant="body2" color="text.secondary">
                Por ejemplo: "con compras desde $150.000 te llevás un decant de 5ml de regalo". Se muestran en el inicio.
              </Typography>
            </Box>
            <Chip icon={<CardGiftcardIcon />} label={`${promotionsDraft.filter((p) => p.enabled !== false).length}/${promotionsDraft.length} activas`} />
          </Stack>

          <Divider />

          {promotionsDraft.length === 0 ? (
            <Alert severity="info">Todavía no hay promociones cargadas.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {promotionsDraft.map((promo) => (
                <Paper key={promo.id} variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        label="Título"
                        value={promo.title}
                        onChange={(e) => updatePromotion(promo.id, { title: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        label="Descripción"
                        value={promo.description}
                        onChange={(e) => updatePromotion(promo.id, { description: e.target.value })}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <TextField
                        label="Monto mínimo"
                        type="number"
                        value={promo.minAmount}
                        onChange={(e) => updatePromotion(promo.id, { minAmount: Number(e.target.value) || 0 })}
                        fullWidth
                        size="small"
                        helperText={money.format(promo.minAmount || 0)}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={promo.enabled !== false}
                            onChange={(e) => updatePromotion(promo.id, { enabled: e.target.checked })}
                          />
                        }
                        label={promo.enabled !== false ? "Activa" : "Inactiva"}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 1 }}>
                      <IconButton color="error" onClick={() => removePromotion(promo.id)} aria-label="Eliminar promoción">
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Stack>
          )}

          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={addPromotion}>
              Nueva promoción
            </Button>
            <Button variant="contained" onClick={onSavePromotions} disabled={loading}>
              Guardar promociones
            </Button>
          </Stack>
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
              <Grid size={{ xs: 12 }} key={track.id}>
                <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 3 }}>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, md: 5 }}>
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

                    <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                      <TextField
                        label="Orden"
                        type="number"
                        size="small"
                        value={track.sortOrder || index + 1}
                        onChange={(e) => updateTrack(track.id, { sortOrder: Number(e.target.value) || index + 1 })}
                        fullWidth
                      />
                    </Grid>

                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <FormControlLabel
                        control={<Switch checked={track.enabled !== false} onChange={(e) => updateTrack(track.id, { enabled: e.target.checked })} />}
                        label={track.enabled === false ? "Inactivo" : "Activo"}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 5, md: 3 }}>
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
