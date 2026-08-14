import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { resolveMediaUrl } from "../api/http.js";
import { getMinPrice } from "../utils/pricing.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function AccessoryRow({ product, onAdd }) {
  const price = getMinPrice(product);
  const image = resolveMediaUrl(product.image);

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
      <Avatar variant="rounded" src={image} alt={product.name} sx={{ width: 56, height: 56, borderRadius: 1.5 }} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.92rem" }}>{product.name}</Typography>
        <Typography variant="body2" color="text.secondary">{money.format(price)}</Typography>
      </Box>
      <Button variant="outlined" size="small" onClick={() => onAdd(product)} sx={{ flexShrink: 0 }}>
        Agregar
      </Button>
    </Stack>
  );
}
