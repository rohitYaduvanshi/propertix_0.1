import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const { loginWithRole, loading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async (role) => {
    setIsProcessing(true);
    const success = await loginWithRole(role);
    if (success) {
      // Role ke hisaab se redirect
      if (role === "ADMIN" || role === "SURVEYOR" || role === "REGISTRAR") {
          navigate("/admin");
      } else {
          navigate("/home");
      }
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h1>
        <p className="text-gray-500 text-xs text-center mb-8">Select your role to login securely</p>

        <div className="space-y-3">
            {/* USER LOGIN */}
            <button 
                onClick={() => handleLogin("USER")}
                disabled={loading || isProcessing}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold py-4 rounded-xl flex items-center justify-between px-6 transition-all group"
            >
                <div className="flex flex-col items-start">
                    <span className="text-sm text-gray-400 group-hover:text-white">Citizen Login</span>
                    <span className="text-xs text-gray-600">For Property Owners & Buyers</span>
                </div>
                <span className="text-2xl">👤</span>
            </button>

            {/* OFFICERS LOGIN */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleLogin("SURVEYOR")}
                    disabled={loading || isProcessing}
                    className="bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/50 text-yellow-500 font-bold py-4 rounded-xl transition-all"
                >
                    🚧 Surveyor
                </button>

                <button 
                    onClick={() => handleLogin("REGISTRAR")}
                    disabled={loading || isProcessing}
                    className="bg-green-900/20 hover:bg-green-900/40 border border-green-700/50 text-green-500 font-bold py-4 rounded-xl transition-all"
                >
                    ⚖️ Registrar
                </button>
            </div>

            {/* ADMIN LOGIN (Hidden-ish) */}
            <button 
                onClick={() => handleLogin("ADMIN")}
                disabled={loading || isProcessing}
                className="w-full mt-4 text-xs text-red-900 hover:text-red-500 font-mono tracking-widest uppercase transition-colors"
            >
                • Government Admin Access •
            </button>
        </div>

        {isProcessing && (
            <p className="text-center text-cyan-500 text-xs mt-4 animate-pulse">Connecting to Wallet...</p>
        )}

        <p className="text-center text-gray-500 text-xs mt-8">
          New to Propertix? <Link to="/register" className="text-cyan-400 font-bold hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;