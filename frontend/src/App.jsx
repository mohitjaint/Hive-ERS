import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import LoginPage from "./Components/loginPage";
import DashBoard from "./Components/DashBoard";
import InventoryPage from "./Components/InventoryPage";
import StoragePage from "./Components/StoragePage";
import HistoryPage from "./Components/HistoryPage";
import AdminPage from "./Components/AdminPage";
import Sidebar from "./Components/sidebar";
import { authClient } from "./lib/auth-client";
import { MemberProvider, useMember } from "./lib/MemberContext";
import { devBypassSession, isDevAuthBypassEnabled } from "./lib/dev-auth-bypass";

// ── Layout: renders inside RouterProvider so useLocation() works in Sidebar ──
function AppLayout({ session, onSignOut }) {
  const { member, loading: memberLoading } = useMember();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-bg text-fg">
      <Sidebar
        session={session}
        member={member}
        memberLoading={memberLoading}
        onSignOut={onSignOut}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        onNavigate={() => setMobileNavOpen(false)}
      />
      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-800/70 bg-bg/90 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-800 bg-surface text-heading transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.24em] uppercase text-heading font-orbitron truncate">
              ERS Hive
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
              Inventory control
            </p>
          </div>
        </header>
        <div className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
        </div>
      </div>
    </div>
  );
}

function Shell({ session, onSignOut }) {

  // Router must be created once — stable reference via useMemo pattern is fine
  // since session won't change while Shell is mounted
  const router = createBrowserRouter([
    {
      path: "/",
      element: <AppLayout session={session} onSignOut={onSignOut} />,
      children: [
        { index: true, element: <DashBoard /> },
        { path: "inventory", element: <InventoryPage /> },
        { path: "storage", element: <StoragePage /> },
        { path: "history", element: <HistoryPage /> },
        { path: "admin", element: <AdminPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

function AuthenticatedApp({ session, onSignOut }) {
  return (
    <MemberProvider session={session}>
      <Shell session={session} onSignOut={onSignOut} />
    </MemberProvider>
  );
}

function ProductionAuthGate() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-fg font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <span className="text-xs tracking-widest uppercase text-fg/50">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return <AuthenticatedApp session={session} onSignOut={() => authClient.signOut()} />;
}

function App() {
  // DEV ONLY - MOBILE UI TESTING
  // Do not call Better Auth or provide credentials to the backend in this mode.
  if (isDevAuthBypassEnabled) {
    return <AuthenticatedApp session={devBypassSession} onSignOut={() => {}} />;
  }

  return <ProductionAuthGate />;
}

export default App;
