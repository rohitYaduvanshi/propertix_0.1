import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const roles = [
  {
    id: "USER",
    label: "Citizen Login",
    sub: "Property Owners & Buyers",
    icon: "👤",
    color: "cyan",
    border: "rgba(6,182,212,0.3)",
    bg: "rgba(6,182,212,0.05)",
  },
  {
    id: "GOVT_OFFICER",
    label: "Govt. Officer",
    sub: "Identity & Record Verification",
    icon: "🏛️",
    color: "blue",
    border: "rgba(59,130,246,0.3)",
    bg: "rgba(59,130,246,0.05)",
  },
  {
    id: "SURVEYOR",
    label: "Surveyor",
    sub: "Land Survey Authority",
    icon: "🚧",
    color: "yellow",
    border: "rgba(234,179,8,0.3)",
    bg: "rgba(234,179,8,0.05)",
  },
  {
    id: "REGISTRAR",
    label: "Registrar",
    sub: "Deed Registration Office",
    icon: "⚖️",
    color: "emerald",
    border: "rgba(16,185,129,0.3)",
    bg: "rgba(16,185,129,0.05)",
  },
];

const Login = () => {
  const { loginWithRole, loading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeRole, setActiveRole] = useState(null);

  const handleLogin = async (role) => {
    try {
      setIsProcessing(true);
      setActiveRole(role);
      const success = await loginWithRole(role);
      if (success) {
        if (role === "GOVT_OFFICER") navigate("/government-portal");
        else if (["ADMIN","SURVEYOR","REGISTRAR"].includes(role)) navigate("/admin");
        else navigate("/home");
      } else {
        alert("Login failed! This wallet is not registered as " + role + ".");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred. Check MetaMask.");
    } finally {
      setIsProcessing(false);
      setActiveRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ======= LEFT PANEL: Blockchain Visual ======= */}
      <div className="hidden lg:flex flex-col justify-between relative flex-1 p-12 overflow-hidden">

        {/* Animated background grid */}
        <div className="absolute inset-0 bg-grid opacity-60" />
        
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)" }} />

        {/* Top badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Propertix Network • Live</span>
          </div>
        </div>

        {/* Center: Blockchain Animation */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-12">
          
          {/* Central hexagon / logo visual */}
          <div className="relative mb-10">
            {/* Outer rings */}
            <div className="absolute inset-0 rounded-full animate-spin-slow"
              style={{ border: "1px solid rgba(6,182,212,0.12)", transform: "scale(2.8)" }} />
            <div className="absolute inset-0 rounded-full animate-spin-slow"
              style={{ border: "1px dashed rgba(6,182,212,0.07)", transform: "scale(2.2)", animationDirection: "reverse", animationDuration: "15s" }} />

            {/* Center glow orb */}
            <div className="w-32 h-32 rounded-full flex items-center justify-center animate-glow-pulse"
              style={{
                background: "radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(6,182,212,0.05) 70%)",
                border: "1px solid rgba(6,182,212,0.3)",
                boxShadow: "0 0 40px rgba(6,182,212,0.3), inset 0 0 40px rgba(6,182,212,0.05)"
              }}>
              <span className="text-5xl">🏛️</span>
            </div>

            {/* Satellite nodes */}
            {[
              { icon: "🏠", angle: 0, label: "Land NFT" },
              { icon: "🔗", angle: 72, label: "Blockchain" },
              { icon: "🛡️", angle: 144, label: "Verified" },
              { icon: "📋", angle: 216, label: "Registry" },
              { icon: "🔑", angle: 288, label: "Ownership" },
            ].map(({ icon, angle, label }, i) => {
              const rad = (angle - 90) * (Math.PI / 180);
              const r = 120;
              const x = Math.cos(rad) * r;
              const y = Math.sin(rad) * r;
              return (
                <div key={i}
                  className="absolute flex flex-col items-center gap-1"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 0.3}s`
                  }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg animate-float"
                    style={{
                      background: "rgba(6,182,212,0.08)",
                      border: "1px solid rgba(6,182,212,0.2)",
                      animationDelay: `${i * 0.8}s`
                    }}>
                    {icon}
                  </div>
                  <span className="text-[8px] text-cyan-400/60 font-bold tracking-wider whitespace-nowrap">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Tagline */}
          <h2 className="text-4xl font-black text-center leading-tight mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            <span className="text-white">Secure Your</span>{" "}
            <br />
            <span style={{
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>Land on Blockchain</span>
          </h2>
          <p className="text-zinc-500 text-sm text-center max-w-xs leading-relaxed">
            Immutable land records backed by Ethereum smart contracts. Tamper-proof. Transparent. Yours forever.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { val: "2,400+", label: "Deeds Issued" },
            { val: "100%", label: "Tamper-proof" },
            { val: "< 2s", label: "Avg. TX Speed" },
          ].map(({ val, label }) => (
            <div key={label} className="text-center p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xl font-black text-white">{val}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ======= RIGHT PANEL: Login Form ======= */}
      <div className="flex flex-col justify-center w-full lg:w-[480px] min-h-screen p-8 lg:p-12 relative"
        style={{ background: "rgba(8,8,8,0.95)", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>

        {/* Top glow */}
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(6,182,212,0.08), transparent 70%)" }} />

        <div className="relative z-10 max-w-sm mx-auto w-full">

          {/* Header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <span className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">🔐 Secure Identity Portal</span>
            </div>
            <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Welcome Back
            </h1>
            <p className="text-zinc-500 text-sm">Choose your role and connect your MetaMask wallet to access the registry.</p>
          </div>

          {/* Role Cards */}
          <div className="space-y-3 mb-6">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleLogin(role.id)}
                disabled={loading || isProcessing}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden"
                style={{
                  background: activeRole === role.id ? role.bg : "rgba(255,255,255,0.02)",
                  border: `1px solid ${activeRole === role.id ? role.border : "rgba(255,255,255,0.06)"}`,
                  transform: "translateY(0)",
                  boxShadow: activeRole === role.id ? `0 4px 20px ${role.border}` : "none"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = role.border;
                  e.currentTarget.style.background = role.bg;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  if (activeRole !== role.id) {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{role.icon}</span>
                  <div className="text-left">
                    <p className="text-white font-bold text-sm">{role.label}</p>
                    <p className="text-zinc-500 text-[11px]">{role.sub}</p>
                  </div>
                </div>
                {activeRole === role.id && (loading || isProcessing) ? (
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                        style={{ animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                ) : (
                  <svg className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Admin Access */}
          <button
            onClick={() => handleLogin("ADMIN")}
            disabled={loading || isProcessing}
            className="w-full py-3 text-[10px] text-zinc-700 hover:text-red-500 font-black tracking-[0.3em] uppercase transition-colors"
          >
            • Government Admin Access •
          </button>

          {/* Processing Banner */}
          {(isProcessing || loading) && (
            <div className="mt-4 p-4 rounded-2xl flex items-center gap-3 animate-scale-in"
              style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
              <p className="text-cyan-400 text-xs font-bold tracking-widest">VERIFYING BLOCKCHAIN IDENTITY...</p>
            </div>
          )}

          {/* Register Link */}
          <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-zinc-600 text-xs text-center">
              New to Propertix?{" "}
              <Link to="/register" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                Create Secure Account →
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Login;