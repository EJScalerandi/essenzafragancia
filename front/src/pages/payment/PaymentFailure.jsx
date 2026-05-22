import { useEffect, useMemo } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { apiFetchBuyer } from "../../api/http.js";

function paramsToObj(sp) {
  const o = {};
  for (const [k, v] of sp.entries()) o[k] = v;
  return o;
}

export default function PaymentFailure() {
  const [sp] = useSearchParams();

  const params = useMemo(() => paramsToObj(sp), [sp]);
  const draftId = params.draftId || params.external_reference || "";
  const paymentId = params.payment_id || params.collection_id || "";

  useEffect(() => {
    if (!draftId) return;

    apiFetchBuyer("/api/payments/mp/sync-return", {
      method: "POST",
      body: JSON.stringify({
        draftId,
        externalReference: params.external_reference || draftId,
        paymentId: paymentId || null,
        status: params.status || params.collection_status || "rejected",
        statusDetail: params.status_detail || null,
        preferenceId: params.preference_id || null,
        merchantOrderId: params.merchant_order_id || null,
      }),
    }).catch(() => null);
  }, [draftId, paymentId, params]);

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        Pago rechazado
      </Typography>

      <Alert severity="error" variant="filled">
        El pago no pudo completarse. No se creó la compra.
      </Alert>

      <Paper sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 900, mb: 1 }}>Detalle del pago</Typography>
        <Typography variant="body2" color="text.secondary">
          Referencia de pago: <b>{draftId || "-"}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ID de pago: <b>{paymentId || "-"}</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Estado: <b>{params.status || params.collection_status || "rejected"}</b>
        </Typography>
      </Paper>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button component={RouterLink} to="/checkout" variant="contained">
          Intentar nuevamente
        </Button>
        <Button component={RouterLink} to="/cart" variant="outlined">
          Ver carrito
        </Button>
      </Stack>
    </Stack>
  );
}
