import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getPostLoginPath, handleGoogleCallback } from "../utils/auth";

export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      toast.error("Google sign-in failed. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (!code) {
      console.error("No code in callback");
      toast.error("No authorization code received. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    // Exchange code for token
    (async () => {
      try {
        const data = await handleGoogleCallback(code, toast);
        if (data.token && data.user) {
          // Store token and user
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("currentUser", JSON.stringify(data.user));

          toast.success(`Welcome, ${data.user.name}!`);
          navigate(getPostLoginPath(data.user));
          return;
        }
        throw new Error("Google sign-in did not return token/user");
      } catch (err) {
        console.error("Google callback error:", err);
        const msg = err.message || "Google sign-in failed. Please try again.";
        const details = err.details ? JSON.stringify(err.details) : null;
        toast.error(details ? `${msg} (${details})` : msg);
        // Redirect back to login
        setTimeout(() => navigate("/login"), 2000);
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p>Processing Google Sign-In...</p>
    </div>
  );
}

