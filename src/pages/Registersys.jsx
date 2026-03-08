import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ethers } from "ethers"; 
import axios from "axios";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";
import { useSmartAccount } from "../context/SmartAccountContext"; // ✅ Added Smart Account Hook

const Register = () => {
  const navigate = useNavigate();
  const { smartAccount, smartAccountAddress, loginWithSocial, isLocalhost } = useSmartAccount(); // ✅ Using Discussed Context
  
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    role: "USER", 
    secretCode: "",
    aadhaar: "" 
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.aadhaar || formData.aadhaar.length < 12) {
        return alert("Please enter a valid 12-digit Aadhaar number.");
    }

    setLoading(true);
    setStatus("Initiating Identity Bonding...");

    try {
      // 1. SOCIAL LOGIN / SMART ACCOUNT CONNECTION [cite: 2026-03-01]
      let currentAddress = smartAccountAddress;
      if (!currentAddress) {
        setStatus("Step 1/4: Connecting Social Identity...");
        currentAddress = await loginWithSocial();
      }

      // 2. BLOCKCHAIN REGISTRATION (Binding Wallet to Identity) [cite: 2026-01-24]
      setStatus("Step 2/4: Securing Identity on Blockchain...");
      
      // smartAccount as Discussed will be Signer (Localhost) or Biconomy Account (Amoy) [cite: 2026-03-01]
      const contract = new ethers.Contract(
        PROPERTY_REGISTRY_ADDRESS, 
        PROPERTY_REGISTRY_ABI, 
        smartAccount
      );

      // Sending 5 parameters as per your Smart Contract
      const tx = await contract.registerUser(
        formData.name,
        formData.email,
        formData.role,
        formData.secretCode || "N/A",
        formData.aadhaar
      );
      
      if (!isLocalhost) {
        // If Biconomy/Amoy, we wait for transaction receipt [cite: 2026-01-24]
        await tx.wait(); 
      }
      console.log("✅ Identity Bonded on Blockchain");

      // 3. BACKEND SYNC [cite: 2026-02-21]
      setStatus("Step 3/4: Syncing with Database...");
      
      // Hashing Aadhaar for DB Security [cite: 2026-03-01]
      const aadhaarHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(formData.aadhaar));

      // Note: SignMessage might behave differently in Smart Accounts vs EOA [cite: 2026-03-01]
      const response = await axios.post("https://propertixbackend-production.up.railway.app/api/auth/register", {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        walletAddress: currentAddress.toLowerCase(),
        aadhaarHash: aadhaarHash,
        isSmartAccount: !isLocalhost // Tells backend it's a Biconomy wallet
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Identity Bonded!");
        alert("🎉 Identity Linked Successfully! Smart Account Ledger Created.");
        navigate("/login");
      }

    } catch (error) {
      console.error("Registration Error:", error);
      alert("❌ Error: " + (error.message || "Failed to link identity"));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* DESIGN UNTOUCHED - REST OF YOUR COMPONENT JSX CODE HERE */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full"></div>

        <div className="mb-6 text-center relative z-10">
          <div className={`inline-block px-4 py-1.5 rounded-full border text-[10px] font-mono tracking-tighter ${smartAccountAddress ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"}`}>
            {smartAccountAddress ? `ID-LOCKED: ${smartAccountAddress.substring(0, 10)}...` : "LEDGER: IDENTITY_BONDING_REQUIRED"}
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1 text-center tracking-tighter uppercase italic">Secure Register</h1>
        <p className="text-gray-500 text-[10px] text-center mb-8 uppercase tracking-[0.3em] font-bold italic">Interlinking Wallet to Aadhaar</p>

        {status && (
          <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-cyan-400 text-[9px] text-center font-black uppercase tracking-widest animate-pulse">
            {status}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-4 rounded-2xl focus:border-cyan-500 outline-none transition text-xs font-bold" placeholder="Legal Full Name" />
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-4 rounded-2xl focus:border-cyan-500 outline-none transition text-xs font-bold" placeholder="Email Address" />
          
          <div className="relative">
            <input 
              type="text" 
              maxLength="12"
              required 
              value={formData.aadhaar} 
              onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })} 
              className="w-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-100 p-4 rounded-2xl focus:border-cyan-500 outline-none transition text-xs font-bold tracking-[0.2em]" 
              placeholder="12-DIGIT AADHAAR" 
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {['USER', 'GOVT_OFFICER', 'SURVEYOR', 'REGISTRAR'].map(role => (
              <button key={role} type="button" onClick={() => setFormData({ ...formData, role: role, secretCode: "" })}
                className={`py-3 text-[9px] font-black rounded-xl border transition-all uppercase tracking-tighter ${formData.role === role ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>

          {formData.role !== "USER" && (
            <input type="password" required onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })} className="w-full bg-red-500/5 border border-red-500/20 text-white p-4 rounded-2xl outline-none transition text-xs font-bold placeholder:text-red-900/50" placeholder="Officer Access Key" />
          )}

          <button type="submit" disabled={loading}
            className={`w-full font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-2xl mt-4 transition-all duration-500 ${loading ? "bg-zinc-900 text-zinc-700 cursor-not-allowed" : "bg-white text-black hover:bg-cyan-400 shadow-2xl active:scale-95"}`}>
            {loading ? "AUTHORIZING LEDGER..." : "BIND WALLET & REGISTER"}
          </button>
        </form>
        {/* ... */}
      </div>
    </div>
  );
};

export default Register;