import React from "react";
import { Link as RouterLink } from "react-router-dom";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RemoveIcon from "@mui/icons-material/Remove";

import { useCart } from "../context/CartContext.jsx";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function MiniCartDrawer({ open, onClose }) {
  const { items, total, clear, addItem, removeOne, deleteItem } = useCart();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box
        sx={{
          width: { xs: 360, sm: 440 },
          maxWidth: "100vw",
          p: 2,
          height: "100%",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Carrito
          </Typography>
          <Button color="error" variant="text" onClick={clear} disabled={items.length === 0}>
            Vaciar
          </Button>
        </Stack>

        <Divider />

        {items.length === 0 ? (
          <Box sx={{ py: 3 }}>
            <Typography color="text.secondary">Tu carrito está vacío.</Typography>
            <Button
              sx={{ mt: 2 }}
              component={RouterLink}
              to="/products"
              variant="contained"
              onClick={onClose}
            >
              Ver productos
            </Button>
          </Box>
        ) : (
          <>
            <List sx={{ py: 0 }}>
              {items.map((i) => (
                <ListItem key={i.id} disableGutters sx={{ py: 1.35 }}>
                  <Box
                    sx={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "54px minmax(0, 1fr)",
                        sm: "56px minmax(0, 1fr) auto",
                      },
                      columnGap: 1.5,
                      rowGap: 0.75,
                      alignItems: "center",
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={i.image}
                      alt={i.name}
                      sx={{ width: 52, height: 52 }}
                    />

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 900,
                          lineHeight: 1.15,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {i.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25, overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {money.format(i.price)} c/u
                        {i.variant ? ` · ${i.variant.color} / ${i.variant.size}` : ""}
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{
                        gridColumn: { xs: "2 / 3", sm: "auto" },
                        justifySelf: { xs: "flex-start", sm: "flex-end" },
                        flexShrink: 0,
                        ml: { sm: 1 },
                      }}
                    >
                      <IconButton size="small" onClick={() => removeOne(i.id)} aria-label="Quitar una unidad">
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ width: 22, textAlign: "center", fontWeight: 900 }}>
                        {i.qty}
                      </Typography>
                      <IconButton size="small" onClick={() => addItem(i)} aria-label="Agregar una unidad">
                        <AddIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => deleteItem(i.id)} aria-label="Eliminar producto">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 1 }} />

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 800 }}>Total</Typography>
                <Typography sx={{ fontWeight: 900 }}>{money.format(total)}</Typography>
              </Stack>

              <Button component={RouterLink} to="/cart" variant="outlined" onClick={onClose}>
                Ver carrito
              </Button>

              <Button component={RouterLink} to="/checkout" variant="contained" onClick={onClose}>
                Finalizar compra
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Drawer>
  );
}
