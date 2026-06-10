import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api";
import AuthShell, { AuthLink } from "../components/AuthShell";
import { continueWithGoogle, getCartKey, getPostLoginPath } from "../utils/auth";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });
      const user = res.data.user;
      const guestCart = localStorage.getItem("cart_guest");
      const userCartKey = getCartKey(user);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("currentUser", String(user.id || user.email || user.name));

      if (guestCart && !localStorage.getItem(userCartKey)) {
        localStorage.setItem(userCartKey, guestCart);
        localStorage.removeItem("cart_guest");
      }

      if (setUser) setUser(user);

      toast.success(`Welcome back, ${user.name}`);
      navigate(getPostLoginPath(user));
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Login"
      subtitle="Access your account to continue shopping, tracking orders, and managing your stone projects."
      onGoogle={() => continueWithGoogle(toast)}
      footer={
        <>
          New customer? <AuthLink to="/register">Create an account</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700">
            Email
          </label>
          <input
            className="h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stonebrand-gold focus:ring-4 focus:ring-stonebrand-amber/25"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-stone-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-stonebrand-gold no-underline transition hover:text-stonebrand-charcoal"
            >
              Forgot?
            </Link>
          </div>
          <input
            className="h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stonebrand-gold focus:ring-4 focus:ring-stonebrand-amber/25"
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          className="h-12 w-full rounded-md bg-stonebrand-charcoal px-4 text-sm font-semibold text-white transition hover:bg-stonebrand-gold focus:outline-none focus:ring-4 focus:ring-stonebrand-amber/30 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </AuthShell>
  );
}
