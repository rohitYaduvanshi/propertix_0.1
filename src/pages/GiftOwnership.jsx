import React, { useState } from 'react';
import { Send, ShieldCheck, ArrowRightLeft, Landmark, UserPlus, Info, CheckCircle2 } from 'lucide-react';

const GiftOwnership = () => {
  const [formData, setFormData] = useState({
    recipientWallet: '',
    recipientAadhar: '',
    relationship: 'Son',
    propertyId: 'PRP-9921'
  });

  const handleTransfer = (e) => {
    e.preventDefault();
    alert(`Transfer Request Sent for Property ${formData.propertyId} to ${formData.relationship}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans relative overflow-hidden">
      {/* Background Glows for Premium Look */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Family Ownership Transfer
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Securely gift your property NFT to your loved ones on the blockchain.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Property Preview (The "NFT" Card) */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden sticky top-10 shadow-2xl">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80" 
                  alt="Property" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Verified Asset</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest">NFT Token ID</p>
                    <p className="text-xl font-mono font-bold">#NFT-8829104</p>
                  </div>
                  <Landmark className="text-gray-500 w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Skyline Luxury Villa</h3>
                <p className="text-gray-400 text-sm mb-4">Sector 45, Gurgaon, Haryana</p>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                  <span className="text-gray-500">Current Value</span>
                  <span className="font-bold text-white text-lg">₹ 4.5 Cr</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: The Modern Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-cyan-500/20 p-3 rounded-2xl">
                  <UserPlus className="text-cyan-400 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Recipient Details</h2>
                  <p className="text-sm text-gray-400">Enter the family member's details below</p>
                </div>
              </div>

              <form onSubmit={handleTransfer} className="space-y-8">
                {/* Wallet Address Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    Digital Wallet Address <Info className="w-3 h-3 text-gray-500" />
                  </label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="0x71C7656EC7ab88b098defB751B7401B5f6d8976F" 
                      className="w-full bg-white/5 border border-white/10 px-12 py-4 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none text-gray-200"
                      onChange={(e) => setFormData({...formData, recipientWallet: e.target.value})}
                    />
                    <Send className="w-5 h-5 text-gray-500 absolute left-4 top-4.5 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhar Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Recipient Aadhar Number</label>
                    <input 
                      type="text" 
                      placeholder="XXXX XXXX XXXX" 
                      className="w-full bg-white/5 border border-white/10 px-4 py-4 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-gray-200"
                      onChange={(e) => setFormData({...formData, recipientAadhar: e.target.value})}
                    />
                  </div>

                  {/* Relation Dropdown */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Relationship Type</label>
                    <select 
                      className="w-full bg-white/5 border border-white/10 px-4 py-4 rounded-2xl focus:ring-2 focus:ring-cyan-500 outline-none appearance-none text-gray-200"
                      onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                    >
                      <option className="bg-black">Son</option>
                      <option className="bg-black">Daughter</option>
                      <option className="bg-black">Spouse</option>
                      <option className="bg-black">Brother</option>
                      <option className="bg-black">Sister</option>
                    </select>
                  </div>
                </div>

                {/* Important Disclaimer */}
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex gap-4">
                  <ShieldCheck className="text-amber-500 w-8 h-8 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-500 mb-1 text-left">Security Protocol</p>
                    <p className="text-[12px] text-amber-200/70 leading-relaxed text-left">
                      This action will initiate a smart contract execution. Ensure the recipient's Aadhar is already verified in the Propertix ecosystem to avoid transaction failure.
                    </p>
                  </div>
                </div>

                {/* Final Action Button */}
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 py-5 rounded-2xl font-black text-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  Confirm & Generate Gift Deed NFT
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftOwnership;