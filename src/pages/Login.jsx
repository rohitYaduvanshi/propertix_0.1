import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isUserLoggedIn, appLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isUserLoggedIn) {
      navigate("/");
    }
  }, [isUserLoggedIn, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // abhi dummy: koi bhi email/password chalega
    appLogin();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="w-full max-w-md bg-black/70 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-900/40">
        <h1 className="text-2xl font-semibold mb-4 text-center text-white">
          Login
        </h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Login to access property management dashboard. Wallet connect will be
          suggested after login.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/40 transition-all"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
