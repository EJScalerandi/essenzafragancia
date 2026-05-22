import React from "react";
import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useCart } from "../context/CartContext.jsx";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function Cart() {
  const { items, total, clear, addItem, removeOne, deleteItem } = useCart();

  return (
    <section>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
        Carrito
      </Typography>

      {items.length === 0 ? (
        <Typography color="text.secondary">Tu carrito está vacío.</Typography>
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

          <Divider />

          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Total: {money.format(total)}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="error" onClick={clear}>
                Vaciar
              </Button>
              <Button component={RouterLink} to="/checkout" variant="contained">
                Finalizar compra
              </Button>
            </Stack>
          </Stack>
        </Stack>
      )}
    </section>
  );
}
