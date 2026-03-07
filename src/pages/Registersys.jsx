import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useSmartAccount } from "../context/SmartAccountContext";
import { getAadharHash } from "../utils/aadharUtils";

const Register = () => {
  const navigate = useNavigate();
  // Biconomy Social Auth hook (MetaMask bypass karne ke liye)
  const { smartAccount, smartAccountAddress, loginWithSocial } = useSmartAccount();

  const [formData, setFormData] = useState({ 
    name: "", email: "", role: "USER", secretCode: "", aadhaar: "" 
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.aadhaar || formData.aadhaar.length < 12) {
        return alert("Please enter a valid 12-digit Aadhaar number.");
    }

    setLoading(true);
    
    try {
      // 1. SOCIAL LOGIN (No MetaMask Popup)
      // Ye function Biconomy ke piche Google/Email se login karwaega
      if (!smartAccount) {
        setStatus("Initializing Secure Social Node...");
        await loginWithSocial(); // Isse user ko sirf Google login dikhega
      }

      const walletAddress = smartAccountAddress;
      const aadharHash = getAadharHash(formData.aadhaar);

      // 2. BACKEND SYNC (Database Entry)
      setStatus("Syncing Identity to Global Ledger...");
      const response = await axios.post("https://propertixbackend-production.up.railway.app/api/auth/register", {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        walletAddress: walletAddress.toLowerCase(),
        aadhaarHash: aadharHash,
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Identity Bonded!");
        alert("🎉 Registration Successful! Your Social Identity is now your Wallet.");
        navigate("/login");
      }

    } catch (error) {
      console.error("Registration Error:", error);
      alert("❌ Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full"></div>

        <h1 className="text-3xl font-black mb-1 text-center tracking-tighter uppercase italic">Register Node</h1>
        <p className="text-gray-500 text-[10px] text-center mb-8 uppercase tracking-[0.3em] font-bold italic">No MetaMask Required • Social Auth Sync</p>

        {status && (
          <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-cyan-400 text-[9px] text-center font-black uppercase tracking-widest animate-pulse">
            {status}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-4 rounded-2xl outline-none text-xs font-bold" placeholder="Legal Full Name" />
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-4 rounded-2xl outline-none text-xs font-bold" placeholder="Email Address" />
          
          <input 
            type="text" 
            maxLength="12"
            required 
            value={formData.aadhaar} 
            onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })} 
            className="w-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-100 p-4 rounded-2xl outline-none text-xs font-bold tracking-[0.2em]" 
            placeholder="12-DIGIT AADHAAR" 
          />

          <div className="grid grid-cols-2 gap-2 mt-2">
            {['USER', 'GOVT_OFFICER', 'SURVEYOR', 'REGISTRAR'].map(role => (
              <button key={role} type="button" onClick={() => setFormData({ ...formData, role: role })}
                className={`py-3 text-[9px] font-black rounded-xl border transition-all uppercase ${formData.role === role ? 'bg-white text-black border-white' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button type="submit" disabled={loading}
            className={`w-full font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-2xl mt-4 transition-all ${loading ? "bg-zinc-900 text-zinc-700" : "bg-white text-black hover:bg-cyan-400 active:scale-95"}`}>
            {loading ? "SYNCING..." : "INITIALIZE SOCIAL REGISTER"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link to="/login" className="text-zinc-500 text-[10px] font-bold uppercase hover:text-cyan-500">Already verified? Login_Node</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;