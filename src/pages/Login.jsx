import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, User, HardHat, Scale, Gavel } from "lucide-react"; // Icons for better UI

const Login = () => {
  const { loginWithRole, loading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async (role) => {
    try {
      setIsProcessing(true);
      
      const success = await loginWithRole(role);
      
      if (success) {
        // ✅ ROLE BASED REDIRECTION
        if (role === "GOVT_OFFICER") {
            navigate("/government-portal"); // ✅ Government Officer का अलग पेज
        } else if (role === "ADMIN" || role === "SURVEYOR" || role === "REGISTRAR") {
            navigate("/admin");
        } else {
            navigate("/home");
        }
      } else {
        alert("Login failed! This wallet is not registered as " + role + ". Please check your role or register first.");
      }
    } catch (err) {
      console.error("Login component error:", err);
      alert("Connection Error: Please ensure MetaMask is connected to the Propertix Network.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
      <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-[48px] w-full max-w-md shadow-3xl relative overflow-hidden">
        
        {/* Background Decor */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 text-center mb-10">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ShieldCheck className="text-cyan-500 w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Protocol Login</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mt-2 font-bold">Secure Gateway v3.0</p>
        </div>

        <div className="space-y-3 relative z-10">
            
            {/* 👤 CITIZEN / USER LOGIN */}
            <button 
                onClick={() => handleLogin("USER")}
                disabled={loading || isProcessing}
                className="w-full bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 hover:border-cyan-500/50 p-6 rounded-[28px] flex items-center justify-between transition-all group active:scale-[0.98]"
            >
                <div className="flex flex-col items-start">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Citizen Login</span>
                    <span className="text-[9px] text-zinc-600 font-bold mt-1 uppercase tracking-tight">Access Personal Land Assets</span>
                </div>
                <User className="text-zinc-700 group-hover:text-cyan-500 transition-colors w-5 h-5" />
            </button>

            {/* 🏛️ GOVERNMENT OFFICER (PHASE 1) - Special Highlighted Button */}
            <button 
                onClick={() => handleLogin("GOVT_OFFICER")}
                disabled={loading || isProcessing}
                className="w-full bg-blue-600/5 hover:bg-blue-600/10 border border-blue-500/20 hover:border-blue-500/50 p-6 rounded-[28px] flex items-center justify-between transition-all group active:scale-[0.98]"
            >
                <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-400">Govt. Official</span>
                    <span className="text-[9px] text-blue-900 font-black mt-1 uppercase tracking-tight">Phase 1: Legal Identity Verify</span>
                </div>
                <Gavel className="text-blue-900 group-hover:text-blue-400 transition-colors w-5 h-5" />
            </button>

            {/* 🛠️ SURVEYOR & REGISTRAR (PHASE 2 & 3) */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleLogin("SURVEYOR")}
                    disabled={loading || isProcessing}
                    className="bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 hover:border-amber-500/50 p-5 rounded-[24px] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"
                >
                    <HardHat className="text-zinc-700 group-hover:text-amber-500 w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Surveyor</span>
                </button>

                <button 
                    onClick={() => handleLogin("REGISTRAR")}
                    disabled={loading || isProcessing}
                    className="bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 hover:border-emerald-500/50 p-5 rounded-[24px] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group"
                >
                    <Scale className="text-zinc-700 group-hover:text-emerald-500 w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Registrar</span>
                </button>
            </div>

            {/* 👑 ADMIN ACCESS */}
            <button 
                onClick={() => handleLogin("ADMIN")}
                disabled={loading || isProcessing}
                className="w-full mt-6 text-[9px] text-zinc-800 hover:text-red-500 font-black tracking-[0.5em] uppercase transition-colors py-2"
            >
                • System Root Access •
            </button>
        </div>

        {/* PROCESSING STATUS */}
        {(isProcessing || loading) && (
            <div className="mt-8 space-y-3 text-center animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"></span>
                </div>
                <p className="text-cyan-500 text-[9px] font-black uppercase tracking-[0.3em] italic">
                    Fetching Identity Hash...
                </p>
            </div>
        )}

        {/* FOOTER */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                Protocol not registered? 
                <Link to="/register" className="text-white hover:text-cyan-500 ml-2 transition-colors underline underline-offset-8">
                    Create Identity
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;