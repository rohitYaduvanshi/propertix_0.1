import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/propertix.png";
import { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const {
    isUserLoggedIn, appLogout, walletAddress,
    isWalletConnected, connectWallet, currentUser, isOfficer
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const isAdminPage = location.pathname === "/admin";

  const userProfile = currentUser || {
    name: "User",
    email: "user@propertix.io",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  };

  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  // Scroll listener for navbar bg change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside dropdown close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchWallet = async () => {
    appLogout();
    setIsMenuOpen(false);
    try {
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      navigate("/login");
    } catch (e) {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    appLogout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/registerAsset", label: "Register Asset" },
    { to: "/map", label: "Property Map" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between transition-all duration-500 rounded-full border ${
        scrolled 
          ? "top-3 w-[94%] max-w-6xl px-6 py-2.5 bg-black/80 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]" 
          : "top-5 w-[90%] max-w-6xl px-8 py-3.5 bg-black/45 border-white/5 shadow-none"
      }`}
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        backdropFilter: "blur(20px)",
      }}>

      {/* ---- LOGO ---- */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => navigate("/")}
      >
        <div
          className="relative transition-all duration-300"
          style={{
            filter: "drop-shadow(0 0 8px rgba(6,182,212,0.25))",
          }}
        >
          <img src={logo} alt="Propertix" className="h-6.5 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
        </div>
      </div>

      {/* ---- CENTER LINKS (Desktop) ---- */}
      {!isAdminPage ? (
        <div className="hidden lg:flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-full">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative px-4 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "text-zinc-400 border border-transparent hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      ) : (
        <div className="hidden lg:flex items-center">
          <div
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/5 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 font-medium tracking-[0.2em] text-[9px] uppercase">Government Administration</span>
          </div>
        </div>
      )}

      {/* ---- RIGHT SECTION (Desktop) ---- */}
      <div className="hidden lg:flex items-center gap-4">

        {/* Admin Panel badge */}
        {isOfficer && !isAdminPage && (
          <NavLink
            to="/admin"
            className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-widest transition-all duration-300 px-3.5 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
          >
            <span>👮</span> Admin Panel
          </NavLink>
        )}

        {/* Wallet Badge */}
        {isWalletConnected ? (
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all duration-300 border border-zinc-800 bg-zinc-900/20 hover:border-cyan-500/30"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium text-zinc-300 font-mono tracking-wider">
              {shortAddress}
            </span>
            <button
              onClick={handleSwitchWallet}
              title="Switch Wallet"
              className="ml-1 text-zinc-500 hover:text-cyan-400 transition-colors text-[10px]"
            >
              ⇄
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {/* Login button */}
            <button
              onClick={() => navigate("/login")}
              className="px-4.5 py-2 rounded-full text-[10px] font-medium tracking-wider uppercase transition-all duration-300 text-zinc-400 hover:text-white"
            >
              Login
            </button>
            {/* Sign Up button */}
            <button
              onClick={() => navigate("/register")}
              className="px-5 py-2 rounded-full text-white text-[10px] font-medium tracking-wider uppercase transition-all duration-300 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] active:scale-[0.98]"
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Profile Dropdown */}
        {isUserLoggedIn && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="relative">
                <img
                  src={userProfile.photo}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover transition-all duration-300 border border-white/10"
                  style={{
                    boxShadow: isProfileOpen ? "0 0 0 2px rgba(6,182,212,0.4)" : "none"
                  }}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-zinc-950" />
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-none">Welcome,</p>
                <p className="text-xs font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors mt-0.5 leading-none">
                  {userProfile.name.split(" ")[0]}
                </p>
              </div>
              <svg
                className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div
                className="absolute right-0 mt-3 w-64 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
                style={{
                  background: "rgba(9,9,11,0.95)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(20px)"
                }}>
                {/* Profile Header */}
                <div className="p-4 bg-white/[0.02] border-b border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <img src={userProfile.photo} alt="User" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-zinc-200 text-xs font-semibold truncate leading-snug">{userProfile.name}</h4>
                      <p className="text-[10px] text-cyan-500 font-medium truncate mt-0.5 font-mono" style={{ tracking: "0.05em" }}>
                        {shortAddress}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-1.5 space-y-0.5">
                  {!isAdminPage && (
                    <>
                      <DropdownItem icon="👤" label="My Profile" onClick={() => { navigate("/profile"); setIsProfileOpen(false); }} />
                      <DropdownItem icon="🏠" label="Owner Dashboard" onClick={() => { navigate("/dashboard"); setIsProfileOpen(false); }} />
                    </>
                  )}
                  <DropdownItem icon="🔁" label="Switch Wallet" onClick={handleSwitchWallet} />
                </div>

                <div className="p-1.5 border-t border-white/[0.05]">
                  <DropdownItem icon="🚪" label="Sign Out" onClick={handleLogout} danger />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---- MOBILE HAMBURGER ---- */}
      <div className="flex lg:hidden items-center gap-3 z-50">
        {!isUserLoggedIn && (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 rounded-full text-black text-[10px] font-medium uppercase tracking-widest bg-gradient-to-r from-cyan-400 to-indigo-500">
            Login
          </button>
        )}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-8.5 h-8.5 flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: isMenuOpen ? "rgba(6,182,212,0.1)" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
          <svg className="w-4 h-4 text-white transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* ---- MOBILE MENU ---- */}
      <div
        className="absolute top-[115%] left-0 w-full lg:hidden overflow-hidden transition-all duration-400 rounded-3xl border border-white/10"
        style={{
          maxHeight: isMenuOpen ? "100vh" : "0",
          opacity: isMenuOpen ? 1 : 0,
          background: "rgba(5,5,5,0.97)",
          backdropFilter: "blur(30px)",
        }}>
        <div className="px-6 py-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Mobile Profile */}
          {isUserLoggedIn && (
            <div className="flex items-center gap-4 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="relative">
                <img src={userProfile.photo} alt="User" className="w-12 h-12 rounded-full object-cover border-2"
                  style={{ borderColor: "rgba(6,182,212,0.3)" }} />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#050505]" />
              </div>
              <div>
                <p className="text-white font-bold">{userProfile.name}</p>
                {isWalletConnected && (
                  <p className="text-xs text-cyan-400 mt-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>{shortAddress}</p>
                )}
              </div>
            </div>
          )}

          {/* Mobile Links */}
          {!isAdminPage && (
            <div className="space-y-1">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest transition-all ${
                      isActive ? "text-cyan-400 bg-cyan-500/8" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`
                  }>
                  {label}
                </NavLink>
              ))}
            </div>
          )}

          <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

          {/* Mobile Actions */}
          {isOfficer && !isAdminPage && (
            <NavLink to="/admin" onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-400 text-xs font-medium tracking-widest uppercase hover:bg-red-500/10 transition-all">
              👮 Admin Panel
            </NavLink>
          )}

          {isUserLoggedIn ? (
            <div className="space-y-1">
              {!isAdminPage && (
                <>
                  <MobileAction icon="👤" label="My Profile" onClick={() => { navigate("/profile"); setIsMenuOpen(false); }} />
                  <MobileAction icon="🏠" label="Owner Dashboard" onClick={() => { navigate("/dashboard"); setIsMenuOpen(false); }} />
                </>
              )}
              <MobileAction icon="🔁" label="Switch Wallet" onClick={handleSwitchWallet} />
              <MobileAction icon="🚪" label="Sign Out" onClick={handleLogout} danger />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { navigate("/login"); setIsMenuOpen(false); }}
                className="w-full py-3 rounded-full font-medium tracking-wider uppercase text-xs"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(6,182,212,0.4)",
                  color: "#06b6d4"
                }}>
                Login
              </button>
              <button
                onClick={() => { navigate("/register"); setIsMenuOpen(false); }}
                className="w-full py-3 rounded-full text-white font-medium tracking-wider uppercase text-xs"
                style={{ background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)", boxShadow: "0 4px 15px rgba(6,182,212,0.3)" }}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const DropdownItem = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
      danger 
        ? "text-red-400 hover:bg-red-500/10 hover:text-red-300" 
        : "text-zinc-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    <span className="text-sm">{icon}</span>
    {label}
  </button>
);

const MobileAction = ({ icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium uppercase tracking-widest transition-all ${
      danger
        ? "text-red-400 hover:bg-red-500/10"
        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
    }`}
  >
    <span className="text-sm">{icon}</span>
    {label}
  </button>
);

export default Navbar;