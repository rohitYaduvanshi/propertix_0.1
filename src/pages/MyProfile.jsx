import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BrowserProvider, Contract } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";

const MyProfile = () => {
  const { walletAddress, isWalletConnected } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Default Structure
  const [formData, setFormData] = useState({
    name: "Loading...",
    role: "Fetching...",
    email: "...",
    phone: "",
    bio: "",
    location: "",
    photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress || 'default'}`, // Unique Avatar based on Wallet
    joinDate: "Just Now",
    propertiesOwned: 0,
    totalValue: "0 ETH"
  });

  // --- 1. FETCH DATA FROM BLOCKCHAIN ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!walletAddress) return;

      try {
        setLoading(true);
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

        // Blockchain se Data nikalo
        const user = await contract.users(walletAddress);
        
        // Local Storage se extra details nikalo (Bio, Phone etc.)
        const savedLocalDetails = JSON.parse(localStorage.getItem(`profile_${walletAddress}`)) || {};

        setFormData(prev => ({
          ...prev,
          name: user.name || "Unknown User",
          email: user.email || "No Email",
          role: user.role || "GUEST",
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`, // Sync Photo
          
          // Niche wale fields Blockchain pe nahi hain, isliye LocalStorage se liye
          phone: savedLocalDetails.phone || "",
          bio: savedLocalDetails.bio || "Blockchain User exploring decentralized land records.",
          location: savedLocalDetails.location || "India",
          
          // TODO: Properties count bhi blockchain se le sakte hain future mein
          propertiesOwned: 0, 
          totalValue: "0 ETH"
        }));

      } catch (error) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
    };

    if (isWalletConnected) {
      fetchUserProfile();
    }
  }, [walletAddress, isWalletConnected]);


  // --- 2. SAVE LOCAL CHANGES ---
  const handleSave = () => {
    // Blockchain data (Name/Email/Role) edit nahi hoga yahan se (immutability)
    // Sirf extra details local storage me save hongi demo ke liye
    const localData = {
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location
    };
    localStorage.setItem(`profile_${walletAddress}`, JSON.stringify(localData));
    
    setIsEditing(false);
    alert("Profile Updated locally! (Blockchain data remains immutable)");
  };

  if (!isWalletConnected) {
      return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
              <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Wallet Not Connected</h2>
                  <p className="text-gray-400">Please connect your wallet to view profile.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* --- HEADER --- */}
        <div className="relative mb-24">
          {/* Banner */}
          <div className="h-60 w-full rounded-3xl bg-gradient-to-r from-zinc-900 via-black to-zinc-900 border border-white/10 overflow-hidden relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          </div>

          {/* Avatar & Info */}
          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
            <div className="relative group">
              <img 
                src={formData.photo} 
                alt="Profile" 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-black bg-zinc-800 object-cover shadow-2xl transition-transform group-hover:scale-105"
              />
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-black rounded-full" title="Online"></div>
            </div>
            
            <div className="mb-4 hidden md:block">
              {loading ? (
                  <div className="h-8 w-48 bg-zinc-800 animate-pulse rounded mb-2"></div>
              ) : (
                  <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    {formData.name}
                    <span className="text-cyan-400" title="Verified on Blockchain">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </span>
                  </h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                 <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase border ${
                     formData.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                     formData.role === 'SURVEYOR' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                     formData.role === 'REGISTRAR' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                     'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                 }`}>
                    {formData.role}
                 </span>
                 <span className="text-gray-500 text-sm">• {formData.location}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="absolute -bottom-12 right-4 md:right-0">
             <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition shadow-lg ${isEditing 
                  ? 'bg-green-600 hover:bg-green-500 text-white' 
                  : 'bg-white text-black hover:bg-gray-200'}`}
             >
                {isEditing ? "Save Profile" : "Edit Details"}
             </button>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          
          {/* LEFT: Blockchain Card */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-6 shadow-xl">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Identity Verification</h3>
                
                <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                        <p className="text-xs font-mono text-cyan-400 break-all">{walletAddress}</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                        <div>
                            <p className="text-xs text-gray-500">Registration Status</p>
                            <p className="text-sm font-bold text-green-400">● Active on Chain</p>
                        </div>
                        {/* QR Code Dummy */}
                        <div className="w-8 h-8 bg-white p-0.5 rounded">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`} alt="QR" />
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT: Details Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-8 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">Profile Details</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Name (Read Only from Blockchain) */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Full Name (Blockchain)</label>
                     <input 
                        type="text" 
                        disabled 
                        value={formData.name} 
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 text-gray-400 cursor-not-allowed"
                     />
                  </div>

                  {/* Email (Read Only from Blockchain) */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Email (Blockchain)</label>
                     <input 
                        type="text" 
                        disabled 
                        value={formData.email} 
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 text-gray-400 cursor-not-allowed"
                     />
                  </div>

                  {/* Role (Read Only) */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Assigned Role</label>
                     <input 
                        type="text" 
                        disabled 
                        value={formData.role} 
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 text-gray-400 cursor-not-allowed font-bold"
                     />
                  </div>

                  {/* Location (Editable) */}
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                     <input 
                        type="text" 
                        disabled={!isEditing} 
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className={`w-full bg-black/40 border rounded-xl p-3 text-white transition ${isEditing ? 'border-cyan-500 focus:ring-1 focus:ring-cyan-500' : 'border-zinc-800'}`}
                     />
                  </div>

                  {/* Bio (Editable) */}
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-xs font-bold text-gray-500 uppercase">Bio / About</label>
                     <textarea 
                        rows="3"
                        disabled={!isEditing}
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className={`w-full bg-black/40 border rounded-xl p-3 text-white transition resize-none ${isEditing ? 'border-cyan-500 focus:ring-1 focus:ring-cyan-500' : 'border-zinc-800'}`}
                     />
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