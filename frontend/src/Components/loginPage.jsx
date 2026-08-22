import Logo from "../assets/Site Assets/Logo.png";
import { authClient } from "../lib/auth-client";
import {
  Zap,
  GitBranch,
  Boxes,
  CircuitBoard,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const preloadedLogo = new Image();
preloadedLogo.src = Logo;

function LoginPage() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const params = new URLSearchParams(window.location.search);

  const error = params.get("error");

  
  const startGoogleAuth = async () => {
    setIsSigningIn(true);
    setAuthError("");

    try {
      const callbackURL = `${window.location.origin}/`;
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      window.location.assign(callbackURL);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : "Unable to start Google sign-in right now."
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    
    <div className="min-h-screen w-full bg-bg text-fg font-mono relative overflow-hidden">
      {/* ── Ambient background glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 20%, rgba(244,196,48,0.10), transparent 70%), radial-gradient(50% 50% at 90% 90%, rgba(255,215,0,0.06), transparent 70%)",
        }}
      />
      {/* Circuit grid */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="44"
              height="44"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 44 0 L 0 0 0 44"
                fill="none"
                stroke="#F4C430"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-[1.05fr_1fr]">
        {/* ── LEFT PANEL ── */}
        <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden border-r border-border/30 bg-surface/70 backdrop-blur-sm px-12 py-14">
          {/* gold accent edge */}
          <div className="absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-border to-transparent" />
          {/* HUD brackets */}
          <div className="absolute top-6 left-6 h-4 w-4 border-t border-l border-border/60" />
          <div className="absolute top-6 right-6 h-4 w-4 border-t border-r border-border/60" />
          <div className="absolute bottom-6 left-6 h-4 w-4 border-b border-l border-border/60" />
          <div className="absolute bottom-6 right-6 h-4 w-4 border-b border-r border-border/60" />

          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.4em] uppercase text-border/80">
              sys.auth — v1.0
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
              <span className="text-[9px] tracking-[0.3em] uppercase text-border/70">
                online
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div>
              <h1
                className="font-orbitron font-black leading-[0.9] tracking-tight text-heading"
                style={{ fontSize: "clamp(80px, 11vw, 140px)" }}
              >
                ERS<span className="text-gold">.</span>
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-px w-16 bg-gold" />
                <p className="text-[11px] tracking-[0.3em] uppercase text-border">
                  Electronics &amp; Robotics Society
                </p>
              </div>
              <p className="mt-1 text-[10px] tracking-[0.25em] uppercase text-fg/50">
                IIITDM Jabalpur · Inventory Control
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md">
              {[
                { icon: Boxes, label: "Inventory Tracking" },
                { icon: CircuitBoard, label: "Component Registry" },
                { icon: GitBranch, label: "Borrow & Return Logs" },
                { icon: Zap, label: "Low Stock Alerts" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="group flex items-center gap-3 rounded-md border border-border/20 bg-bg/40 px-3 py-2.5 transition hover:border-border/60 hover:bg-bg/70"
                >
                  <Icon size={14} className="text-gold shrink-0" />
                  <span className="text-[10px] tracking-[0.14em] uppercase text-fg/80">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] tracking-[0.25em] uppercase text-fg/40">
            <span>© {new Date().getFullYear()} ERS</span>
            <span className="font-mono">node_01 · secure</span>
          </div>
        </aside>

        {/* ── RIGHT PANEL — Form ── */}
        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-full blur-2xl opacity-50"
                  style={{
                    background:
                      "radial-gradient(circle, #FFD700 0%, transparent 70%)",
                  }}
                />
                <img
                  src={Logo}
                  alt="ERS Hive"
                  width="64"
                  height="64"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="relative w-16 h-16 object-contain"
                />
              </div>
              <h2 className="font-orbitron font-bold text-3xl sm:text-4xl text-heading tracking-tight">
                ERS <span className="text-gold">Hive</span>
              </h2>
              <p className="text-sm text-fg/60 font-mono tracking-wide">
                Inventory Management Service
              </p>
            </div>

             {error === "NOT_AN_ERS_MEMBER" && (
                  <div className="text-red-500">
                      This Google account is not registered as an ERS member.
                      Please contact an ERS coordinator.
                  </div>
              )}

            {/* Card */}
            <div className="relative rounded-2xl border border-border/40 bg-surface/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_0_60px_-15px] shadow-circuit">
              {/* Top accent bar */}
              <div
                className="absolute -top-px left-8 right-8 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #FFD700, transparent)",
                }}
              />

             

              <div className="font-rajdhani space-y-5">
                <div className="rounded-xl border border-border/30 bg-bg/60 p-4 text-sm text-fg/75">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-gold shrink-0" />
                    <div>
                      <p className="font-semibold text-fg">Google only access</p>
                    </div>
                  </div>
                </div>

                {authError ? (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {authError}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={startGoogleAuth}
                  disabled={isSigningIn}
                  className="group relative w-full overflow-hidden rounded-lg font-orbitron font-bold tracking-[0.15em] uppercase text-bg py-3 transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    background:
                      "linear-gradient(135deg, #FFD700 0%, #F4C430 50%, #FFD700 100%)",
                    boxShadow: "0 8px 30px -10px rgba(255,215,0,0.6)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSigningIn ? "Opening Google..." : "Sign In with Google"}
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                    }}
                  />
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] font-mono tracking-[0.2em] uppercase text-fg/40">
              Electronics &amp; Robotics Society
              <span className="mx-2 text-gold/60">·</span>
              IIITDM Jabalpur
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LoginPage;
