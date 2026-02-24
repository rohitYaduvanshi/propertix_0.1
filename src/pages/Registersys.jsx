import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import axios from "axios";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    role: "USER", 
    secretCode: "",
    aadhaar: "" // ✅ नया फील्ड: Identity Linking के लिए
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [connectedAddress, setConnectedAddress] = useState("");

  const HARDHAT_CHAIN_ID = "0x7a69";
  const NGROK_RPC_URL = "https://pseudoascetically-respective-granville.ngrok-free.dev";

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setConnectedAddress(accounts[0] || "");
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.aadhaar || formData.aadhaar.length < 12) {
        return alert("Please enter a valid 12-digit Aadhaar number for identity linking.");
    }

    setLoading(true);
    setStatus("Syncing MetaMask...");

    try {
      if (!window.ethereum) return alert("MetaMask install karein!");

      // 1. FORCE ACCOUNT SELECTION
      setStatus("Step 1/4: Select your wallet...");
      const accounts = await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      }).then(() => window.ethereum.request({ method: "eth_requestAccounts" }));

      const walletAddress = accounts[0];
      setConnectedAddress(walletAddress);

      // 2. FORCE NETWORK SWITCH
      setStatus("Step 2/4: Connecting to Propertix Testnet...");
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: HARDHAT_CHAIN_ID,
              chainName: 'Propertix Testnet',
              rpcUrls: [NGROK_RPC_URL],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
            }],
          });
        } else {
          throw switchError;
        }
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      // 3. BLOCKCHAIN REGISTRATION (Binding Wallet to Aadhaar)
      setStatus("Step 3/4: Linking Identity on Blockchain...");
      // ✅ अब हम 3 पैरामीटर्स भेज रहे हैं: Role, Secret, और Aadhaar
      const tx = await contract.registerUser(
        formData.role,
        formData.secretCode || "N/A",
        formData.aadhaar
      );
      await tx.wait();
      console.log("✅ Identity Linked on Blockchain");

      // 4. BACKEND REGISTRATION
      setStatus("Step 4/4: Syncing with Database...");
      const signatureMessage = `Registering to Propertix\nWallet: ${walletAddress}\nAadhaar: ${formData.aadhaar}\nRole: ${formData.role}`;
      const signature = await signer.signMessage(signatureMessage);

      const response = await axios.post("https://propertixbackend-production.up.railway.app/api/auth/register", {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        walletAddress: walletAddress.toLowerCase(),
        aadhaar: formData.aadhaar, // ✅ बैकएंड पर भी आधार भेजा जा रहा है
        signature: signature
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Success!");
        alert("🎉 Identity Linked & Registered Successfully! You can now login.");
        navigate("/login");
      }

    } catch (error) {
      console.error("Full Error Object:", error);
      const errorMsg = error.response?.data?.message || error.reason || error.message;
      alert("❌ Error: " + errorMsg);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Decorative Light */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full"></div>

        {/* Connection Status Badge */}
        <div className="mb-6 text-center relative z-10">
          <div className={`inline-block px-4 py-1.5 rounded-full border text-[10px] font-mono tracking-tighter ${connectedAddress ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
            }`}>
            {connectedAddress ? `ID-LINKED: ${connectedAddress.substring(0, 8)}...` : "PROTOCOL: IDENTITY_BONDING_REQUIRED"}
          </div>
        </div>

        <h1 className="text-3xl font-black mb-1 text-center tracking-tighter uppercase italic">Secure Register</h1>
        <p className="text-gray-500 text-[10px] text-center mb-8 uppercase tracking-[0.3em] font-bold">Linking Identity to Ledger</p>

        {status && (
          <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-cyan-400 text-[9px] text-center font-black uppercase tracking-widest animate-pulse">
            {status}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 relative z-10">
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-4 rounded-2xl focus:border-cyan-500 outline-none transition text-xs font-bold" placeholder="Legal Full Name" />
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 text-white p-4 rounded-2xl focus:border-cyan-500 outline-none transition text-xs font-bold" placeholder="Email Address" />
          
          {/* ✅ AADHAAR INPUT: Identity Linking के लिए सबसे जरूरी */}
          <div className="relative">
            <input 
              type="text" 
              maxLength="12"
              required 
              value={formData.aadhaar} 
              onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })} 
              className="w-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-100 p-4 rounded-2xl focus:border-cyan-500 outline-none transition text-xs font-bold tracking-[0.2em]" 
              placeholder="12-DIGIT AADHAAR NUMBER" 
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-cyan-500 font-black uppercase">Identity</div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {['USER', 'GOVT_OFFICER', 'SURVEYOR', 'REGISTRAR'].map(role => (
              <button key={role} type="button" onClick={() => setFormData({ ...formData, role: role, secretCode: "" })}
                className={`py-3 text-[9px] font-black rounded-xl border transition-all uppercase tracking-tighter ${formData.role === role ? 'bg-white text-black border-white shadow-lg scale-95' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
              >
                {role.replace('_', ' ')}
              </button>
            ))}
          </div>

          {formData.role !== "USER" && (
            <input type="password" required onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })} className="w-full bg-red-500/5 border border-red-500/20 text-white p-4 rounded-2xl outline-none transition text-xs font-bold" placeholder="Officer Access Key" />
          )}

          <button type="submit" disabled={loading}
            className={`w-full font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-2xl mt-4 transition-all duration-500 ${loading ? "bg-zinc-900 text-zinc-700 cursor-not-allowed" : "bg-white text-black hover:bg-cyan-400 shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
              }`}
          >
            {loading ? "LINKING IDENTITY..." : "BIND WALLET & REGISTER"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
            Already verified?
            <Link to="/login" className="text-cyan-500 font-black hover:text-cyan-400 ml-2 transition-colors underline underline-offset-8">
              PROCEED TO LOGIN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;