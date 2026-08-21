import Logo from "../assets/Site Assets/Logo.png";
import {
  ChevronRight, ChevronLeft, LayoutDashboard,
  Package, History, Settings, LogOut, Users, ShieldCheck, Box
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

function SideBar({ session, member, onSignOut }) {
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

  return (
    <div
      className={`h-dvh bg-surface ${isCollapsed ? "w-16" : "w-60"} flex flex-col border-r border-gray-800 transition-all duration-300 shrink-0`}
    >
      {/* Logo + Collapse toggle */}
      <div className={`h-16 px-3 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 shrink-0">
              <img src={Logo} alt="Logo" className="object-contain rounded-md h-full w-full" />
            </div>
            <div>
              <div className="text-heading text-base font-bold leading-none font-orbitron">ERS Hive</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Inventory</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gold hover:bg-gray-800/50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* User info */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-t border-b border-gray-800 bg-bg/40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-full border border-border/30 bg-gold/10 flex items-center justify-center text-[10px] font-bold text-gold overflow-hidden">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span>{avatarFallback}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-heading text-sm font-medium truncate">{displayName}</div>
              <div className="text-[10px] text-gray-500 font-mono truncate">{displayEmail}</div>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
              {roleLabel}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 pt-3 flex-1">
        {visibleNav.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-3 h-10 px-3 rounded-lg transition-colors font-mono text-sm
                ${isActive
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "text-gray-400 hover:bg-gray-800/50 hover:text-heading"
                }`}
            >
              <Icon size={16} className="shrink-0" />
              {!isCollapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <button
        type="button"
        onClick={onSignOut}
        className={`h-14 w-full flex items-center border-t border-gray-800 text-gray-400 hover:text-red-400 transition-colors px-3 gap-3 ${isCollapsed ? "justify-center" : ""}`}
      >
        <LogOut size={16} className="shrink-0" />
        {!isCollapsed && <span className="text-sm font-mono">Sign Out</span>}
      </button>
    </div>
  );
}

export default SideBar;
