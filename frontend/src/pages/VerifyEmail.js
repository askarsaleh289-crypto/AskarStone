import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../api";
import AuthShell, { AuthLink } from "../components/AuthShell";
import { continueWithGoogle } from "../utils/auth";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    let active = true;

    API.get(`/auth/verify-email/${token}`)
      .then((res) => {
        if (!active) return;
        setStatus("success");
        setMessage(res.data?.message || "Email verified successfully.");
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setMessage(err?.response?.data?.message || "Invalid or expired verification link.");
      });

    return () => {
      active = false;
    };
  }, [token]);

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
