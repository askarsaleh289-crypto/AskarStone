export function getGoogleClientId() {
  return process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
}

export function getGoogleAuthUrl() {
  return process.env.REACT_APP_GOOGLE_AUTH_URL || "";
}

export function readStoredUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    return null;
  }
}

export function isAdminUser(user) {
  return user?.is_admin === true || user?.is_admin === 1 || user?.is_admin === "1";
}

export function getCartKey(user = readStoredUser()) {
  if (!user) return "cart_guest";
  const stableId = user.id || user.email || user.name || "guest";
  return `cart_${String(stableId).trim().toLowerCase()}`;
}

export function readCart(user) {
  const key = getCartKey(user);
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const cart = JSON.parse(raw);
    return Array.isArray(cart) ? cart : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

export function clearCart(user) {
  localStorage.removeItem(getCartKey(user));
}

export function continueWithGoogle(toast) {
  const clientId = getGoogleClientId();

  if (!clientId) {
    toast.error("Google Sign-In is not configured. Please contact support.");
    return;
  }

  const redirectUri = `${window.location.origin}/auth/google-callback`;

  // Open Google Sign-In in a popup
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&access_type=online`;

  window.open(
    authUrl,
    "google_signin",
    `width=${width},height=${height},left=${left},top=${top}`
  );
}

export function handleGoogleCallback(code, toast) {
  if (!code) {
    const error = new Error("No authorization code received from Google.");
    toast.error(error.message);
    return Promise.reject(error);
  }

  const apiUrl = process.env.REACT_APP_API_URL || "";
  if (!apiUrl) {
    const error = new Error("API URL is not configured for Google callback.");
    toast.error(error.message);
    return Promise.reject(error);
  }

  return fetch(`${apiUrl}/auth/google-callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  }).then(async (res) => {
    const payload = await res.json().catch(() => ({ error: "Invalid JSON response from server" }));
    if (!res.ok) {
      const message = payload.error || payload.message || "Google sign-in failed.";
      throw new Error(message);
    }
    if (payload.error) {
      throw new Error(payload.error);
    }
    if (!payload.token || !payload.user) {
      throw new Error("Google sign-in did not return authentication data.");
    }
    return payload;
  });
}
