import Logo from "../assets/Site Assets/Logo.png";
import {
  ChevronRight, ChevronLeft, LayoutDashboard,
  Package, History, LogOut, ShieldCheck, Box
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["member", "inventory_manager", "coordinator"] },
  { href: "/inventory", icon: Package, label: "Inventory", roles: ["member", "inventory_manager", "coordinator"] },
  { href: "/storage", icon: Box, label: "Storage Boxes", roles: ["inventory_manager", "coordinator"] },
  { href: "/history", icon: History, label: "My History", roles: ["member", "inventory_manager", "coordinator"] },
  { href: "/admin", icon: ShieldCheck, label: "Admin Panel", roles: ["inventory_manager", "coordinator"] },
];

function SideBar({ session, member, memberLoading = false, onSignOut, mobileOpen = false, onMobileClose, onNavigate }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const user = session?.user;
  const displayName = user?.name || user?.email?.split("@")[0] || "ERS Member";
  const displayEmail = user?.email || "";
  const avatarSrc = user?.image;
  const avatarFallback = displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const role = member?.role || "member";
  const roleLabel = { coordinator: "Coordinator", inventory_manager: "Inv. Manager", member: "Member" }[role] || role;

  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(role));

  const handleNavigate = () => {
    onNavigate?.();
    onMobileClose?.();
  };

  const navLinkClass = (isActive, mobile = false) => `
    flex items-center gap-3 rounded-lg transition-colors font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
    ${mobile ? "h-11 px-4" : "h-10 px-3"}
    ${isActive
      ? "bg-gold/10 text-gold border border-gold/20"
      : "text-gray-400 hover:bg-gray-800/50 hover:text-heading"
    }
  `;

  const navContent = (mobile = false) => (
    <>
      <div className={`h-16 px-3 flex items-center ${mobile ? "justify-between" : isCollapsed ? "justify-center" : "justify-between"}`}>
        {(!mobile && !isCollapsed) || mobile ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 shrink-0">
              <img
                src={Logo}
                alt="ERS Hive"
                width="32"
                height="32"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full rounded-md object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-heading text-base font-bold leading-none font-orbitron truncate">ERS Hive</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5 truncate">Inventory</div>
            </div>
          </div>
        ) : null}
        {!mobile && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:text-gold hover:bg-gray-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
        {mobile && (
          <button
            type="button"
            onClick={onMobileClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:text-heading hover:bg-gray-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label="Close navigation menu"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {(!mobile && !isCollapsed) || mobile ? (
        <div className="px-3 py-3 border-t border-b border-gray-800 bg-bg/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-full border border-border/30 bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold overflow-hidden">
              {memberLoading ? (
                <span className="h-3 w-3 animate-pulse rounded-full bg-gold/70" />
              ) : avatarSrc ? (
                <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{avatarFallback}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-heading text-sm font-medium truncate">{memberLoading ? "Loading profile" : displayName}</div>
              <div className="text-[10px] text-gray-500 font-mono truncate">{memberLoading ? "" : displayEmail}</div>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
              {memberLoading ? "Syncing" : roleLabel}
            </span>
          </div>
        </div>
      ) : null}

      <nav className={`flex flex-col gap-1 px-2 pt-3 flex-1 ${mobile ? "pb-3" : ""}`}>
        {visibleNav.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              onClick={handleNavigate}
              className={navLinkClass(isActive, mobile)}
            >
              <Icon size={16} className="shrink-0" />
              {mobile || !isCollapsed ? <span>{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => {
          handleNavigate();
          onSignOut?.();
        }}
        className={`h-14 w-full flex items-center border-t border-gray-800 text-gray-400 hover:text-red-400 transition-colors px-3 gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 ${mobile ? "justify-start" : isCollapsed ? "justify-center" : ""}`}
      >
        <LogOut size={16} className="shrink-0" />
        {mobile || !isCollapsed ? <span className="text-sm font-mono">Sign Out</span> : null}
      </button>
    </>
  );

  return (
    <>
      <aside
        className={`hidden md:flex h-dvh bg-surface ${isCollapsed ? "w-16" : "w-60"} flex-col border-r border-gray-800 transition-[width] duration-300 shrink-0`}
      >
        {navContent(false)}
      </aside>

      <div
        className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          onClick={onMobileClose}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 motion-reduce:transition-none ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          aria-label="Close navigation backdrop"
          tabIndex={mobileOpen ? 0 : -1}
        />
        <aside
          id="mobile-navigation-drawer"
          className={`relative flex h-full w-[min(18rem,88vw)] max-w-full flex-col border-r border-gray-800 bg-surface shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation drawer"
        >
          {navContent(true)}
        </aside>
      </div>
    </>
  );
}

export default SideBar;
