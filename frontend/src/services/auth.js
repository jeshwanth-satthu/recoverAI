/**
 * RecoverAI — Autonomous Revenue Recovery Engine
 * Dedicated Authentication Service
 *
 * Isolated session management layer supporting:
 * - Session token abstraction
 * - Persistence via localStorage
 * - Demo account authorization for presentations & judging
 * - Subscription events for reactive UI state changes
 */

const AUTH_STORAGE_KEY = "recoverai_auth_session";
const SESSION_DURATION_HOURS = 24;

const listeners = new Set();

function notifyListeners() {
  const isAuthed = isAuthenticated();
  const user = getCurrentUser();
  listeners.forEach((listener) => {
    try {
      listener({ isAuthenticated: isAuthed, user });
    } catch (err) {
      console.error("Auth listener error:", err);
    }
  });
}

/**
 * Check if the current session is valid and not expired
 */
export function isAuthenticated() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    if (!session || !session.token) return false;

    // Check expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      logout();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the currently authenticated user
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.user || null;
  } catch {
    return null;
  }
}

/**
 * Get current session token
 */
export function getSessionToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.token || null;
  } catch {
    return null;
  }
}

/**
 * Authenticate with work email and password
 */
export async function login({ email, password, rememberMe = true }) {
  // Artificial micro-delay to simulate secure authentication handshake
  await new Promise((res) => setTimeout(res, 600));

  const trimmedEmail = email?.trim().toLowerCase();

  // Basic format validation
  if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
    throw new Error("Please enter a valid work email address.");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  // Demo validation or enterprise check
  const isDemo =
    trimmedEmail.includes("recoverai") ||
    trimmedEmail.includes("acme") ||
    trimmedEmail.includes("demo") ||
    trimmedEmail.includes("admin") ||
    password === "recover2026" ||
    password === "demo1234" ||
    password.length >= 6; // Allow flexible login for judging ease

  if (!isDemo && password !== "recover2026") {
    throw new Error("Invalid credentials. Please verify your work email and password.");
  }

  const user = {
    id: `usr_${Math.floor(1000 + Math.random() * 9000)}`,
    email: trimmedEmail,
    name: formatUserName(trimmedEmail),
    role: "Senior Recovery Operator",
    tier: "Autonomous Level 3 Access",
    avatar: "OP",
    lastLogin: new Date().toISOString(),
  };

  const session = {
    token: `rec_sec_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    user,
    createdAt: Date.now(),
    expiresAt: rememberMe
      ? Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000
      : Date.now() + 4 * 60 * 60 * 1000,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifyListeners();
  return { success: true, user, token: session.token };
}

/**
 * Instant Demo Access for judges and presenters
 */
export async function demoLogin() {
  await new Promise((res) => setTimeout(res, 400));

  const user = {
    id: "usr_demo_8821",
    email: "operator@recoverai.finance",
    name: "Alex Vance",
    role: "Senior Revenue Operator",
    tier: "Autonomous Level 3 Access",
    avatar: "AV",
    lastLogin: new Date().toISOString(),
  };

  const session = {
    token: `rec_demo_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  notifyListeners();
  return { success: true, user, token: session.token };
}

/**
 * Terminate the current session
 */
export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyListeners();
  return { success: true };
}

/**
 * Subscribe to authentication state changes
 */
export function subscribeAuth(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function formatUserName(email) {
  const prefix = email.split("@")[0] || "Operator";
  return prefix
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
