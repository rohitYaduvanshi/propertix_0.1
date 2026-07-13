import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BrowserProvider, Contract } from "ethers";
import axios from "axios";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";

const MyProfile = () => {
  const { walletAddress, isWalletConnected, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "User",
    role: "GUEST",
    email: "No Email Linked",
    phone: "",
    bio: "Blockchain User exploring decentralized land records.",
    location: "India",
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=default`,
    propertiesOwned: 0,
  });

  // --- 1. FETCH DATA (Blockchain + Neon DB) ---
  useEffect(() => {
    const fetchFullProfile = async () => {
      if (!walletAddress) return;
      try {
        setLoading(true);
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

        // A. Blockchain Stats (Count Properties)
        const allRequests = await contract.getAllRequests();
        const myCount = allRequests.filter(req => req.requester.toLowerCase() === walletAddress.toLowerCase()).length;

        // B. Neon DB Data (Bio, Phone, Location)
        let dbData = {};
        try {
          const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
          const res = await axios.get(`${apiBase}/api/auth/user/${walletAddress.toLowerCase()}`);
          dbData = res.data;
        } catch (e) { console.warn("Neon DB profile not found, using defaults."); }

        setFormData(prev => ({
          ...prev,
          name: dbData.name || currentUser?.name || "Verified Citizen",
          email: dbData.email || currentUser?.email || "No Email",
          role: currentUser?.role || "USER",
          phone: dbData.phone || "",
          bio: dbData.bio || "Secure land ownership on-chain.",
          location: dbData.location || "India",
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`,
          propertiesOwned: myCount
        }));
      } catch (error) {
        console.error("Profile Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isWalletConnected) fetchFullProfile();
  }, [walletAddress, isWalletConnected, currentUser]);

  // --- 2. SAVE CHANGES TO NEON DB ---
  const handleSave = async () => {
    try {
      setSaving(true);
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      await axios.put(`${apiBase}/api/auth/update-profile`, {
        walletAddress: walletAddress.toLowerCase(),
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location
      });
      
      setIsEditing(false);
      alert("Profile Successfully Secured in Database! ✅");
    } catch (err) {
      console.error(err);
      alert("Database Sync Failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isWalletConnected) return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="text-center p-12 rounded-[32px]" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Vault Locked</h2>
        <p className="text-zinc-500 text-sm">Please connect MetaMask to view identity.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-8 pb-12 px-4 relative overflow-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)" }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)" }} />

      <div className="max-w-5xl mx-auto relative z-10">

        {/* --- COVER BANNER --- */}
        <div className="relative mb-28">
          <div className="h-56 w-full rounded-[32px] relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(59,130,246,0.1) 50%, rgba(99,102,241,0.08) 100%)",
              border: "1px solid rgba(255,255,255,0.06)"
            }}>
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)" }} />
            <div className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">On-Chain Identity</span>
            </div>
          </div>

          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
            <div className="relative group">
              <img src={formData.photo} alt="User" className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover transition-all group-hover:scale-105"
                style={{ border: "4px solid #050505", boxShadow: "0 0 0 2px rgba(6,182,212,0.3), 0 10px 40px rgba(0,0,0,0.5)" }} />
              <div className="absolute bottom-3 right-3 w-5 h-5 bg-emerald-400 rounded-full border-[3px] animate-pulse" style={{ borderColor: "#050505" }} />
            </div>
            <div className="mb-4 hidden md:block">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{formData.name}</h1>
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}>
                  <svg className="w-3.5 h-3.5 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>{formData.role}</span>
                <span className="text-zinc-500 text-xs font-bold">📍 {formData.location}</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-12 right-0">
            <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
              style={{
                background: isEditing ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#06b6d4,#3b82f6)",
                color: "#000", boxShadow: isEditing ? "0 8px 25px rgba(16,185,129,0.3)" : "0 8px 25px rgba(6,182,212,0.3)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              {saving ? "Syncing..." : isEditing ? "✓ Save Profile" : "✎ Modify Details"}
            </button>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Records Owned", value: formData.propertiesOwned, color: "#fff" },
            { label: "Account Level", value: "Lvl 1", color: "#10b981" },
            { label: "Identity", value: "KYC", color: "#06b6d4" },
            { label: "Trust Score", value: "100%", color: "#6366f1" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-6 rounded-[28px] text-center transition-all duration-300 relative overflow-hidden shine"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(6,182,212,0.25)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
              <p className="text-3xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* --- MAIN FORM SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="space-y-6">
            <div className="rounded-[28px] p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Blockchain Passport</h3>
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <p className="text-[9px] text-zinc-600 font-black uppercase mb-2">Public Key</p>
                        <p className="text-[10px] font-bold text-cyan-400 break-all leading-relaxed cursor-pointer hover:text-white transition-colors"
                          style={{ fontFamily: "'Space Mono', monospace" }}
                          onClick={() => navigator.clipboard.writeText(walletAddress)}>
                          {walletAddress}
                        </p>
                    </div>
                    <div className="p-4 rounded-2xl flex items-center justify-between" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div>
                           <p className="text-[9px] text-zinc-600 font-black uppercase mb-1">Ledger Status</p>
                           <p className="text-xs font-black text-emerald-400 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                             LIVE ON CHAIN
                           </p>
                        </div>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${walletAddress}&color=22d3ee&bgcolor=000000`} className="w-10 h-10 rounded-xl" alt="QR" style={{ border: "1px solid rgba(6,182,212,0.3)" }} />
                    </div>
                </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-[28px] p-8 md:p-10" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
               <h2 className="text-xl font-black text-white mb-8 uppercase tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>Identity Details</h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PremiumField label="Legal Name" value={formData.name} disabled />
                  <PremiumField label="Email ID" value={formData.email} disabled />
                  <PremiumField label="Assigned Role" value={formData.role} disabled color="#818cf8" />
                  <PremiumField label="Location" value={formData.location} disabled={!isEditing}
                    onChange={(v) => setFormData({...formData, location: v})} editable={isEditing} />
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Identity Bio</label>
                    <textarea rows="3" disabled={!isEditing} value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full rounded-2xl p-4 text-white transition-all resize-none outline-none"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: isEditing ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(255,255,255,0.05)",
                        boxShadow: isEditing ? "0 0 0 3px rgba(6,182,212,0.08)" : "none"
                      }} />
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const PremiumField = ({ label, value, disabled, onChange, editable, color }) => (
  <div className="space-y-2">
    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
    <input
      type="text"
      disabled={disabled}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className="w-full rounded-2xl p-4 font-bold outline-none transition-all"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: editable ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(255,255,255,0.05)",
        color: color || (disabled ? "#71717a" : "#fff"),
        boxShadow: editable ? "0 0 0 3px rgba(6,182,212,0.08)" : "none",
        cursor: disabled ? "not-allowed" : "text"
      }}
    />
  </div>
);

export default MyProfile;