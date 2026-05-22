import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useCart } from "../../context/CartContext.jsx";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";
import { apiFetchBuyer } from "../../api/http.js";

function paramsToObj(sp) {
  const o = {};
  for (const [k, v] of sp.entries()) o[k] = v;
  return o;
}

export default function PaymentPending() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const { clear } = useCart();
  const { setSession } = useCustomerAuth();

  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState("");

  const params = useMemo(() => paramsToObj(sp), [sp]);
  const draftId = params.draftId || params.external_reference || "";
  const paymentId = params.payment_id || params.collection_id || "";

  useEffect(() => {
    if (!draftId) {
      setSyncing(false);
      setSyncError("No se encontró el identificador de MercadoPago.");
      return;
    }

    let cancelled = false;

    apiFetchBuyer("/api/payments/mp/sync-return", {
      method: "POST",
      body: JSON.stringify({
        draftId,
        externalReference: params.external_reference || draftId,
        paymentId: paymentId || null,
        status: params.status || params.collection_status || "pending",
        statusDetail: params.status_detail || null,
        preferenceId: params.preference_id || null,
        merchantOrderId: params.merchant_order_id || null,
      }),
    })
      .then((res) => {
        if (cancelled) return;

        if (res?.order?.id) {
          localStorage.setItem("karolin_active_last_order_id", res.order.id);

          if (res.buyerToken) {
            localStorage.setItem(`karolin_active_order_token_${res.order.id}`, res.buyerToken);
          }

          if (res.accountToken && res.accountUser) {
            setSession({ token: res.accountToken, user: res.accountUser });
          }

          clear();

          const target = `/order/${res.order.id}${res.buyerToken ? `?token=${encodeURIComponent(res.buyerToken)}` : ""}`;
          navigate(target, { replace: true });
          return;
        }

        if (res?.draft?.orderId) {
          clear();
          navigate(`/order/${res.draft.orderId}`, { replace: true });
          return;
        }

        setSyncError(res?.message || "MercadoPago dejó el pago pendiente. La operación puede terminar de actualizarse por webhook.");
      })
      .catch((err) => {
        if (cancelled) return;
        setSyncError(err?.message || "No se pudo sincronizar el pago pendiente.");
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clear, draftId, navigate, params, paymentId, setSession]);

  if (syncing && !syncError) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <CircularProgress size={20} />
          <Typography sx={{ fontWeight: 900 }}>
            Generando pedido pendiente de MercadoPago...
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Pago pendiente
      </Typography>

      {syncError ? (
        <Alert severity="warning">{syncError}</Alert>
      ) : (
        <Alert severity="warning" variant="filled">
          MercadoPago dejó el pago pendiente. La compra se va a actualizar automáticamente cuando MercadoPago confirme el pago.
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Referencia de pago: <b>{draftId || "-"}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ID de pago: <b>{paymentId || "-"}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Estado: <b>{params.status || params.collection_status || "pending"}</b>
        </Typography>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button component={RouterLink} to="/account" variant="contained">
          Ir a Mi cuenta
        </Button>
        <Button component={RouterLink} to="/products" variant="outlined">
          Ver productos
        </Button>
      </Stack>
    </Stack>
  );
}
