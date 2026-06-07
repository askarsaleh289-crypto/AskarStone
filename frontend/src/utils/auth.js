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
  const apiUrl = process.env.REACT_APP_API_URL || "";
  if (!apiUrl) {
    const message = "API URL is not configured for Google callback.";
    if (toast) toast.error(message);
    console.error(message);
    return;
  }

  window.location.assign(`${apiUrl}/auth/google`);
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
      const err = new Error(message);
      if (payload.details) err.details = payload.details;
      throw err;
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
