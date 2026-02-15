import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrowserProvider, Contract, ethers } from "ethers";
import axios from "axios";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

// Axios Default Config: Isse 405 error ke chances khatam ho jate hain
axios.defaults.baseURL = window.location.origin;

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", role: "USER", secretCode: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [connectedAddress, setConnectedAddress] = useState("");

  const HARDHAT_CHAIN_ID = "0x7a69";
  // Step 1: Apna ACTIVE Ngrok URL confirm karein
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
    setLoading(true);
    setStatus("Syncing MetaMask...");

    try {
      if (!window.ethereum) return alert("MetaMask install karein!");

      // 1. FORCE ACCOUNT SELECTION
      setStatus("Step 1/4: Select your 10,000 ETH account...");
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

      // 3. BLOCKCHAIN REGISTRATION
      setStatus("Step 3/4: Securing Identity on Blockchain...");
      const tx = await contract.registerUser(
        formData.role,
        formData.secretCode || "N/A"
      );
      await tx.wait();
      console.log("✅ Blockchain identity secured");

      // 4. BACKEND REGISTRATION (Fixed for Vercel)
      // Step 4: BACKEND REGISTRATION (Vercel Fix)
      setStatus("Step 4/4: Saving Profile to Neon DB...");
      const signatureMessage = `Registering to Propertix\nWallet: ${walletAddress}\nRole: ${formData.role}`;
      const signature = await signer.signMessage(signatureMessage);

      const response = await axios({
        method: 'POST', 
        url: '/api/auth/register',
        data: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          walletAddress: walletAddress.toLowerCase(),
          signature: signature
        },
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Success!");
        alert("🎉 Registration Successful! Database updated.");
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
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative">

        {/* Connection Status Badge */}
        <div className="mb-6 text-center">
          <div className={`inline-block px-4 py-1.5 rounded-full border text-[10px] font-mono ${connectedAddress ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
            }`}>
            {connectedAddress ? `CONNECTED: ${connectedAddress.substring(0, 6)}...${connectedAddress.substring(38)}` : "WAITING FOR WALLET"}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-center tracking-tight">Join Propertix</h1>
        <p className="text-gray-400 text-[11px] text-center mb-6 uppercase tracking-widest font-bold">Secure Land Registry</p>

        {status && (
          <div className="mb-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-[10px] text-center font-mono animate-pulse">
            {status}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition text-sm" placeholder="Full Name" />
          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 text-white p-3 rounded-xl focus:border-cyan-500 outline-none transition text-sm" placeholder="Email Address" />

          <div className="grid grid-cols-3 gap-2 mt-2">
            {['USER', 'SURVEYOR', 'REGISTRAR'].map(role => (
              <button key={role} type="button" onClick={() => setFormData({ ...formData, role: role, secretCode: "" })}
                className={`py-2 text-[10px] font-black rounded-xl border transition-all ${formData.role === role ? 'bg-white text-black border-white shadow-lg' : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
              >
                {role}
              </button>
            ))}
          </div>

          {formData.role !== "USER" && (
            <input type="password" required onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })} className="w-full bg-red-500/5 border border-red-500/20 text-white p-3 rounded-xl outline-none transition text-sm" placeholder="Secret Access Key" />
          )}

          <button type="submit" disabled={loading}
            className={`w-full font-black text-xs uppercase tracking-widest py-4 rounded-xl mt-6 transition-all duration-500 ${loading ? "bg-zinc-900 text-zinc-700 cursor-not-allowed" : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              }`}
          >
            {loading ? "SYNCING..." : "SECURE IDENTITY"}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-[9px] mt-8 uppercase tracking-tighter">
          *Switch to the 10,000 ETH account during MetaMask popup*
        </p>
      </div>
    </div>
  );
};

export default Register;