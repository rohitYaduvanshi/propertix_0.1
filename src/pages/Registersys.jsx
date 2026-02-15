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

  // अकाउंट बदलने पर स्क्रीन पर एड्रेस अपडेट करने के लिए
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setConnectedAddress(accounts[0] || "");
      });
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Opening MetaMask Account Selector...");

    try {
      if (!window.ethereum) return alert("MetaMask install karein!");

      // --- ACCOUNT SELECTION LOGIC ---
      // यह कमांड MetaMask को मजबूर करेगी कि वह आपको अकाउंट चुनने का मौका दे
      const accounts = await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      }).then(() => window.ethereum.request({
        method: "eth_requestAccounts"
      }));

      const walletAddress = accounts[0];
      setConnectedAddress(walletAddress);
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      // STEP 1: BLOCKCHAIN REGISTRATION
      setStatus("Step 1/2: Securing Role on Blockchain... Please Confirm in MetaMask");
      
      // गैस एरर से बचने के लिए हम मैन्युअल गैस सेटिंग्स भी जोड़ सकते हैं
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

      // अपनी Vercel API का लिंक यहाँ डालें
      const response = await axios.post("https://propertix-0-1.vercel.app/api/auth/register", {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          walletAddress: walletAddress.toLowerCase(),
          signature: signature 
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Registration Complete!");
        alert("🎉 Registration Successful! 10,000 ETH has been utilized.");
        navigate("/login");
      }

    } catch (error) {
      console.error(error);
      // अगर यूजर ने गलत अकाउंट चुना या ट्रांजेक्शन रिजेक्ट किया
      const errorMsg = error.reason || error.message || "Unknown Error";
      alert("❌ Error: " + errorMsg);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
        
        {/* Connection Status Badge */}
        <div className="mb-6 text-center">
          <div className={`inline-block px-4 py-1.5 rounded-full border text-[10px] font-mono ${
              connectedAddress ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
          }`}>
            {connectedAddress ? `ACTIVE: ${connectedAddress.substring(0,6)}...${connectedAddress.substring(38)}` : "WALLET NOT CONNECTED"}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-center tracking-tight text-white">Join Propertix</h1>
        <p className="text-gray-500 text-[11px] text-center mb-6 uppercase tracking-widest">Decentralized Land Registry</p>

        {status && (
          <div className="mb-6 p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-cyan-400 text-[10px] text-center font-mono italic">
            {status}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-gray-500 text-[9px] font-bold uppercase tracking-tighter ml-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition mt-1 text-sm" placeholder="Rohit Yadav" />
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
            {loading ? "CHECK METAMASK..." : "SECURE IDENTITY"}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-[10px] mt-8 font-medium italic">
          *Note: 10,000 ETH waala account hi select karein.*
        </p>
      </div>
    </div>
  );
};

export default Register;