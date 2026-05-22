import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { useCart } from "../../context/CartContext.jsx";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";
import { apiFetchBuyer } from "../../api/http.js";

function paramsToObj(sp) {
  const o = {};
  for (const [k, v] of sp.entries()) o[k] = v;
  return o;
}

export default function PaymentSuccess() {
  const [sp] = useSearchParams();
  const { clear } = useCart();
  const { setSession } = useCustomerAuth();

  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState("");
  const [orderUrl, setOrderUrl] = useState("");

  const params = useMemo(() => paramsToObj(sp), [sp]);
  const draftId = params.draftId || params.external_reference || "";
  const paymentId = params.payment_id || params.collection_id || "";

  useEffect(() => {
    if (!draftId) {
      setSyncing(false);
      setSyncError("No se encontró el identificador de Mercado Pago.");
      return;
    }

    let cancelled = false;

    apiFetchBuyer("/api/payments/mp/sync-return", {
      method: "POST",
      body: JSON.stringify({
        draftId,
        externalReference: params.external_reference || draftId,
        paymentId: paymentId || null,
        status: params.status || params.collection_status || "approved",
        statusDetail: params.status_detail || null,
        preferenceId: params.preference_id || null,
        merchantOrderId: params.merchant_order_id || null,
      }),
    })
      .then((res) => {
        if (cancelled) return;

        let target = "";

        if (res?.order?.id) {
          localStorage.setItem("karolin_active_last_order_id", res.order.id);

          if (res.buyerToken) {
            localStorage.setItem(`karolin_active_order_token_${res.order.id}`, res.buyerToken);
          }

          if (res.accountToken && res.accountUser) {
            setSession({ token: res.accountToken, user: res.accountUser });
          }

          clear();
          target = `/order/${res.order.id}${res.buyerToken ? `?token=${encodeURIComponent(res.buyerToken)}` : ""}`;
        } else if (res?.draft?.orderId) {
          clear();
          target = `/order/${res.draft.orderId}`;
        }

        if (target) {
          setOrderUrl(target);
          setSyncing(false);
          return;
        }

        setSyncing(false);
        setSyncError(res?.message || "Mercado Pago todavía no pudo verificarse. Si lo confirma por webhook, el pedido se generará automáticamente.");
      })
      .catch((err) => {
        if (cancelled) return;
        setSyncing(false);
        setSyncError(err?.message || "No se pudo sincronizar el pago.");
      });

    return () => {
      cancelled = true;
    };
  }, [clear, draftId, params, paymentId, setSession]);

  if (syncError) {
    return (
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Estamos preparando tu pedido
        </Typography>

        <Alert severity="warning">{syncError}</Alert>

        <Paper sx={{ p: 2 }}>
          <Typography color="text.secondary">
            Si Mercado Pago ya aprobó el pago, el pedido puede terminar de generarse por webhook. Revisá el historial desde “Mi cuenta”.
          </Typography>
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button component={RouterLink} to="/account" variant="contained">
            Ir a Mi cuenta
          </Button>
          <Button component={RouterLink} to="/products" variant="outlined">
            Seguir comprando
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2} alignItems="center" textAlign="center">
        {syncing ? (
          <>
            <CircularProgress size={34} />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Confirmando pago con Mercado Pago...
            </Typography>
            <Typography color="text.secondary">
              Estamos verificando la operación y generando tu pedido.
            </Typography>
          </>
        ) : (
          <>
            <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
            <Typography variant="h5" sx={{ fontWeight: 900 }}>
              Pago de Mercado Pago realizado correctamente
            </Typography>
            <Typography color="text.secondary">
              Ya generamos tu pedido. Podés ir al resumen de la compra cuando quieras.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {orderUrl ? (
                <Button component={RouterLink} to={orderUrl} variant="contained">
                  Ver resumen ahora
                </Button>
              ) : null}
              <Button component={RouterLink} to="/account" variant="outlined">
                Ir a Mi cuenta
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
