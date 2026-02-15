import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import axios from "axios"; 
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", role: "USER", secretCode: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(""); 

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Initializing...");

    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        setLoading(false);
        return;
      }

      // 1. Setup Connection
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      // 2. STEP 1: BLOCKCHAIN REGISTRATION (Requires Gas)
      // Yeh role को स्मार्ट कॉन्ट्रैक्ट में हमेशा के लिए लॉक कर देगा
      setStatus("Step 1/2: Securing Role on Blockchain...");
      const tx = await contract.registerUser(
        formData.role, 
        formData.secretCode || "N/A"
      );
      await tx.wait(); 
      console.log("✅ Blockchain identity secured");

      // 3. STEP 2: NEON DB REGISTRATION (Free Profile)
      setStatus("Step 2/2: Saving Profile to Database...");
      
      // Digital Signature for Backend Verification (Security)
      const signatureMessage = `Registering to Propertix\nWallet: ${walletAddress}\nRole: ${formData.role}`;
      const signature = await signer.signMessage(signatureMessage);

      const response = await axios.post("http://localhost:5000/api/auth/register", {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          walletAddress: walletAddress.toLowerCase(),
          signature: signature // Backend can verify this
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Registration Complete!");
        alert("🎉 Registration Successful on Blockchain & Neon DB!");
        navigate("/login");
      }

    } catch (error) {
      console.error(error);
      if (error.code === 4001) {
         alert("❌ Transaction/Signature Denied.");
      } else if (error.response) {
        alert("❌ Database Error: " + error.response.data.message);
      } else {
        alert("❌ Registration Failed: " + (error.message || "Unknown Error"));
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
        
        {/* Decorative Light Effect */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Join Propertix</h1>
        <p className="text-gray-500 text-[11px] text-center mb-6 uppercase tracking-widest">Decentralized Land Registry</p>

        {status && (
          <div className="mb-6 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-cyan-400 text-[10px] text-center font-mono italic">
            {status}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-gray-500 text-[9px] font-bold uppercase tracking-tighter ml-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition mt-1 text-sm" placeholder="Rohit jii" />
          </div>

          <div>
            <label className="text-gray-500 text-[9px] font-bold uppercase tracking-tighter ml-1">Email Address</label>
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition mt-1 text-sm" placeholder="rohit@example.com" />
          </div>

          <div>
            <label className="text-gray-500 text-[9px] font-bold uppercase tracking-tighter ml-1">Account Role</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
                {['USER', 'SURVEYOR', 'REGISTRAR'].map(role => (
                    <button key={role} type="button" onClick={() => setFormData({...formData, role: role, secretCode: ""})} 
                        className={`py-2.5 text-[10px] font-black rounded-xl border transition-all duration-300 ${
                            formData.role === role 
                            ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                            : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-600'
                        }`}
                    >
                        {role}
                    </button>
                ))}
            </div>
          </div>

          {formData.role !== "USER" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-red-500 text-[9px] font-bold uppercase tracking-tighter ml-1">Authorized Access Code</label>
                <input type="password" required onChange={(e) => setFormData({...formData, secretCode: e.target.value})} className="w-full bg-red-500/5 border border-red-500/20 text-white p-3 rounded-xl focus:border-red-500 outline-none transition mt-1 text-sm" placeholder="Enter Secret Key" />
              </div>
          )}

          <button type="submit" disabled={loading} 
            className={`w-full font-black text-xs uppercase tracking-widest py-4 rounded-xl mt-6 transition-all duration-500 ${
                loading 
                ? "bg-zinc-900 text-zinc-700 cursor-not-allowed" 
                : "bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-[1.02] active:scale-95 shadow-lg shadow-cyan-500/20"
            }`}
          >
            {loading ? "Syncing Blockchain..." : "Secure Identity"}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-[10px] mt-8 font-medium">
          ALREADY SECURED? <Link to="/login" className="text-white hover:text-cyan-400 underline underline-offset-4 transition-colors">ACCESS PORTAL</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;