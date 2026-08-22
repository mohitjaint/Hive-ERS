// DEV ONLY - MOBILE UI TESTING
// This is compile-time gated by Vite and is always false in production builds.
export const isDevAuthBypassEnabled =
  import.meta.env.DEV === true &&
  import.meta.env.VITE_DEV_BYPASS_AUTH === "true";

// DEV ONLY - MOBILE UI TESTING
// Keep this mock aligned with the Better Auth session and Member model fields
// consumed by the frontend. It is never sent to the backend.
export const devBypassSession = {
  session: {
    id: "dev-mobile-ui-session",
    userId: "64b7f0f6e2d5c4a1b9f00001",
    token: "dev-mobile-ui-session-token",
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
  user: {
    id: "64b7f0f6e2d5c4a1b9f00001",
    name: "Mobile UI Tester",
    email: "mobile.ui.tester@example.test",
    emailVerified: true,
    image: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
};

// DEV ONLY - MOBILE UI TESTING
export const devBypassMember = {
  _id: "64b7f0f6e2d5c4a1b9f00001",
  name: "Mobile UI Tester",
  email: "mobile.ui.tester@example.test",
  role: "coordinator",
  active: true,
  joinedAt: new Date("2026-01-01T00:00:00.000Z"),
};
