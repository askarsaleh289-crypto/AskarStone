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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 🔐 password strength
  const getPasswordStrength = (pass) => {
    if (pass.length < 6) return "weak";
    if (
      pass.length >= 8 &&
      /[A-Z]/.test(pass) &&
      /[0-9]/.test(pass) &&
      /[!@#$%^&*]/.test(pass)
    ) {
      return "strong";
    }
    return "medium";
  };

  const strength = getPasswordStrength(password);

  const submit = async (e) => {
    e.preventDefault();

    // validation frontend
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/register", {
        name,
        email,
        password,
        confirmPassword,
      });

      toast.success("Account created! Check your email to verify it.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title="Register"
      subtitle="Save your cart, track orders, and get full access."
      onGoogle={() => continueWithGoogle(toast)}
      footer={
        <>
          Already have an account? <AuthLink to="/login">Login</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">

        {/* NAME */}
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input"
        />

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
        />

        {/* PASSWORD */}
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />

          {password && (
            <p
              className={`text-sm mt-1 ${
                strength === "strong"
                  ? "text-green-600"
                  : strength === "medium"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              Password strength: {strength}
            </p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="input"
        />

        {/* BUTTON */}
        <button disabled={loading} className="btn">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}