import React, { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api";
import AuthShell, { AuthLink } from "../components/AuthShell";
import { continueWithGoogle } from "../utils/auth";

export default function ResetPassword() {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = pathToken || searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!token) {
      toast.error("Invalid reset link.");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/auth/reset-password", {
        token,
        email,
        password,
      });
      toast.success(res.data.message || "Password updated.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Secure reset"
      title="Reset password"
      subtitle="Choose a new password for your Askar Stone account."
      onGoogle={() => continueWithGoogle(toast)}
      footer={
        <>
          Ready to continue? <AuthLink to="/login">Login</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-700">
            New password
          </label>
          <input
            className="h-12 w-full rounded-md border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stonebrand-gold focus:ring-4 focus:ring-stonebrand-amber/25"
            placeholder="Enter a new password"
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
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
