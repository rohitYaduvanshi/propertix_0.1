import React, { useState } from 'react';
import { Send, ShieldCheck, ArrowRightLeft, Landmark, UserPlus, Info, CheckCircle2, ChevronRight, LayoutGrid } from 'lucide-react';

const GiftOwnership = () => {
  // 1. Mock Data for User's Verified Properties
  const [userProperties] = useState([
    { id: 'PRP-9921', name: 'Skyline Luxury Villa', location: 'Sector 45, Gurgaon', idNFT: '#NFT-8829104', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80', value: '4.5 Cr' },
    { id: 'PRP-1022', name: 'Oceanic Apartment', location: 'Marine Drive, Mumbai', idNFT: '#NFT-1120392', img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80', value: '8.2 Cr' },
    { id: 'PRP-4456', name: 'Green Valley Plot', location: 'Dehradun, UK', idNFT: '#NFT-4456771', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80', value: '1.2 Cr' },
    { id: 'PRP-7781', name: 'Industrial Hub A1', location: 'Bhiwadi, Rajasthan', idNFT: '#NFT-7781200', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80', value: '15 Cr' },
  ]);

  const [selectedProperty, setSelectedProperty] = useState(null); // Selected Property State
  const [formData, setFormData] = useState({ recipientWallet: '', recipientAadhar: '', relationship: 'Son' });

  const handleTransfer = (e) => {
    e.preventDefault();
    alert(`Transfer Request for ${selectedProperty.name} initiated!`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            {selectedProperty ? "Finalize Transfer" : "Select Property to Gift"}
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            {selectedProperty ? `Transferring ownership of ${selectedProperty.name}` : "Choose one of your verified assets from the blockchain registry."}
          </p>
        </div>

        {/* --- STEP 1: PROPERTY SELECTION GRID --- */}
        {!selectedProperty ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {userProperties.map((prop) => (
              <div 
                key={prop.id}
                onClick={() => setSelectedProperty(prop)}
                className="group cursor-pointer bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 shadow-xl"
              >
                <div className="h-40 overflow-hidden relative">
                   <img src={prop.img} alt={prop.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                   <p className="absolute bottom-2 left-4 font-mono text-cyan-400 text-xs">{prop.idNFT}</p>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{prop.name}</h3>
                  <p className="text-gray-500 text-xs mb-4">{prop.location}</p>
                  <button className="w-full py-2 bg-white/10 rounded-xl text-sm font-semibold group-hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2">
                    Select Asset <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* --- STEP 2: TRANSFER FORM VIEW --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500">
            {/* Back Button */}
            <button 
              onClick={() => setSelectedProperty(null)}
              className="lg:col-span-3 w-fit flex items-center gap-2 text-gray-400 hover:text-white mb-2 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 rotate-180" /> Back to Selection
            </button>

            {/* Left: Selected Card */}
            <div className="lg:col-span-1">
               <div className="bg-gradient-to-b from-cyan-500/20 to-white/5 border border-cyan-500/30 rounded-3xl p-1 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                 <img src={selectedProperty.img} alt="Selected" className="w-full h-48 object-cover rounded-2xl mb-4" />
                 <h3 className="text-2xl font-bold">{selectedProperty.name}</h3>
                 <p className="text-gray-400 text-sm mb-4">{selectedProperty.location}</p>
                 <div className="space-y-3 py-4 border-t border-white/10">
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Asset ID</span><span>{selectedProperty.id}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Market Value</span><span className="text-green-400 font-bold">₹ {selectedProperty.value}</span></div>
                 </div>
               </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <form onSubmit={handleTransfer} className="space-y-6 text-left">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Recipient Wallet Address</label>
                    <input 
                      type="text" required placeholder="0x..." 
                      className="w-full bg-black/40 border border-white/10 px-4 py-4 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Recipient Aadhar</label>
                      <input type="text" required placeholder="XXXX XXXX XXXX" className="w-full bg-black/40 border border-white/10 px-4 py-4 rounded-2xl outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Relationship</label>
                      <select className="w-full bg-black/40 border border-white/10 px-4 py-4 rounded-2xl outline-none appearance-none text-white">
                        <option>Son</option><option>Daughter</option><option>Spouse</option><option>Brother</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex gap-3 italic text-xs text-amber-200/60">
                    <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                    This is a permanent blockchain action. Once transferred, only the new owner can revert the ownership.
                  </div>
                  <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-cyan-900/20">
                    Execute Ownership Transfer
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftOwnership;