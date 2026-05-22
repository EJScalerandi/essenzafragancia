import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import { useCart } from "../context/CartContext.jsx";
import { useCustomerAuth } from "../context/CustomerAuthContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import { apiFetchBuyer } from "../api/http.js";
import { BANK_TRANSFER_MESSAGE } from "../branding/brand.js";

import mercadopagoLogo from "../assets/payment-methods/mercadopago-logo.png";
import visaCreditLogo from "../assets/payment-methods/visa-credit.png";
import mastercardCreditLogo from "../assets/payment-methods/mastercard-credit.png";
import amexCreditLogo from "../assets/payment-methods/amex-credit.png";
import naranjaCreditLogo from "../assets/payment-methods/naranja-credit.png";
import cabalCreditLogo from "../assets/payment-methods/cabal-credit.png";
import shoppingCreditLogo from "../assets/payment-methods/shopping-credit.png";
import cencosudCreditLogo from "../assets/payment-methods/cencosud-credit.png";
import maestroDebitLogo from "../assets/payment-methods/maestro-debit.png";
import mastercardDebitLogo from "../assets/payment-methods/mastercard-debit.png";
import cabalDebitLogo from "../assets/payment-methods/cabal-debit.png";
import visaDebitLogo from "../assets/payment-methods/visa-debit.png";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
const PAYMENT_PROOF_ACCEPT = "application/pdf,image/png,image/jpeg,image/webp,image/gif";
const PAYMENT_PROOF_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const CREDIT_CARD_LOGOS = [
  { src: visaCreditLogo, alt: "Visa" },
  { src: mastercardCreditLogo, alt: "Mastercard" },
  { src: amexCreditLogo, alt: "American Express" },
  { src: naranjaCreditLogo, alt: "Tarjeta Naranja" },
  { src: cabalCreditLogo, alt: "Cabal" },
  { src: shoppingCreditLogo, alt: "Tarjeta Shopping" },
  { src: cencosudCreditLogo, alt: "Cencosud" },
];

const DEBIT_CARD_LOGOS = [
  { src: maestroDebitLogo, alt: "Maestro" },
  { src: mastercardDebitLogo, alt: "Mastercard Débito" },
  { src: cabalDebitLogo, alt: "Cabal Débito" },
  { src: visaDebitLogo, alt: "Visa Débito" },
];

const PREPAID_CARD_LOGOS = [
  { src: mercadopagoLogo, alt: "Mercado Pago" },
  { src: visaCreditLogo, alt: "Visa Prepaga" },
  { src: mastercardCreditLogo, alt: "Mastercard Prepaga" },
];

function PaymentLogo({ src, alt, maxHeight = 30, maxWidth = 72, mp = false }) {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        display: "block",
        width: "auto",
        height: "auto",
        maxHeight,
        maxWidth,
        objectFit: "contain",
        borderRadius: mp ? 1 : 0.75,
      }}
    />
  );
}

function AcceptedLogosGroup({ title, logos, mp = false }) {
  return (
    <Stack spacing={0.9}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "text.secondary",
        }}
      >
        {title}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {logos.map((logo) => (
          <PaymentLogo
            key={`${title}-${logo.alt}`}
            src={logo.src}
            alt={logo.alt}
            maxHeight={logo.alt === "Mercado Pago" ? 34 : 28}
            maxWidth={logo.alt === "Mercado Pago" ? 112 : 74}
            mp={mp || logo.alt === "Mercado Pago"}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function PaymentOption({ selected, icon, title, subtitle, onClick, children, disabled }) {
  return (
    <Paper
      variant="outlined"
      onClick={disabled ? undefined : onClick}
      sx={{
        p: 1.5,
        cursor: disabled ? "not-allowed" : "pointer",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "rgba(17,17,17,0.04)" : "background.paper",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Radio checked={selected} disabled={disabled} />
          <Box sx={{ display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
            <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
          </Box>
        </Stack>
        {selected && children ? <Box sx={{ pl: { xs: 0, sm: 6 } }}>{children}</Box> : null}
      </Stack>
    </Paper>
  );
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",").pop() : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el comprobante"));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const { user: buyerUser, booting: buyerBooting, setSession } = useCustomerAuth();
  const { settings } = useStore();

  const [snack, setSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState("¡Compra creada! Te enviamos el enlace privado por email.");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");

  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofError, setPaymentProofError] = useState("");
  const [loadingProof, setLoadingProof] = useState(false);
  const [proofSuccess, setProofSuccess] = useState(false);
  const [createdOrderUrl, setCreatedOrderUrl] = useState("");

  const payments = settings.payments || {};
  const bankTransfer = payments.bankTransfer || {};
  const mp = payments.mercadopago || {};
  const bankInstructions = bankTransfer.instructions || BANK_TRANSFER_MESSAGE;

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zip: "",
  });
  const [hasPrefilledProfile, setHasPrefilledProfile] = useState(false);

  useEffect(() => {
    if (!buyerUser || hasPrefilledProfile) return;

    const profileFullName =
      `${buyerUser.firstName || ""} ${buyerUser.lastName || ""}`.trim() ||
      buyerUser.fullName ||
      "";

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || profileFullName,
      email: prev.email || buyerUser.email || "",
      phone: prev.phone || buyerUser.phone || "",
      address: prev.address || buyerUser.address || "",
      city: prev.city || buyerUser.city || "",
      province: prev.province || buyerUser.province || "",
      zip: prev.zip || buyerUser.zip || "",
    }));
    setHasPrefilledProfile(true);
  }, [buyerUser, hasPrefilledProfile]);

  const isEmpty = items.length === 0;

  const canSubmit = useMemo(() => {
    if (isEmpty || submitting || buyerBooting || loadingProof) return false;
    if (paymentMethod === "bank_transfer" && bankTransfer.enabled === false) return false;
    if (paymentMethod === "mercadopago" && mp.enabled === false) return false;

    const baseOk =
      form.fullName.trim() &&
      form.email.trim() &&
      form.phone.trim() &&
      form.address.trim() &&
      form.city.trim() &&
      form.province.trim() &&
      form.zip.trim();

    if (!baseOk) return false;

    if (!buyerUser && createAccount) {
      return password.trim().length >= 6;
    }

    return true;
  }, [form, isEmpty, buyerUser, buyerBooting, createAccount, password, paymentMethod, bankTransfer.enabled, mp.enabled, submitting, loadingProof]);

  const onChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const buildPayload = () => ({
    customer: {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      province: form.province.trim(),
      zip: form.zip.trim(),
    },
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      price: Number(i.price) || 0,
      qty: Number(i.qty) || 1,
      variant: i.variant ?? null,
    })),
    note: "",
    createAccount: !buyerUser && !buyerBooting && createAccount,
    password: !buyerUser && !buyerBooting && createAccount ? password : undefined,
  });

  const saveCreatedOrder = (data) => {
    const order = data?.order || data;
    if (order?.id) {
      localStorage.setItem("karolin_active_last_order_id", order.id);
      if (data?.buyerToken) {
        localStorage.setItem(`karolin_active_order_token_${order.id}`, data.buyerToken);
      }
    }

    if (data?.accountToken && data?.accountUser) {
      setSession({ token: data.accountToken, user: data.accountUser });
    }

    return order;
  };

  const goToCreatedOrder = (targetUrl) => {
    sessionStorage.setItem("karolin_active_order_success_message", "Su comprobante se cargó exitosamente.");
    navigate(targetUrl, { replace: true });
    window.setTimeout(() => clear(), 0);
  };

  const createBankTransferOrder = async () => {
    if (!paymentProof) {
      setPaymentProofError("Cargá el comprobante para confirmar la compra.");
      return;
    }

    setSubmitting(true);
    setError("");
    setPaymentProofError("");

    try {
      const order = await apiFetchBuyer("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          ...buildPayload(),
          paymentMethod: "bank_transfer",
          paymentProof,
        }),
      });

      const createdOrder = saveCreatedOrder(order);
      const targetUrl = `/order/${createdOrder.id}${order.buyerToken ? `?token=${encodeURIComponent(order.buyerToken)}` : ""}`;

      setCreatedOrderUrl(targetUrl);
      setProofSuccess(true);
      setSnackMessage("Su comprobante se cargó exitosamente.");
      setSnack(true);
      setSubmitting(false);
    } catch (e) {
      setError(e.message || "No se pudo continuar con la compra");
      setSubmitting(false);
    }
  };

  const redirectToMercadoPago = async () => {
    const checkout = await apiFetchBuyer("/api/payments/mp/create-checkout", {
      method: "POST",
      body: JSON.stringify(buildPayload()),
    });

    if (!checkout?.initPoint) {
      throw new Error("Mercado Pago no devolvió un enlace de pago.");
    }

    window.location.href = checkout.initPoint;
  };

  const handleProofFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setPaymentProof(null);
    setPaymentProofError("");

    if (!file) return;

    if (!PAYMENT_PROOF_MIME_TYPES.has(file.type)) {
      setPaymentProofError("El comprobante tiene que ser PDF o imagen.");
      return;
    }

    if (file.size > PAYMENT_PROOF_MAX_BYTES) {
      setPaymentProofError("El comprobante no puede superar los 10 MB.");
      return;
    }

    setLoadingProof(true);
    try {
      const data = await readFileAsBase64(file);
      setPaymentProof({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        data,
      });
    } catch (e2) {
      setPaymentProofError(e2.message || "No se pudo leer el comprobante.");
    } finally {
      setLoadingProof(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    if (paymentMethod === "bank_transfer") {
      setPaymentProof(null);
      setPaymentProofError("");
      setProofSuccess(false);
      setCreatedOrderUrl("");
      setProofDialogOpen(true);
      return;
    }

    setSubmitting(true);

    try {
      await redirectToMercadoPago();
    } catch (e2) {
      setError(e2.message || "No se pudo continuar con la compra");
      setSubmitting(false);
    }
  };

  if (isEmpty) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Finalizar compra
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No podés finalizar la compra porque el carrito está vacío.
        </Typography>
        <Button component={RouterLink} to="/products" variant="contained">
          Ir a productos
        </Button>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Finalizar compra
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <form onSubmit={onSubmit}>
              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Datos de envío</Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Nombre y apellido" value={form.fullName} onChange={onChange("fullName")} fullWidth required />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email"
                        value={form.email}
                        onChange={onChange("email")}
                        type="email"
                        fullWidth
                        required
                        helperText="Te enviaremos por email el enlace privado para comunicarte."
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField label="Teléfono" value={form.phone} onChange={onChange("phone")} fullWidth required />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField label="Dirección" value={form.address} onChange={onChange("address")} fullWidth required />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField label="Ciudad" value={form.city} onChange={onChange("city")} fullWidth required />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField label="Provincia" value={form.province} onChange={onChange("province")} fullWidth required />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField label="Código postal" value={form.zip} onChange={onChange("zip")} fullWidth required />
                    </Grid>
                  </Grid>
                </Box>

                {!buyerUser ? (
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Cuenta (opcional)</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Podés comprar sin cuenta. Si creás una, vas a ver historial y chat desde “Mi cuenta”.
                    </Typography>

                    <FormControlLabel
                      control={<Checkbox checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />}
                      label="Crear una cuenta con este email"
                    />

                    {createAccount ? (
                      <TextField
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        helperText="Mínimo 6 caracteres"
                      />
                    ) : null}
                  </Paper>
                ) : (
                  <Alert severity="info">
                    Estás comprando con tu cuenta. Este pedido quedará en tu historial.
                  </Alert>
                )}

                <Box>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Forma de pago</Typography>

                  <Stack spacing={1.25}>
                    <PaymentOption
                      selected={paymentMethod === "mercadopago"}
                      disabled={mp.enabled === false}
                      icon={<PaymentLogo src={mercadopagoLogo} alt="Mercado Pago" maxHeight={32} maxWidth={116} mp />}
                      title="Mercado Pago"
                      subtitle="Vas a pagar en la web oficial de Mercado Pago. La compra se crea cuando el pago vuelve aprobado."
                      onClick={() => setPaymentMethod("mercadopago")}
                    >
                      <Stack spacing={1.5}>
                        <Box
                          sx={{
                            p: { xs: 1.2, sm: 1.5 },
                            borderRadius: 1.25,
                            bgcolor: "rgba(0, 158, 227, 0.05)",
                            border: "1px solid rgba(0, 158, 227, 0.12)",
                          }}
                        >
                          <Stack spacing={1.3}>
                            <AcceptedLogosGroup title="Crédito" logos={CREDIT_CARD_LOGOS} />
                            <AcceptedLogosGroup title="Débito" logos={DEBIT_CARD_LOGOS} />
                            <AcceptedLogosGroup title="Prepagas" logos={PREPAID_CARD_LOGOS} mp />
                          </Stack>
                        </Box>

                        <Alert severity="info">
                          Al continuar, te redirigimos a Mercado Pago. Los datos de pago se cargan únicamente en Mercado Pago. Cuando el pago se aprueba, volvés al resumen.
                        </Alert>
                      </Stack>
                    </PaymentOption>

                    <PaymentOption
                      selected={paymentMethod === "bank_transfer"}
                      disabled={bankTransfer.enabled === false}
                      icon={<AccountBalanceIcon />}
                      title="Transferencia bancaria"
                      subtitle="La compra queda pendiente hasta que el admin verifique el comprobante."
                      onClick={() => setPaymentMethod("bank_transfer")}
                    >
                      <Alert severity="info">
                        Los datos bancarios se muestran al confirmar la compra, junto con la carga del comprobante.
                      </Alert>
                    </PaymentOption>
                  </Stack>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit}
                    startIcon={submitting || buyerBooting || loadingProof ? <CircularProgress size={18} color="inherit" /> : null}
                  >
                    {buyerBooting ? "Cargando cuenta..." : paymentMethod === "mercadopago" ? "Ir a Mercado Pago" : "Confirmar compra"}
                  </Button>
                  <Button component={RouterLink} to="/cart" variant="outlined" disabled={submitting}>
                    Volver al carrito
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Resumen</Typography>

            <Stack spacing={1}>
              {items.map((i) => (
                <Stack key={i.id} direction="row" justifyContent="space-between">
                  <Typography variant="body2">
                    {i.name}{i.variant ? ` (${i.variant.color} / ${i.variant.size})` : ""} x{i.qty}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {money.format(i.price * i.qty)}
                  </Typography>
                </Stack>
              ))}

              <Divider />

              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 900 }}>Total</Typography>
                <Typography sx={{ fontWeight: 900 }}>{money.format(total)}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={proofDialogOpen} onClose={submitting || proofSuccess ? undefined : () => setProofDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>Transferencia bancaria</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Alert severity="info">
              Transferí el total de <b>{money.format(total)}</b> y cargá el comprobante para confirmar la compra.
            </Alert>

            {bankInstructions ? (
              <Alert severity="info">
                {bankInstructions}
              </Alert>
            ) : null}

            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Datos bancarios</Typography>
              <Stack spacing={0.5}>
                {bankTransfer.accountHolder ? <Typography variant="body2"><b>Titular:</b> {bankTransfer.accountHolder}</Typography> : null}
                {bankTransfer.bankName ? <Typography variant="body2"><b>Banco:</b> {bankTransfer.bankName}</Typography> : null}
                {bankTransfer.alias ? <Typography variant="body2"><b>Alias:</b> {bankTransfer.alias}</Typography> : null}
                {bankTransfer.cbu ? <Typography variant="body2"><b>CBU/CVU:</b> {bankTransfer.cbu}</Typography> : null}
                {bankTransfer.cuit ? <Typography variant="body2"><b>CUIT:</b> {bankTransfer.cuit}</Typography> : null}
              </Stack>
            </Paper>

            <Button
              component="label"
              variant="outlined"
              startIcon={loadingProof ? <CircularProgress size={18} /> : <CloudUploadIcon />}
              disabled={submitting || loadingProof}
              sx={{ alignSelf: "flex-start" }}
            >
              Cargar comprobante
              <input hidden type="file" accept={PAYMENT_PROOF_ACCEPT} onChange={handleProofFile} />
            </Button>

            {proofSuccess ? (
              <Alert severity="success" icon={<AttachFileIcon />}>
                <b>Su comprobante se cargó exitosamente.</b> Ya podés ir al resumen de la compra.
              </Alert>
            ) : paymentProof ? (
              <Alert severity="success" icon={<AttachFileIcon />}>
                Comprobante listo: <b>{paymentProof.fileName}</b> ({formatFileSize(paymentProof.sizeBytes)})
              </Alert>
            ) : null}

            {paymentProofError ? <Alert severity="error">{paymentProofError}</Alert> : null}

            <Typography variant="caption" color="text.secondary">
              Formatos permitidos: PDF, JPG, PNG, WEBP o GIF. Tamaño máximo: 10 MB.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {!proofSuccess ? (
            <Button onClick={() => setProofDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
          ) : null}
          <Button
            variant="contained"
            onClick={proofSuccess && createdOrderUrl ? () => goToCreatedOrder(createdOrderUrl) : createBankTransferOrder}
            disabled={!proofSuccess && (submitting || loadingProof || !paymentProof)}
            startIcon={submitting && !proofSuccess ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {proofSuccess ? "Ver resumen ahora" : "Cargar comprobante y confirmar compra"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack} autoHideDuration={2500} onClose={() => setSnack(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" variant="filled">
          {snackMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
