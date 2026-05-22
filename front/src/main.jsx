import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

import "./index.css";
import { theme } from "./theme/theme.js";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { StoreProvider } from "./context/StoreContext.jsx";
import { CustomerAuthProvider } from "./context/CustomerAuthContext.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

import AppLayout from "./layouts/AppLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";

import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Order from "./pages/Order.jsx";
import Account from "./pages/Account.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

import PaymentSuccess from "./pages/payment/PaymentSuccess.jsx";
import PaymentPending from "./pages/payment/PaymentPending.jsx";
import PaymentFailure from "./pages/payment/PaymentFailure.jsx";

import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminInbox from "./pages/admin/AdminInbox.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import AdminHomeImages from "./pages/admin/AdminHomeImages.jsx";
import AdminOrderDetail from "./pages/admin/AdminOrderDetail.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "products/:id", element: <ProductDetail /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "order/:id", element: <Order /> },
      { path: "account", element: <Account /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "payment/success", element: <PaymentSuccess /> },
      { path: "payment/pending", element: <PaymentPending /> },
      { path: "payment/failure", element: <PaymentFailure /> },
    ],
  },
  { path: "/login", element: <Login /> },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, element: <AdminHome /> },
      { path: "inbox", element: <AdminInbox /> },
      { path: "products", element: <AdminProducts /> },
      { path: "home-images", element: <AdminHomeImages /> },
      { path: "orders", element: <AdminOrders /> },
      { path: "orders/:id", element: <AdminOrderDetail /> },
      { path: "settings", element: <AdminSettings /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <AuthProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <RouterProvider router={router} />
            </CartProvider>
          </CustomerAuthProvider>
        </AuthProvider>
      </StoreProvider>
    </ThemeProvider>
  </React.StrictMode>
);
