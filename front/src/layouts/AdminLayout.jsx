import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PhotoLibraryOutlinedIcon from "@mui/icons-material/PhotoLibraryOutlined";

import { useAuth } from "../context/AuthContext.jsx";

const drawerWidth = 260;

function NavItem({ to, icon, label, end = false, onClick }) {
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      end={end}
      onClick={onClick}
      sx={{
        "&.active": { bgcolor: "action.selected" },
        borderRadius: 2,
        mx: 1,
        my: 0.5,
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const drawer = (
    <Box sx={{ p: 1 }}>
      <Typography sx={{ fontWeight: 900, px: 2, py: 1.5 }}>
        Panel Admin
      </Typography>
      <Divider />

      <List>
        <NavItem to="/admin" end icon={<DashboardIcon />} label="Resumen" onClick={() => setMobileOpen(false)} />
        <NavItem to="/admin/inbox" icon={<MailOutlineIcon />} label="Bandeja" onClick={() => setMobileOpen(false)} />
        <NavItem to="/admin/products" icon={<Inventory2Icon />} label="Productos" onClick={() => setMobileOpen(false)} />
        <NavItem to="/admin/home-images" icon={<PhotoLibraryOutlinedIcon />} label="Portada" onClick={() => setMobileOpen(false)} />
        <NavItem to="/admin/orders" icon={<ReceiptLongIcon />} label="Órdenes" onClick={() => setMobileOpen(false)} />
        <NavItem to="/admin/settings" icon={<SettingsIcon />} label="Configuración" onClick={() => setMobileOpen(false)} />
      </List>

      <Divider sx={{ my: 1 }} />

      <List>
        <NavItem to="/" end icon={<StorefrontIcon />} label="Volver a tienda" onClick={() => setMobileOpen(false)} />
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography sx={{ fontWeight: 900, flexGrow: 1 }}>
            Dashboard · {user?.username}
          </Typography>

          <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
          open
        >
          <Toolbar />
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
