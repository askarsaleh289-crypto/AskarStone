import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import About from "./pages/about";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderStatus from "./pages/OrderStatus";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminMessages from "./pages/admin/AdminMessages";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { isAdminUser, readStoredUser } from "./utils/auth";

// ================= AUTH GUARD =================
function RequireAuth({ user, children }) {
  const storedUser = user || readStoredUser();

  if (!localStorage.getItem("token") || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// ================= ADMIN GUARD =================
function RequireAdmin({ user, children }) {
  const storedUser = user || readStoredUser();

  if (!storedUser) return <Navigate to="/login" replace />;
  if (!isAdminUser(storedUser)) return <Navigate to="/" replace />;

  return children;
}

// ================= APP =================
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: load user ONCE فقط
  useEffect(() => {
    const storedUser = readStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  if (loading) return null; // أو loading spinner

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />

      <Routes>
        {/* HOME */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />

        <Route
          path="/product/:id"
          element={
            <RequireAuth user={user}>
              <ProductDetail />
            </RequireAuth>
          }
        />

        <Route
          path="/cart"
          element={
            <RequireAuth user={user}>
              <Cart />
            </RequireAuth>
          }
        />

        <Route
          path="/checkout"
          element={
            <RequireAuth user={user}>
              <Checkout />
            </RequireAuth>
          }
        />

        <Route
          path="/order/:orderId"
          element={
            <RequireAuth user={user}>
              <OrderStatus />
            </RequireAuth>
          }
        />

        <Route path="/projects" element={<Projects />} />

        <Route
          path="/contact"
          element={
            <RequireAuth user={user}>
              <Contact />
            </RequireAuth>
          }
        />

        {/* AUTH */}
        <Route
          path="/login"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/" replace />
            ) : (
              <Login setUser={setUser} />
            )
          }
        />

        <Route
          path="/register"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/" replace />
            ) : (
              <Register />
            )
          }
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/auth/google-callback" element={<GoogleAuthCallback />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <RequireAdmin user={user}>
              <AdminDashboard />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/products"
          element={
            <RequireAdmin user={user}>
              <AdminProducts />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <RequireAdmin user={user}>
              <AdminProjects />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <RequireAdmin user={user}>
              <AdminOrders />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/messages"
          element={
            <RequireAdmin user={user}>
              <AdminMessages />
            </RequireAdmin>
          }
        />
      </Routes>

      <Footer />

      <ToastContainer position="top-right" autoClose={3000} theme="light" />
    </BrowserRouter>
  );
}