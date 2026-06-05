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

  // Open Google Sign-In in a popup
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      `${window.location.origin}/auth/google-callback`
    )}&response_type=code&scope=openid email profile`,
    "google_signin",
    `width=${width},height=${height},left=${left},top=${top}`
  );
}

export function handleGoogleCallback(code, toast) {
  if (!code) {
    toast.error("No authorization code received from Google.");
    return Promise.reject();
  }

  // Exchange code for token on backend
  return fetch(`${process.env.REACT_APP_API_URL}/auth/google-callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      return data;
    });
}
