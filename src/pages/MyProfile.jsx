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
          const res = await axios.get(`https://propertixbackend-production.up.railway.app/api/auth/user/${walletAddress.toLowerCase()}`);
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
      // Railway API Call to Update Profile
      await axios.put(`https://propertixbackend-production.up.railway.app/api/auth/update-profile`, {
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="bg-zinc-900/50 p-10 rounded-[40px] border border-white/5 text-center shadow-2xl">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Vault Locked</h2>
        <p className="text-gray-500 text-sm">Please connect MetaMask to view identity.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* --- HEADER SECTION --- */}
        <div className="relative mb-28">
          <div className="h-56 w-full rounded-[40px] bg-gradient-to-br from-zinc-900 to-black border border-white/5 relative overflow-hidden group">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 group-hover:scale-110 transition-transform duration-1000"></div>
          </div>

          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
            <div className="relative group">
              <img src={formData.photo} alt="User" className="w-32 h-32 md:w-44 md:h-44 rounded-full border-[8px] border-black bg-zinc-900 shadow-3xl transition-all group-hover:rotate-3" />
              <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 border-[4px] border-black rounded-full shadow-lg animate-bounce"></div>
            </div>
            
            <div className="mb-4 hidden md:block">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-white">{formData.name}</h1>
                <div className="bg-cyan-500 text-black p-0.5 rounded-full"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg></div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                 <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400">{formData.role}</span>
                 <span className="text-zinc-500 text-xs font-bold tracking-widest">📍 {formData.location}</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-12 right-0">
             <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${isEditing ? 'bg-emerald-600 text-white' : 'bg-white text-black hover:bg-cyan-400'}`}>
                {saving ? "Syncing..." : isEditing ? "Save Profile" : "Modify Details"}
             </button>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
           <div className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 text-center backdrop-blur-md">
              <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Records Owned</p>
              <p className="text-3xl font-black text-white">{formData.propertiesOwned}</p>
           </div>
           <div className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 text-center backdrop-blur-md">
              <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Account Level</p>
              <p className="text-3xl font-black text-emerald-500">Lvl 1</p>
           </div>
           <div className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 text-center backdrop-blur-md">
              <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Identity</p>
              <p className="text-3xl font-black text-cyan-500">K-Y-C</p>
           </div>
           <div className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 text-center backdrop-blur-md">
              <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Trust Score</p>
              <p className="text-3xl font-black text-indigo-500">100%</p>
           </div>
        </div>

        {/* --- MAIN FORM SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="space-y-6">
            <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[32px] border border-white/5 p-8 shadow-2xl">
                <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Blockchain Passport</h3>
                <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-black/50 border border-white/5">
                        <p className="text-[9px] text-zinc-600 font-black uppercase mb-1">Public Key</p>
                        <p className="text-[10px] font-mono text-cyan-400 break-all leading-relaxed cursor-pointer hover:text-white transition-colors" onClick={() => navigator.clipboard.writeText(walletAddress)}>
                          {walletAddress}
                        </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-between">
                        <div>
                           <p className="text-[9px] text-zinc-600 font-black uppercase">Ledger Status</p>
                           <p className="text-xs font-black text-emerald-400">● LIVE ON CHAIN</p>
                        </div>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${walletAddress}&color=22d3ee&bgcolor=000000`} className="w-10 h-10 rounded border border-white/10" alt="QR" />
                    </div>
                </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-zinc-900/60 backdrop-blur-2xl rounded-[32px] border border-white/5 p-8 md:p-10 shadow-2xl">
               <h2 className="text-xl font-black text-white mb-8 uppercase tracking-widest">Identity Details</h2>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Legal Name (Blockchain)</label>
                     <input type="text" disabled value={formData.name} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-zinc-400 cursor-not-allowed font-bold" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Email ID (Secured)</label>
                     <input type="text" disabled value={formData.email} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-zinc-400 cursor-not-allowed font-bold" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Assigned Role</label>
                     <input type="text" disabled value={formData.role} className="w-full bg-zinc-800/40 border border-white/5 rounded-2xl p-4 text-indigo-400 font-black tracking-widest" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Location</label>
                     <input type="text" disabled={!isEditing} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className={`w-full bg-black/40 border rounded-2xl p-4 text-white font-bold transition-all ${isEditing ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/5'}`} />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Identity Bio</label>
                     <textarea rows="3" disabled={!isEditing} value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className={`w-full bg-black/40 border rounded-2xl p-4 text-white transition-all resize-none ${isEditing ? 'border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/5'}`} />
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyProfile;