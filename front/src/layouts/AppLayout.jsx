import React, { useState } from "react";
import { Link as RouterLink, Outlet, NavLink as RouterNavLink } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/Add";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FacebookIcon from "@mui/icons-material/Facebook";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MenuIcon from "@mui/icons-material/Menu";
import RemoveIcon from "@mui/icons-material/Remove";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import { BRAND } from "../branding/brand.js";
import { useCart } from "../context/CartContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import BackgroundMusic from "../components/BackgroundMusic.jsx";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function NavButton({ to, children }) {
  return (
    <Button
      component={RouterNavLink}
      to={to}
      color="inherit"
      sx={{
        px: 1.4,
        fontWeight: 850,
        letterSpacing: "0.02em",
        color: "text.secondary",
        "&.active": {
          color: "text.primary",
          bgcolor: "rgba(17, 17, 17, 0.06)",
        },
      }}
    >
      {children}
    </Button>
  );
}

function MobileMenuButton({ to, icon, label, onClick, end = false }) {
  return (
    <Button
      component={RouterNavLink}
      to={to}
      end={end}
      onClick={onClick}
      fullWidth
      startIcon={icon}
      sx={{
        justifyContent: "flex-start",
        color: "text.secondary",
        fontWeight: 850,
        px: 1.5,
        py: 1.15,
        borderRadius: 1,
        "&.active": {
          color: "text.primary",
          bgcolor: "rgba(17,17,17,0.08)",
        },
      }}
    >
      {label}
    </Button>
  );
}

function cleanExternalLink(value) {
  const link = String(value || "").trim();
  if (!link) return "";
  if (/^https?:\/\//i.test(link)) return link;
  return `https://${link}`;
}

function whatsappLink(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const digits = raw.replace(/\D+/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

function addressLink({ addressUrl, addressText }) {
  const configuredMapPoint = cleanExternalLink(addressUrl);
  if (configuredMapPoint) return configuredMapPoint;

  const detail = String(addressText || "").trim();
  if (!detail) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detail)}`;
}

function FooterIconLink({ href, label, icon, text = "" }) {
  const cleanText = String(text || "").trim();
  const hasText = Boolean(cleanText);

  const commonSx = {
    minWidth: hasText ? "auto" : 40,
    width: hasText ? "auto" : 40,
    height: 40,
    px: hasText ? 1.25 : 0,
    border: "1px solid rgba(17,17,17,0.12)",
    bgcolor: href ? "#ffffff" : "rgba(255,255,255,0.58)",
    color: href ? "text.primary" : "text.disabled",
    borderRadius: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0.75,
    textDecoration: "none",
    cursor: href ? "pointer" : "default",
    "&:hover": {
      bgcolor: href ? "rgba(17,17,17,0.05)" : "rgba(255,255,255,0.58)",
      textDecoration: "none",
    },
  };

  const content = (
    <>
      {icon}
      {hasText ? (
        <Typography
          component="span"
          variant="body2"
          sx={{
            color: "inherit",
            fontWeight: 800,
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          {cleanText}
        </Typography>
      ) : null}
    </>
  );

  if (!href) {
    return (
      <Box component="span" aria-label={label} title={`${label} sin configurar`} sx={commonSx}>
        {content}
      </Box>
    );
  }

  return (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      sx={commonSx}
    >
      {content}
    </Box>
  );
}

function CartDropdownContent({ onClose }) {
  const { items, total, clear, addItem, removeOne, deleteItem } = useCart();

  return (
    <Paper
      elevation={10}
      sx={{
        width: { xs: "100%", md: 520 },
        maxWidth: "100%",
        ml: { md: "auto" },
        p: { xs: 1.5, sm: 2 },
        borderRadius: 1,
        border: "1px solid rgba(17,17,17,0.10)",
        boxShadow: "0 18px 42px rgba(17,17,17,0.16)",
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
        <Box sx={{ py: 2.5 }}>
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
          <List sx={{ py: 0, maxHeight: { xs: 360, md: 420 }, overflowY: "auto" }}>
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
                    sx={{ width: 52, height: 52, borderRadius: 1 }}
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
    </Paper>
  );
}

function BrandMark({ storeName }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
      <Box
        sx={{
          width: { xs: 42, sm: 48 },
          height: { xs: 42, sm: 48 },
          borderRadius: "8px",
          bgcolor: "#111111",
          color: "#ffffff",
          display: "grid",
          placeItems: "center",
          fontWeight: 950,
          fontSize: { xs: 17, sm: 20 },
          letterSpacing: "-0.12em",
          boxShadow: "0 16px 30px rgba(17,17,17,0.18)",
          flexShrink: 0,
        }}
      >
        {BRAND.shortName}
      </Box>

      <Box sx={{ lineHeight: 1, minWidth: 0 }}>
        <Typography
          component="div"
          sx={{
            fontWeight: 950,
            letterSpacing: "-0.05em",
            fontSize: { xs: 17, sm: 22 },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: { xs: 135, sm: 260 },
          }}
        >
          {storeName}
        </Typography>
        <Typography
          component="div"
          sx={{
            fontSize: { xs: 9, sm: 10 },
            fontWeight: 700,
            letterSpacing: { xs: "0.28em", sm: "0.42em" },
            textTransform: "uppercase",
            color: "text.secondary",
            mt: 0.35,
          }}
        >
          {BRAND.segment}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function AppLayout() {
  const { count } = useCart();
  const { settings } = useStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const contactLinks = settings.contactLinks || {};
  const footerLinks = [
    { label: "Instagram", href: cleanExternalLink(contactLinks.instagramUrl), icon: <InstagramIcon /> },
    { label: "Facebook", href: cleanExternalLink(contactLinks.facebookUrl), icon: <FacebookIcon /> },
    { label: "WhatsApp", href: whatsappLink(contactLinks.whatsappNumber), icon: <WhatsAppIcon /> },
    {
      label: contactLinks.addressText || "Dirección",
      href: addressLink(contactLinks),
      icon: <LocationOnIcon />,
      text: contactLinks.addressText,
    },
  ];

  const closeMenu = () => setMenuOpen(false);
  const closeCart = () => setCartOpen(false);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" elevation={0}>
        <Container maxWidth="lg" disableGutters>
          <Toolbar sx={{ gap: { xs: 0.75, sm: 1.25 }, px: { xs: 1, sm: 2 }, minHeight: { xs: 66, sm: 76 } }}>
            <IconButton
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              sx={{ display: { xs: "inline-flex", md: "none" }, mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <BrandMark storeName={settings.storeName} />
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              sx={{ display: { xs: "none", md: "flex" } }}
            >
              <NavButton to="/">Inicio</NavButton>
              <NavButton to="/products">Productos</NavButton>

              <Button
                component={RouterNavLink}
                to="/account"
                color="inherit"
                startIcon={<PersonOutlineIcon />}
                sx={{ fontWeight: 850, color: "text.secondary" }}
              >
                Mi cuenta
              </Button>

              <Button
                component={RouterNavLink}
                to="/admin"
                color="inherit"
                startIcon={<AdminPanelSettingsIcon />}
                sx={{ fontWeight: 850, color: "text.secondary" }}
              >
                Admin
              </Button>
            </Stack>

            <IconButton
              aria-label={cartOpen ? "Cerrar carrito" : "Abrir carrito"}
              aria-expanded={cartOpen}
              onClick={() => {
                closeMenu();
                setCartOpen((open) => !open);
              }}
              sx={{
                ml: { xs: 0.25, md: 1 },
                border: "1px solid rgba(17, 17, 17, 0.16)",
                bgcolor: "#ffffff",
                "&:hover": { bgcolor: "rgba(17,17,17,0.04)" },
              }}
            >
              <Badge badgeContent={count} color="secondary">
                <ShoppingBagOutlinedIcon />
              </Badge>
            </IconButton>
          </Toolbar>

          <Collapse in={menuOpen} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: { xs: "block", md: "none" },
                px: { xs: 1, sm: 2 },
                pb: 1.25,
              }}
            >
              <Box
                sx={{
                  borderTop: "1px solid rgba(17,17,17,0.10)",
                  pt: 1,
                }}
              >
                <Stack spacing={0.5}>
                  <MobileMenuButton to="/" end icon={<HomeOutlinedIcon />} label="Inicio" onClick={closeMenu} />
                  <MobileMenuButton to="/products" icon={<StorefrontOutlinedIcon />} label="Productos" onClick={closeMenu} />
                  <MobileMenuButton to="/account" icon={<PersonOutlineIcon />} label="Mi cuenta" onClick={closeMenu} />
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ShoppingBagOutlinedIcon />}
                    onClick={() => {
                      closeMenu();
                      setCartOpen(true);
                    }}
                    sx={{ mt: 0.5, justifyContent: "flex-start", borderRadius: 1 }}
                  >
                    Ver carrito ({count})
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Collapse>

          <Collapse in={cartOpen} timeout="auto" unmountOnExit>
            <Box
              sx={{
                px: { xs: 1, sm: 2 },
                pb: 1.5,
              }}
            >
              <CartDropdownContent onClose={closeCart} />
            </Box>
          </Collapse>
        </Container>
      </AppBar>

      <Container
        component="main"
        maxWidth="lg"
        sx={{ flexGrow: 1, py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}
      >
        <Outlet />
      </Container>

      <Box
        component="footer"
        sx={{
          borderTop: "1px solid rgba(17,17,17,0.08)",
          bgcolor: "rgba(255,255,255,0.72)",
          py: 2.5,
          px: 2,
          textAlign: "center",
        }}
      >
        <Stack spacing={1.4} alignItems="center">
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
            {footerLinks.map((item) => (
              <FooterIconLink key={item.label} href={item.href} label={item.label} icon={item.icon} text={item.text} />
            ))}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Web creada por{" "}
            <Box
              component="a"
              href="https://mi-portfolio-blond-eight.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: "text.primary",
                fontWeight: 900,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Tetén
            </Box>
          </Typography>
        </Stack>
      </Box>

      <BackgroundMusic />
    </Box>
  );
}
