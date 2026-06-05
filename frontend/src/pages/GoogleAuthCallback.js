import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { handleGoogleCallback } from "../utils/auth";

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
    handleGoogleCallback(code, toast)
      .then((data) => {
        if (data.token && data.user) {
          // Store token and user
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("currentUser", JSON.stringify(data.user));

          toast.success(`Welcome, ${data.user.name}!`);
          // Redirect to home
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Google callback error:", err);
        toast.error(err.message || "Google sign-in failed. Please try again.");
        // Redirect back to login
        setTimeout(() => navigate("/login"), 2000);
      });
  }, [searchParams, navigate]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p>Processing Google Sign-In...</p>
    </div>
  );
}

