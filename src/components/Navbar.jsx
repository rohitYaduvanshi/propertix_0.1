import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/propertix.png";
import { useState } from "react";

const Navbar = () => {
  const {
    isUserLoggedIn,
    appLogout,
    walletAddress,
    isWalletConnected,
    connectWallet,
    disconnectWallet,
  } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const linkClasses =
    "text-sm font-medium text-gray-200 hover:text-cyan-400 transition-colors";

  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  return (
    <nav className="w-full px-8 py-4 flex items-center justify-between bg-black/60 backdrop-blur border-b border-white/5">
      <div className="flex items-center gap-3">
        <img src={logo} alt="logo" className="h-10 w-auto object-contain" />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden text-white focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-10">
        <NavLink to="/" className={linkClasses}>
          Home
        </NavLink>
        <NavLink to="/blockchain" className={linkClasses}>
          Blockchain
        </NavLink>
        <NavLink to="/about" className={linkClasses}>
          some
        </NavLink>
        <NavLink to="/about" className={linkClasses}>
          About
        </NavLink>
        <NavLink to="/contact" className={linkClasses}>
          Contact
        </NavLink>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${
          isMenuOpen ? "block" : "hidden"
        } md:hidden absolute top-full left-0 right-0 bg-black/80 backdrop-blur border-b border-white/5 flex flex-col items-center gap-4 py-4`}
      >
        <NavLink
          to="/"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          Home
        </NavLink>
        <NavLink
          to="/blockchain"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          Blockchain
        </NavLink>
        <NavLink
          to="/about"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          About
        </NavLink>
        <NavLink
          to="/contact"
          className={linkClasses}
          onClick={() => setIsMenuOpen(false)}
        >
          Contact
        </NavLink>
      </div>

      {/* User Actions */}
      {isUserLoggedIn ? (
        <div className="flex items-center gap-3">
          {isWalletConnected && (
            <span className="hidden md:inline text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-gray-300">
              {shortAddress}
            </span>
          )}

          {!isWalletConnected && (
            <button
              onClick={connectWallet}
              className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold shadow-lg shadow-amber-500/40 transition-all"
            >
              Connect Wallet
            </button>
          )}

          {isWalletConnected && (
            <button
              onClick={disconnectWallet}
              className="px-3 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-100 text-xs font-medium border border-zinc-600 transition-all"
            >
              Disconnect Wallet
            </button>
          )}

          <button
            onClick={() => {
              appLogout();
              navigate("/login");
            }}
            className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-gray-100 text-sm font-medium border border-zinc-700 transition-all"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-semibold shadow-lg shadow-cyan-500/40 transition-all"
        >
          Login
        </button>
      )}
    </nav>
  );
};

export default Navbar;
