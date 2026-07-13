import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BrowserProvider, Contract, id } from "ethers";
import axios from "axios";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

const ROLES = [
  { id: "USER", label: "Citizen", icon: "👤", sub: "Property Owner" },
  { id: "GOVT_OFFICER", label: "Govt. Officer", icon: "🏛️", sub: "Official" },
  { id: "SURVEYOR", label: "Surveyor", icon: "🚧", sub: "Land Survey" },
  { id: "REGISTRAR", label: "Registrar", icon: "⚖️", sub: "Registration" },
];

const STEPS = ["Wallet", "Identity", "Confirm"];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", email: "", role: "USER", secretCode: "", aadhaar: ""
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [step, setStep] = useState(0);
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
      return alert("Please enter a valid 12-digit Aadhaar number.");
    }
    setLoading(true);
    setStep(0);

    try {
      if (!window.ethereum) return alert("MetaMask install karein!");

      setStatus("Step 1/4: Select your wallet...");
      setStep(1);
      const accounts = await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      }).then(() => window.ethereum.request({ method: "eth_requestAccounts" }));

      const walletAddress = accounts[0];
      setConnectedAddress(walletAddress);

      setStatus("Step 2/4: Connecting to Propertix Testnet...");
      setStep(2);
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
        } else { throw switchError; }
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      setStatus("Step 3/4: Securing Identity on Blockchain...");
      setStep(3);
      const tx = await contract.registerUser(
        formData.name, formData.email, formData.role,
        formData.secretCode || "N/A", formData.aadhaar
      );
      await tx.wait();

      setStatus("Step 4/4: Syncing with Database...");
      const signatureMessage = `Link Identity to Wallet\nName: ${formData.name}\nAadhaar Hash: ${id(formData.aadhaar)}\nWallet: ${walletAddress}`;
      const signature = await signer.signMessage(signatureMessage);

      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const response = await axios.post(`${apiBase}/api/auth/register`, {
        name: formData.name, email: formData.email, role: formData.role,
        walletAddress: walletAddress.toLowerCase(),
        aadhaarHash: id(formData.aadhaar), signature
      });

      if (response.status === 200 || response.status === 201) {
        setStatus("Identity Bonded!");
        alert("🎉 Identity Linked & Registered Successfully! Ledger entry created.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      const errorMsg = error.response?.data?.message || error.reason || error.message;
      alert("❌ Error: " + errorMsg);
    } finally {
      setLoading(false);
      setStatus("");
      setStep(0);
    }
  };

  const isOfficerRole = formData.role !== "USER";

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* Background elements */}
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at top right, rgba(6,182,212,0.07), transparent 65%)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle at bottom left, rgba(59,130,246,0.06), transparent 65%)" }} />

      <div className="w-full max-w-lg relative z-10">

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500"
                  style={{
                    background: step > i ? "linear-gradient(135deg, #06b6d4, #3b82f6)" : step === i && loading ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.05)",
                    border: step >= i ? "1px solid rgba(6,182,212,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    color: step > i ? "#000" : step === i ? "#06b6d4" : "#555"
                  }}>
                  {step > i ? "✓" : i + 1}
                </div>
                <span className="text-xs font-bold hidden sm:block"
                  style={{ color: step >= i ? "#06b6d4" : "#444" }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px transition-all duration-500"
                  style={{ background: step > i ? "linear-gradient(90deg, #06b6d4, #3b82f6)" : "rgba(255,255,255,0.08)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="relative rounded-[32px] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)"
          }}>

          {/* Top accent glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)" }} />

          <div className="p-8">
            {/* Wallet badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wider"
                style={{
                  background: connectedAddress ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
                  border: `1px solid ${connectedAddress ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                  color: connectedAddress ? "#10b981" : "#f59e0b"
                }}>
                {connectedAddress ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {connectedAddress.substring(0, 8)}...{connectedAddress.slice(-4)}
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Wallet Not Connected
                  </>
                )}
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Register Identity
              </h1>
              <p className="text-zinc-500 text-sm">Link your wallet to Aadhaar on the blockchain ledger</p>
            </div>

            {/* Status Banner */}
            {status && (
              <div className="mb-6 px-4 py-3 rounded-2xl flex items-center gap-3 animate-scale-in"
                style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)" }}>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                <p className="text-cyan-400 text-xs font-black uppercase tracking-widest">{status}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">

              {/* Name & Email */}
              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <input
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-premium"
                    placeholder="Legal Full Name"
                  />
                </div>
                <input
                  type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-premium"
                  placeholder="Email Address"
                />
              </div>

              {/* Aadhaar Field */}
              <div className="relative">
                <input
                  type="text" maxLength="12" required value={formData.aadhaar}
                  onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })}
                  className="input-premium"
                  placeholder="12-Digit Aadhaar Number"
                  style={{
                    background: "rgba(6,182,212,0.04)",
                    borderColor: formData.aadhaar.length === 12 ? "rgba(16,185,129,0.4)" : "rgba(6,182,212,0.2)",
                    letterSpacing: "0.15em"
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {formData.aadhaar.length === 12 ? (
                    <span className="text-emerald-400 text-xs font-bold">✓</span>
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-bold">{formData.aadhaar.length}/12</span>
                  )}
                  <span className="text-lg">🇮🇳</span>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">Select Your Role</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role.id} type="button"
                      onClick={() => setFormData({ ...formData, role: role.id, secretCode: "" })}
                      className="py-3 px-4 rounded-xl flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        background: formData.role === role.id ? "rgba(6,182,212,0.1)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${formData.role === role.id ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.06)"}`,
                        transform: formData.role === role.id ? "scale(1.02)" : "scale(1)"
                      }}
                    >
                      <span className="text-lg">{role.icon}</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{role.label}</p>
                        <p className="text-[9px] text-zinc-500">{role.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Officer Secret Key */}
              {isOfficerRole && (
                <div className="animate-slide-up">
                  <input
                    type="password" required
                    onChange={(e) => setFormData({ ...formData, secretCode: e.target.value })}
                    className="input-premium"
                    placeholder="Officer Access Key"
                    style={{ background: "rgba(239,68,68,0.04)", borderColor: "rgba(239,68,68,0.2)" }}
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-500 relative overflow-hidden mt-2"
                style={{
                  background: loading
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                  color: loading ? "#555" : "#000",
                  boxShadow: loading ? "none" : "0 10px 40px rgba(6,182,212,0.3)",
                  transform: loading ? "scale(1)" : "translateY(0)"
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                    Authorizing Ledger...
                  </span>
                ) : "Bind Wallet & Register"}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-zinc-600 text-xs">
                Already registered?{" "}
                <Link to="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                  Login →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;