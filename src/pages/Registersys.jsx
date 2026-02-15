import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrowserProvider, Contract, ethers } from "ethers";
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
  const [connectedAddress, setConnectedAddress] = useState(""); 

  // --- WALLET LOGIC ---

  // अकाउंट बदलने पर अपने आप अपडेट होने के लिए useEffect
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress("");
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("MetaMask install karein!");
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setConnectedAddress(accounts[0]);
    } catch (err) {
      console.error("Connection failed", err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!connectedAddress) return alert("Pehle Wallet Connect/Select karein!");
    
    setLoading(true);
    setStatus("Initializing...");

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      // STEP 1: BLOCKCHAIN REGISTRATION
      setStatus("Step 1/2: Securing Role on Blockchain...");
      const tx = await contract.registerUser(
        formData.role, 
        formData.secretCode || "N/A"
      );
      await tx.wait(); 
      console.log("✅ Blockchain identity secured");

      // STEP 2: BACKEND (VERCEL) REGISTRATION
      setStatus("Step 2/2: Saving Profile to Database...");
      
      const signatureMessage = `Registering to Propertix\nWallet: ${walletAddress}\nRole: ${formData.role}`;
      const signature = await signer.signMessage(signatureMessage);

      // यहा अपने Vercel Backend का URL डालें
      const response = await axios.post("https://propertix-0-1.vercel.app/api/auth/register", {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          walletAddress: walletAddress.toLowerCase(),
          signature: signature 
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Registration Complete!");
        alert("🎉 Success! 10,000 ETH use karne ke liye taiyar hain!");
        navigate("/login");
      }

    } catch (error) {
      console.error(error);
      alert("❌ Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
        
        {/* Wallet Selection Button */}
        <div className="mb-6 text-center">
          <button 
            type="button"
            onClick={connectWallet}
            className={`w-full py-3 rounded-xl text-[10px] font-mono border transition-all ${
              connectedAddress 
              ? "border-green-500/50 bg-green-500/5 text-green-400" 
              : "border-cyan-500/50 bg-cyan-500/5 text-cyan-400 animate-pulse"
            }`}
          >
            {connectedAddress 
              ? `WALLET: ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(38)}` 
              : "CONNECT METAMASK ACCOUNT"}
          </button>
          <p className="text-[8px] text-zinc-600 mt-2 uppercase">MetaMask mein account switch karein</p>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-center tracking-tight">Join Propertix</h1>
        <p className="text-gray-500 text-[11px] text-center mb-6 uppercase tracking-widest">Decentralized Land Registry</p>

        {status && (
          <div className="mb-6 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-cyan-400 text-[10px] text-center font-mono italic">
            {status}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-gray-500 text-[9px] font-bold uppercase tracking-tighter ml-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition mt-1 text-sm" placeholder="Rohit Y.." />
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
                            ? 'bg-white text-black border-white shadow-lg' 
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
                : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
            }`}
          >
            {loading ? "Processing..." : "Secure Identity"}
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