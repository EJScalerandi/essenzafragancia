import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AccessoryRow from "./AccessoryRow.jsx";

// Popup de refuerzo de venta: se muestra (vía useAccessoryUpsell) antes de
// pasar al checkout, si hay accesorios marcados como "Sugerido" en el admin
// que todavía no están en el carrito.
export default function AccessoryUpsellDialog({ open, items, onAdd, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>¿Sumás algún accesorio?</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Antes de continuar, mirá si te sirve agregar alguno de estos.
        </Typography>
        <Stack divider={<Divider />}>
          {items.map((p) => (
            <AccessoryRow key={p.id} product={p} onAdd={onAdd} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={onConfirm}>
          Continuar a la compra
        </Button>
      </DialogActions>
    </Dialog>
  );
}
