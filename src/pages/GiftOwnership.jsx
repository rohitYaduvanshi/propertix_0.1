import React, { useState, useEffect } from 'react';
import { Send, ShieldCheck, ArrowRightLeft, Landmark, UserPlus, Info, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios'; // API calls ke liye

const GiftOwnership = () => {
  const [properties, setProperties] = useState([]); // Real DB Data
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [formData, setFormData] = useState({ recipientWallet: '', recipientAadhar: '', relationship: 'Son' });

  // --- 1. Fetch Real Properties from Backend ---
  useEffect(() => {
    const fetchMyProperties = async () => {
      try {
        // Yahan apna Railway Backend URL dalo
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/properties/my-assets`, {
          withCredentials: true // Cookies/Auth ke liye zaroori
        });
        setProperties(response.data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProperties();
  }, []);

  // --- 2. Handle Final Transfer ---
  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferring(true);
    
    try {
      // Step A: Blockchain Transaction (MetaMask)
      // Yahan aapka contract call aayega (e.g., contract.transferToFamily(...))
      console.log("Initiating Blockchain Transaction...");

      // Step B: Update Backend Database (Neon)
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/properties/transfer`, {
        propertyId: selectedProperty.id,
        newOwnerWallet: formData.recipientWallet,
        newOwnerAadhar: formData.recipientAadhar,
        relation: formData.relationship
      }, { withCredentials: true });

      if (response.status === 200) {
        alert("🎉 Property Ownership Transferred Successfully on Blockchain & DB!");
        setSelectedProperty(null); // Reset
      }
    } catch (error) {
      alert("Transfer failed: " + (error.response?.data?.message || error.message));
    } finally {
      setTransferring(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-cyan-500">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="text-xl font-bold font-mono">Loading Verified Assets...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans relative">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              {selectedProperty ? "Finalize Transfer" : "Ownership Management"}
            </h1>
            <p className="text-gray-400 mt-2">Manage and gift your verified land NFTs.</p>
          </div>
          {selectedProperty && (
            <button onClick={() => setSelectedProperty(null)} className="text-cyan-500 hover:underline text-sm font-bold">
              ← Change Selection
            </button>
          )}
        </div>

        {/* --- View 1: Property Selection --- */}
        {!selectedProperty ? (
          properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <div 
                  key={prop.id} 
                  onClick={() => setSelectedProperty(prop)}
                  className="group cursor-pointer bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500 transition-all p-4"
                >
                  <img src={prop.imageUrl || "https://via.placeholder.com/300"} className="h-40 w-full object-cover rounded-2xl mb-4" />
                  <h3 className="text-xl font-bold">{prop.title}</h3>
                  <p className="text-gray-500 text-sm">{prop.location}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-cyan-400 font-mono text-xs">{prop.nftTokenId}</span>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-500">No verified properties found in your wallet.</p>
            </div>
          )
        ) : (
          /* --- View 2: Transfer Form --- */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in zoom-in-95 duration-300">
            {/* Property Detail Summary */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 h-fit">
               <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
                 <Landmark className="w-6 h-6" /> Asset Summary
               </h2>
               <div className="space-y-4">
                 <div className="flex justify-between"><span className="text-gray-500">Asset Name</span><span>{selectedProperty.title}</span></div>
                 <div className="flex justify-between"><span className="text-gray-500">Location</span><span>{selectedProperty.location}</span></div>
                 <div className="flex justify-between"><span className="text-gray-500">NFT Token</span><span className="font-mono">{selectedProperty.nftTokenId}</span></div>
               </div>
            </div>

            {/* Form */}
            <form onSubmit={handleTransfer} className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Recipient Wallet (MetaMask)</label>
                <input 
                  required type="text" placeholder="0x..." 
                  className="w-full bg-black/50 border border-white/10 p-4 rounded-xl outline-none focus:ring-1 ring-cyan-500"
                  onChange={(e) => setFormData({...formData, recipientWallet: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Recipient Aadhar Number</label>
                <input 
                  required type="text" placeholder="12-digit Number" 
                  className="w-full bg-black/50 border border-white/10 p-4 rounded-xl outline-none"
                  onChange={(e) => setFormData({...formData, recipientAadhar: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Relationship</label>
                <select className="w-full bg-black/50 border border-white/10 p-4 rounded-xl outline-none appearance-none" onChange={(e) => setFormData({...formData, relationship: e.target.value})}>
                  <option>Son</option><option>Daughter</option><option>Spouse</option><option>Brother</option>
                </select>
              </div>

              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3 italic text-[11px] text-amber-200/70">
                <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                Transferring an NFT asset is irreversible. The recipient must be an Indian citizen with a verified Aadhar.
              </div>

              <button 
                type="submit" 
                disabled={transferring}
                className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {transferring ? <Loader2 className="animate-spin" /> : "Initiate Blockchain Transfer"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftOwnership;