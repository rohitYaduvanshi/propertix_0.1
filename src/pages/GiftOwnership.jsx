import React, { useState } from 'react';
import { Send, User, ShieldCheck, ArrowRightLeft } from 'lucide-react';

const GiftOwnership = () => {
  const [formData, setFormData] = useState({
    recipientWallet: '',
    recipientAadhar: '',
    relationship: 'Son',
    propertyId: 'PRP-9921' // Mock Data
  });

  const handleTransfer = (e) => {
    e.preventDefault();
    alert(`Transfer Request Sent for Property ${formData.propertyId} to ${formData.relationship}`);
    // Yahan MetaMask and Backend API call aayegi
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <ArrowRightLeft className="text-blue-600" /> Ownership Transfer
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side: Property Details Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1582408921715-18e7806365c1?auto=format&fit=crop&w=600&q=80" 
              alt="Property" 
              className="w-full h-48 object-cover rounded-xl mb-4"
            />
            <div className="space-y-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">NFT ID: #88291</span>
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">Skyline Residency, Sector 5</h3>
              <p className="text-gray-500 text-sm">Verified Blockchain Asset | Registered via Aadhar</p>
            </div>
          </div>

          {/* Right Side: Transfer Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-50">
            <form onSubmit={handleTransfer} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Wallet Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="0x..." 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    onChange={(e) => setFormData({...formData, recipientWallet: e.target.value})}
                  />
                  <Send className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Aadhar</label>
                  <input 
                    type="text" 
                    placeholder="1234 XXXX XXXX" 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    onChange={(e) => setFormData({...formData, recipientAadhar: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                  <select 
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                  >
                    <option>Son</option>
                    <option>Daughter</option>
                    <option>Spouse</option>
                    <option>Brother</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                <ShieldCheck className="text-amber-600 w-10 h-10 shrink-0" />
                <p className="text-[12px] text-amber-800 leading-tight">
                  <strong>Important:</strong> Family transfers are irreversible on the blockchain. Ensure the recipient's Aadhar is already linked with their wallet.
                </p>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                Approve & Sign Transfer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftOwnership;