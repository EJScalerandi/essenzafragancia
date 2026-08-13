import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import CloseIcon from "@mui/icons-material/Close";

import { resolveMediaUrl } from "../api/http.js";
import { useCart } from "../context/CartContext.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { getMinPrice } from "../utils/pricing.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function AccessoryRow({ product, onAdd }) {
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

export default function Cart() {
  const navigate = useNavigate();
  const { items, total, clear, addItem, removeOne, deleteItem } = useCart();
  const { products } = useProducts();

  const [accessoriesOpen, setAccessoriesOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  const inCartIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  const accessories = useMemo(
    () => products.filter((p) => p.category === "Accesorios"),
    [products]
  );

  const suggestedAccessories = useMemo(
    () => accessories.filter((p) => (p.tags ?? []).includes("Sugerido") && !inCartIds.has(p.id)),
    [accessories, inCartIds]
  );

  const goToCheckout = () => navigate("/checkout");

  const onFinalize = () => {
    if (suggestedAccessories.length > 0) {
      setUpsellOpen(true);
      return;
    }
    goToCheckout();
  };

  return (
    <section>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#fffdf8", textShadow: "0 2px 10px rgba(0,0,0,0.45)" }}>
          Carrito
        </Typography>
        {accessories.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddShoppingCartIcon sx={{ fontSize: "1.1rem" }} />}
            onClick={() => setAccessoriesOpen(true)}
            sx={{ color: "#fffdf8", borderColor: "rgba(255,253,248,0.5)", "&:hover": { borderColor: "#fffdf8", bgcolor: "rgba(255,253,248,0.08)" } }}
          >
            Agregar accesorios
          </Button>
        )}
      </Stack>

      {items.length === 0 ? (
        <Typography sx={{ color: "rgba(255,253,248,0.78)" }}>Tu carrito está vacío.</Typography>
      ) : (
        <Stack spacing={2}>
          {items.map((i) => (
            <Card key={i.id}>
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {i.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {money.format(i.price)} c/u{i.variant ? ` · ${i.variant.color} / ${i.variant.size}` : ""}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button variant="outlined" onClick={() => removeOne(i.id)}>-</Button>
                    <Typography sx={{ minWidth: 28, textAlign: "center", fontWeight: 800 }}>
                      {i.qty}
                    </Typography>
                    <Button variant="outlined" onClick={() => addItem(i)}>+</Button>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button color="error" variant="text" onClick={() => deleteItem(i.id)}>
                      Quitar
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}

          <Divider sx={{ borderColor: "rgba(255,253,248,0.18)" }} />

          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: "#fffdf8", textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}>
                Total: {money.format(total)}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,253,248,0.7)" }}>
                Precios sin envío. El costo se coordina por WhatsApp.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="error" onClick={clear}>
                Vaciar
              </Button>
              <Button variant="contained" onClick={onFinalize}>
                Finalizar compra
              </Button>
            </Stack>
          </Stack>
        </Stack>
      )}

      {/* Popup: ver todos los accesorios (refuerzo de venta) */}
      <Dialog open={accessoriesOpen} onClose={() => setAccessoriesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Accesorios
          <IconButton onClick={() => setAccessoriesOpen(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {accessories.length === 0 ? (
            <Typography color="text.secondary">Todavía no hay accesorios cargados.</Typography>
          ) : (
            <Stack divider={<Divider />}>
              {accessories.map((p) => (
                <AccessoryRow key={p.id} product={p} onAdd={addItem} />
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setAccessoriesOpen(false)}>
            Listo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popup: sugerencia puntual al finalizar la compra */}
      <Dialog open={upsellOpen} onClose={() => setUpsellOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>¿Sumás algún accesorio?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Antes de continuar, mirá si te sirve agregar alguno de estos.
          </Typography>
          <Stack divider={<Divider />}>
            {suggestedAccessories.map((p) => (
              <AccessoryRow key={p.id} product={p} onAdd={addItem} />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUpsellOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              setUpsellOpen(false);
              goToCheckout();
            }}
          >
            Continuar a la compra
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
