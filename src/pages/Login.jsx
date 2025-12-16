// src/pages/Login.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const { connectWallet, walletAddress, hasMetaMask } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (walletAddress) {
      navigate("/");
    }
  }, [walletAddress, navigate]);

  const handleConnect = async () => {
    await connectWallet();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="w-full max-w-md bg-black/70 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-900/40">
        <h1 className="text-2xl font-semibold mb-4 text-center text-white">
          Connect Wallet
        </h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Login with your Ethereum wallet to manage and verify properties on
          blockchain.
        </p>

        {!hasMetaMask && (
          <p className="text-xs text-red-400 mb-4 text-center">
            MetaMask extension not detected. Install MetaMask and refresh this
            page.
          </p>
        )}

        <button
          onClick={handleConnect}
          disabled={!hasMetaMask}
          className="w-full mt-2 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold shadow-lg shadow-amber-500/40 transition-all"
        >
          {walletAddress ? "Connected" : "Connect MetaMask Wallet"}
        </button>

        {walletAddress && (
          <p className="mt-4 text-xs text-center text-emerald-400 break-all">
            Connected as: {walletAddress}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
