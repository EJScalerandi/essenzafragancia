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
import CloseIcon from "@mui/icons-material/Close";
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

import brandLogo from "../assets/essenza-logo.svg";
import { BRAND } from "../branding/brand.js";
import { useCart } from "../context/CartContext.jsx";
import { useStore } from "../context/StoreContext.jsx";
import BackgroundMusic from "../components/BackgroundMusic.jsx";

const SERIF = '"Playfair Display", Georgia, serif';

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function NavButton({ to, children, end }) {
  return (
    <Button
      component={RouterNavLink}
      to={to}
      end={end}
      color="inherit"
      sx={{
        px: 1.6,
        py: 0.9,
        fontWeight: 700,
        fontSize: "0.88rem",
        letterSpacing: "0.02em",
        color: "text.secondary",
        borderRadius: 1.5,
        "&.active": {
          color: "text.primary",
          bgcolor: "rgba(29,22,18,0.07)",
          fontWeight: 900,
        },
        "&:hover": {
          color: "text.primary",
          bgcolor: "rgba(29,22,18,0.05)",
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
        fontWeight: 700,
        px: 2,
        py: 1.2,
        borderRadius: 1.5,
        fontSize: "0.9rem",
        "&.active": {
          color: "text.primary",
          bgcolor: "rgba(29,22,18,0.08)",
          fontWeight: 900,
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

function FooterIconLink({ href, label, icon }) {
  const commonSx = {
    width: 40,
    height: 40,
    border: "1px solid rgba(67,48,34,0.14)",
    bgcolor: href ? "#fffdf8" : "rgba(255,253,248,0.50)",
    color: href ? "text.secondary" : "text.disabled",
    borderRadius: 1.5,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    cursor: href ? "pointer" : "default",
    transition: "all 200ms ease",
    "&:hover": {
      bgcolor: href ? "#1d1612" : "transparent",
      color: href ? "#c8a45d" : "text.disabled",
      borderColor: href ? "#1d1612" : "rgba(67,48,34,0.14)",
      transform: href ? "translateY(-2px)" : "none",
    },
  };

  if (!href) {
    return (
      <Box component="span" aria-label={label} title={`${label} sin configurar`} sx={commonSx}>
        {icon}
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
      {icon}
    </Box>
  );
}

function CartDropdownContent({ onClose }) {
  const { items, total, clear, addItem, removeOne, deleteItem } = useCart();

  return (
    <Paper
      elevation={10}
      sx={{
        width: { xs: "100%", md: 480 },
        maxWidth: "100%",
        ml: { md: "auto" },
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2,
        border: "1px solid rgba(67,48,34,0.10)",
        boxShadow: "0 20px 60px rgba(29,22,18,0.16)",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "1.1rem" }}>
          Tu carrito
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {items.length > 0 && (
            <Button color="error" variant="text" size="small" onClick={clear}>
              Vaciar
            </Button>
          )}
          <IconButton size="small" onClick={onClose} sx={{ borderRadius: 1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Divider />

      {items.length === 0 ? (
        <Box sx={{ py: 3, textAlign: "center" }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>Tu carrito está vacío.</Typography>
          <Button sx={{ mt: 2 }} component={RouterLink} to="/products" variant="contained" onClick={onClose} size="small">
            Ver productos
          </Button>
        </Box>
      ) : (
        <>
          <List sx={{ py: 0, maxHeight: { xs: 340, md: 400 }, overflowY: "auto" }}>
            {items.map((i) => (
              <ListItem key={i.id} disableGutters sx={{ py: 1.5 }}>
                <Box
                  sx={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "52px minmax(0, 1fr) auto",
                    columnGap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Avatar
                    variant="rounded"
                    src={i.image}
                    alt={i.name}
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 1.5,
                      border: "1px solid rgba(67,48,34,0.10)",
                    }}
                  />

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.88rem",
                        lineHeight: 1.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {i.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                      {money.format(i.price)} c/u
                      {i.variant ? ` · ${i.variant.color} / ${i.variant.size}` : ""}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => removeOne(i.id)} aria-label="Quitar una unidad" sx={{ borderRadius: 1 }}>
                      <RemoveIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                    <Typography sx={{ width: 22, textAlign: "center", fontWeight: 900, fontSize: "0.9rem" }}>
                      {i.qty}
                    </Typography>
                    <IconButton size="small" onClick={() => addItem(i)} aria-label="Agregar una unidad" sx={{ borderRadius: 1 }}>
                      <AddIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteItem(i.id)} aria-label="Eliminar" sx={{ borderRadius: 1 }}>
                      <DeleteOutlineIcon sx={{ fontSize: "0.9rem" }} />
                    </IconButton>
                  </Stack>
                </Box>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={1.25}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.9rem" }}>Total</Typography>
              <Typography
                sx={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "1.3rem",
                }}
              >
                {money.format(total)}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/cart" variant="outlined" onClick={onClose} fullWidth>
                Ver carrito
              </Button>
              <Button component={RouterLink} to="/checkout" variant="contained" onClick={onClose} fullWidth>
                Comprar
              </Button>
            </Stack>
          </Stack>
        </>
      )}
    </Paper>
  );
}

function BrandMark({ storeName }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
      <Box
        component="img"
        src={brandLogo}
        alt={`${BRAND.name} logo`}
        sx={{
          height: { xs: 30, sm: 36 },
          width: "auto",
          display: "block",
          filter: "drop-shadow(0 1px 3px rgba(29,22,18,0.12))",
        }}
      />
      <Box sx={{ lineHeight: 1, minWidth: 0, display: { xs: "none", sm: "block" } }}>
        <Typography
          component="div"
          sx={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: { sm: "1rem", md: "1.1rem" },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: { sm: 200, md: 280 },
            lineHeight: 1.1,
          }}
        >
          {storeName || BRAND.name}
        </Typography>
        <Typography
          component="div"
          sx={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#c8a45d",
            mt: 0.25,
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
    { label: "Instagram", href: cleanExternalLink(contactLinks.instagramUrl), icon: <InstagramIcon sx={{ fontSize: "1.1rem" }} /> },
    { label: "Facebook", href: cleanExternalLink(contactLinks.facebookUrl), icon: <FacebookIcon sx={{ fontSize: "1.1rem" }} /> },
    { label: "WhatsApp", href: whatsappLink(contactLinks.whatsappNumber), icon: <WhatsAppIcon sx={{ fontSize: "1.1rem" }} /> },
    { label: contactLinks.addressText || "Dirección", href: addressLink(contactLinks), icon: <LocationOnIcon sx={{ fontSize: "1.1rem" }} /> },
  ];

  const closeMenu = () => setMenuOpen(false);
  const closeCart = () => setCartOpen(false);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Fondo ondas sinusoidales oblicuas ── */}
      <Box
        aria-hidden="true"
        sx={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Base crema que cubre todo */}
          <rect x="0" y="0" width="1440" height="900" fill="#fbf6ee" />

          <g transform="rotate(-30, 720, 450)">
            {/* Banda blanca: entre onda 1 (Y=0) y onda 2 (Y=400) */}
            <path
              d="M -200,0 Q -84,-110 31,0 Q 147,110 262,0 Q 378,-110 494,0 Q 609,110 725,0 Q 841,-110 956,0 Q 1072,110 1188,0 Q 1303,-110 1419,0 Q 1534,110 1650,0 L 1650,400 Q 1534,510 1419,400 Q 1303,290 1188,400 Q 1072,510 956,400 Q 841,290 725,400 Q 609,510 494,400 Q 378,290 262,400 Q 147,510 31,400 Q -84,290 -200,400 Z"
              fill="rgba(255,255,255,0.90)"
            />
            {/* Banda blanca: entre onda 3 (Y=800) y el borde inferior */}
            <path
              d="M -200,800 Q -84,690 31,800 Q 147,910 262,800 Q 378,690 494,800 Q 609,910 725,800 Q 841,690 956,800 Q 1072,910 1188,800 Q 1303,690 1419,800 Q 1534,910 1650,800 L 1650,1280 L -200,1280 Z"
              fill="rgba(255,255,255,0.88)"
            />
            {/* Línea dorada onda 1 */}
            <path
              d="M -200,0 Q -84,-110 31,0 Q 147,110 262,0 Q 378,-110 494,0 Q 609,110 725,0 Q 841,-110 956,0 Q 1072,110 1188,0 Q 1303,-110 1419,0 Q 1534,110 1650,0"
              fill="none" stroke="rgba(200,164,93,0.40)" strokeWidth="1.8"
            />
            {/* Línea dorada onda 2 */}
            <path
              d="M -200,400 Q -84,290 31,400 Q 147,510 262,400 Q 378,290 494,400 Q 609,510 725,400 Q 841,290 956,400 Q 1072,510 1188,400 Q 1303,290 1419,400 Q 1534,510 1650,400"
              fill="none" stroke="rgba(200,164,93,0.35)" strokeWidth="1.8"
            />
            {/* Línea dorada onda 3 */}
            <path
              d="M -200,800 Q -84,690 31,800 Q 147,910 262,800 Q 378,690 494,800 Q 609,910 725,800 Q 841,690 956,800 Q 1072,910 1188,800 Q 1303,690 1419,800 Q 1534,910 1650,800"
              fill="none" stroke="rgba(200,164,93,0.38)" strokeWidth="1.8"
            />
          </g>
        </svg>
      </Box>

      <AppBar position="sticky" elevation={0}>
        <Container maxWidth={false} disableGutters sx={{ maxWidth: 1440, mx: "auto" }}>
          <Toolbar sx={{ gap: { xs: 0.5, sm: 1 }, px: { xs: 1.5, sm: 2.5 }, minHeight: { xs: 64, sm: 72 } }}>
            {/* Mobile menu toggle */}
            <IconButton
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => { setMenuOpen((o) => !o); setCartOpen(false); }}
              sx={{ display: { xs: "inline-flex", md: "none" }, mr: 0.25 }}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>

            {/* Brand */}
            <Box component={RouterLink} to="/" sx={{ flexGrow: 1, minWidth: 0, textDecoration: "none", color: "inherit" }}>
              <BrandMark storeName={settings.storeName} />
            </Box>

            {/* Desktop nav */}
            <Stack direction="row" spacing={0.25} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
              <NavButton to="/" end>Inicio</NavButton>
              <NavButton to="/products">Perfumes</NavButton>
              <NavButton to="/account">Mi cuenta</NavButton>
              <Button
                component={RouterNavLink}
                to="/admin"
                color="inherit"
                startIcon={<AdminPanelSettingsIcon sx={{ fontSize: "0.95rem" }} />}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  color: "text.secondary",
                  borderRadius: 1.5,
                  px: 1.6,
                }}
              >
                Admin
              </Button>
            </Stack>

            {/* Cart button */}
            <IconButton
              aria-label={cartOpen ? "Cerrar carrito" : "Abrir carrito"}
              aria-expanded={cartOpen}
              onClick={() => { closeMenu(); setCartOpen((o) => !o); }}
              sx={{
                ml: { xs: 0.5, md: 1 },
                border: "1.5px solid rgba(67,48,34,0.15)",
                bgcolor: cartOpen ? "#1d1612" : "#fffdf8",
                color: cartOpen ? "#c8a45d" : "text.primary",
                transition: "all 200ms ease",
                "&:hover": {
                  bgcolor: "#1d1612",
                  color: "#c8a45d",
                  borderColor: "#1d1612",
                },
              }}
            >
              <Badge badgeContent={count} color="secondary">
                <ShoppingBagOutlinedIcon sx={{ fontSize: "1.2rem" }} />
              </Badge>
            </IconButton>
          </Toolbar>

          {/* Mobile nav */}
          <Collapse in={menuOpen} timeout="auto" unmountOnExit>
            <Box sx={{ display: { xs: "block", md: "none" }, px: 1.5, pb: 1.5 }}>
              <Box sx={{ borderTop: "1px solid rgba(67,48,34,0.10)", pt: 1 }}>
                <Stack spacing={0.25}>
                  <MobileMenuButton to="/" end icon={<HomeOutlinedIcon />} label="Inicio" onClick={closeMenu} />
                  <MobileMenuButton to="/products" icon={<StorefrontOutlinedIcon />} label="Perfumes" onClick={closeMenu} />
                  <MobileMenuButton to="/account" icon={<PersonOutlineIcon />} label="Mi cuenta" onClick={closeMenu} />
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<ShoppingBagOutlinedIcon />}
                    onClick={() => { closeMenu(); setCartOpen(true); }}
                    sx={{ mt: 1, justifyContent: "flex-start", borderRadius: 1.5 }}
                  >
                    Ver carrito {count > 0 ? `(${count})` : ""}
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Collapse>

          {/* Cart dropdown */}
          <Collapse in={cartOpen} timeout="auto" unmountOnExit>
            <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2 }}>
              <CartDropdownContent onClose={closeCart} />
            </Box>
          </Collapse>
        </Container>
      </AppBar>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          py: { xs: 2.5, md: 4 },
          px: { xs: 1.5, sm: 2.5, md: 3 },
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: "1px solid rgba(67,48,34,0.10)",
          bgcolor: "#fffdf8",
          py: 3,
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ maxWidth: 1440, mx: "auto" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "center", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* Brand in footer */}
            <Box component={RouterLink} to="/" sx={{ textDecoration: "none", color: "inherit" }}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  component="img"
                  src={brandLogo}
                  alt={`${BRAND.name} logo`}
                  sx={{ height: 28, width: "auto" }}
                />
                <Box>
                  <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.1 }}>
                    {settings.storeName || BRAND.name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#c8a45d" }}>
                    {BRAND.segment}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Social links */}
            <Stack direction="row" spacing={0.75}>
              {footerLinks.map((item) => (
                <FooterIconLink key={item.label} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.78rem" }}>
              © {new Date().getFullYear()} {settings.storeName || BRAND.name}. Todos los derechos reservados.
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.78rem" }}>
              Web creada por{" "}
              <Box
                component="a"
                href="https://mi-portfolio-blond-eight.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "text.secondary",
                  fontWeight: 800,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Tetén
              </Box>
            </Typography>
          </Stack>
        </Box>
      </Box>

      <BackgroundMusic />
    </Box>
  );
}
