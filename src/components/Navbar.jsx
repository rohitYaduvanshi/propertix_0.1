import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/propertix.png";

const Navbar = () => {
  const { walletAddress, isAuthenticated, connectWallet, disconnectWallet } =
    useAuth();
  const navigate = useNavigate();

  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  const linkClasses =
    "text-sm font-medium text-gray-200 hover:text-cyan-400 transition-colors";

  return (
    <nav className="w-full px-8 py-4 flex items-center justify-between bg-black/60 backdrop-blur border-b border-white/5">
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="logo"
          className="h-10 w-auto object-contain"
        />
      </div>

      <div className="hidden md:flex items-center gap-10">
        <NavLink to="/" className={linkClasses}>
          Home
        </NavLink>
        <NavLink to="/blockchain" className={linkClasses}>
          Blockchain
        </NavLink>
        <NavLink to="/about" className={linkClasses}>
          About
        </NavLink>
        <NavLink to="/contact" className={linkClasses}>
          Contact
        </NavLink>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && (
          <span className="hidden md:inline text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-gray-300">
            {shortAddress}
          </span>
        )}

        {isAuthenticated ? (
          <button
            onClick={() => {
              disconnectWallet();
              navigate("/login");
            }}
            className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-100 text-sm font-medium border border-zinc-600 transition-all"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold shadow-lg shadow-cyan-500/40 transition-all"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
