import { createAuthClient } from "better-auth/react";

const authBaseUrl =
  import.meta.env.VITE_AUTH_BASE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  window.location.origin;

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
});