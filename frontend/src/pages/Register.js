import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api";
import AuthShell, { AuthLink } from "../components/AuthShell";
import { continueWithGoogle } from "../utils/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post("/auth/register", { name, email, password });
      toast.success("Account created. Check your email to verify it.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title="Register"
      subtitle="Save your cart, request custom material support, and follow orders from request to confirmation."
      onGoogle={() => continueWithGoogle(toast)}
      footer={
        <>
          Already have an account? <AuthLink to="/login">Login</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700">
            Full name
          </label>
          <input
            className="h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stonebrand-gold focus:ring-4 focus:ring-stonebrand-amber/25"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
          <label className="mb-2 block text-sm font-semibold text-stone-700">
            Password
          </label>
          <input
            className="h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stonebrand-gold focus:ring-4 focus:ring-stonebrand-amber/25"
            placeholder="Create a secure password"
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
