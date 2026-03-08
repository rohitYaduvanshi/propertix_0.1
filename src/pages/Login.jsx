import { useState } from "react";
import { useSmartAccount } from "../context/SmartAccountContext"; // ✅ Updated to use SmartAccountContext
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const { loginWithSocial, smartAccountAddress, loading, isLocalhost } = useSmartAccount(); // ✅ Discussed Context
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async (role) => {
    try {
      setIsProcessing(true);
      
      // 1. Authenticate with Particle/Google (or Mock on Localhost) [cite: 2026-03-01]
      let currentAddress = smartAccountAddress;
      if (!currentAddress) {
        currentAddress = await loginWithSocial();
      }

      // 2. Verify Role from Backend (Neon DB Sync) [cite: 2026-02-21]
      // Hum backend se check karenge ki ye wallet address is 'role' ke liye registered hai ya nahi
      const response = await axios.get(`https://propertixbackend-production.up.railway.app/api/auth/profile/${currentAddress}`);
      const userData = response.data;

      if (userData && userData.role === role) {
        // 3. ROLE BASED REDIRECTION FIX:
        if (role === "GOVT_OFFICER") {
            navigate("/government-portal");
        } else if (role === "ADMIN" || role === "SURVEYOR" || role === "REGISTRAR") {
            navigate("/admin");
        } else {
            navigate("/home");
        }
      } else {
        alert(`Access Denied! Your identity is not verified as ${role} in the Propertix Ledger.`);
      }
    } catch (err) {
      console.error("Login component error:", err);
      alert("Verification Failed. Please ensure your Identity is bonded on the Register page.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* DESIGN REMAINS SAME AS PER YOUR REQUEST */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full"></div>
        
        <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">Welcome Back</h1>
        <p className="text-gray-500 text-xs text-center mb-10 uppercase tracking-widest font-medium italic">Secure Identity Portal</p>

        <div className="space-y-4 relative z-10">
            {/* CITIZEN LOGIN */}
            <button 
                onClick={() => handleLogin("USER")}
                disabled={loading || isProcessing}
                className="w-full bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-cyan-500/30 text-white font-bold py-5 rounded-2xl flex items-center justify-between px-6 transition-all group active:scale-[0.98]"
            >
                <div className="flex flex-col items-start text-left">
                    <span className="text-sm text-gray-300 group-hover:text-cyan-400 transition-colors">Citizen Login</span>
                    <span className="text-[10px] text-gray-600 font-normal mt-0.5 uppercase">Social Auth & Property Sync</span>
                </div>
                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">👤</span>
            </button>

            {/* GOVT OFFICER LOGIN */}
            <button 
                onClick={() => handleLogin("GOVT_OFFICER")}
                disabled={loading || isProcessing}
                className="w-full bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-cyan-500/30 text-white font-bold py-5 rounded-2xl flex items-center justify-between px-6 transition-all group active:scale-[0.98]"
            >
                <div className="flex flex-col items-start text-left">
                    <span className="text-sm text-gray-300 group-hover:text-cyan-400 transition-colors">Govt. Officer Login</span>
                    <span className="text-[10px] text-gray-600 font-normal mt-0.5 uppercase">Node Management Access</span>
                </div>
                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">🏛️</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleLogin("SURVEYOR")}
                    disabled={loading || isProcessing}
                    className="bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/10 hover:border-yellow-500/30 text-yellow-500 font-black py-4 rounded-2xl transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
                >
                    🚧 Surveyor
                </button>

                <button 
                    onClick={() => handleLogin("REGISTRAR")}
                    disabled={loading || isProcessing}
                    className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-500 font-black py-4 rounded-2xl transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
                >
                    ⚖️ Registrar
                </button>
            </div>

            <button 
                onClick={() => handleLogin("ADMIN")}
                disabled={loading || isProcessing}
                className="w-full mt-4 text-[10px] text-zinc-700 hover:text-red-500 font-black tracking-[0.3em] uppercase transition-colors py-2"
            >
                • Protocol Admin Override •
            </button>
        </div>

        {/* PROCESSING STATUS */}
        {(isProcessing || loading) && (
            <div className="mt-8 space-y-2 text-center">
                <div className="flex justify-center gap-1">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
                <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    {isLocalhost ? "MOCKING_AUTH_FOR_PROTOTYPE..." : "SYNCING_SOCIAL_LEDGER..."}
                </p>
            </div>
        )}

        <p className="text-center text-gray-600 text-[11px] mt-10 font-medium uppercase tracking-tight">
          Unregistered node? <Link to="/register" className="text-cyan-500 font-black hover:text-cyan-400 underline underline-offset-4 ml-1">Establish Connection</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;