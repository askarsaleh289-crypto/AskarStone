import React, { useState } from "react";
import { toast } from "react-toastify";
import API from "../api";
import AuthShell, { AuthLink } from "../components/AuthShell";
import { continueWithGoogle } from "../utils/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "Reset link sent.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot password"
      subtitle="Enter your email and we will send a secure reset link if the account exists."
      onGoogle={() => continueWithGoogle(toast)}
      footer={
        <>
          Remembered it? <AuthLink to="/login">Back to login</AuthLink>
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

        <button
          className="h-12 w-full rounded-md bg-stonebrand-charcoal px-4 text-sm font-semibold text-white transition hover:bg-stonebrand-gold focus:outline-none focus:ring-4 focus:ring-stonebrand-amber/30 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
