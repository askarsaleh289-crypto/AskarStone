import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../api";
import AuthShell, { AuthLink } from "../components/AuthShell";
import { continueWithGoogle } from "../utils/auth";

export default function VerifyEmail() {
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = pathToken || searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let active = true;

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return undefined;
    }

    API.get(`/auth/verify-email/${encodeURIComponent(token)}`, {
      params: email ? { email } : undefined,
    })
      .then((res) => {
        if (!active) return;
        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully.");
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setMessage(err?.response?.data?.message || err?.response?.data?.error || "Invalid or expired verification link.");
      });

    return () => {
      active = false;
    };
  }, [token, email]);

  return (
    <AuthShell
      eyebrow="Email verification"
      title={status === "success" ? "Verified" : status === "error" ? "Link expired" : "Checking link"}
      subtitle={message}
      onGoogle={continueWithGoogle}
      footer={
        <>
          {status === "success" ? (
            <>You can now <AuthLink to="/login">login</AuthLink>.</>
          ) : (
            <>Need a new account? <AuthLink to="/register">Register again</AuthLink></>
          )}
        </>
      }
    >
      <div className={`auth-status auth-status-${status}`} role="status">
        <span />
        <strong>
          {status === "loading"
            ? "Please wait"
            : status === "success"
            ? "Your account is ready"
            : "Verification could not be completed"}
        </strong>
      </div>
    </AuthShell>
  );
}
