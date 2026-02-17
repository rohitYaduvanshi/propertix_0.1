import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/propertix.png";
import { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const {
    isUserLoggedIn,
    appLogout,
    walletAddress,
    isWalletConnected,
    connectWallet,
    currentUser,
    isOfficer
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isAdminPage = location.pathname === "/admin";
  const dropdownRef = useRef(null);

  // --- LOGIC: Sticky Effect ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- LOGIC: Dropdown Click Outside ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const userProfile = currentUser || {
    name: "User",
    email: "user@example.com",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  };

  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  // --- LOGIC: Switch Wallet ---
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
      console.log("User cancelled switch");
      navigate("/login");
    }
  };

  const handleLogout = () => {
    appLogout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    navigate('/login');
  };

  const linkClasses = ({ isActive }) => 
    `relative text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
      isActive ? "text-cyan-400" : "text-gray-400 hover:text-white"
    }`;

  const mobileLinkClasses = "block text-2xl font-black uppercase tracking-tighter text-gray-300 hover:text-cyan-400 transition-all";

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
        scrolled ? "py-3 bg-black/60 backdrop-blur-2xl border-b border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.8)]" : "py-6 bg-transparent"
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          
          {/* --- 1. LOGO --- */}
          <div className="relative group cursor-pointer z-[110]" onClick={() => navigate('/')}>
            <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <img src={logo} alt="logo" className="relative h-9 lg:h-11 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
          </div>

          {/* --- 2. DESKTOP NAVIGATION --- */}
          <div className="hidden lg:flex items-center bg-white/[0.03] border border-white/10 px-10 py-3 rounded-full backdrop-blur-md shadow-inner">
            {!isAdminPage ? (
              <div className="flex items-center gap-10">
                {['Home', 'Blockchain', 'Map', 'About', 'Contact'].map((item) => (
                  <NavLink key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className={linkClasses}>
                    {({ isActive }) => (
                      <>
                        {item}
                        {isActive && <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-cyan-500 shadow-[0_0_12px_#06b6d4] rounded-full"></span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 px-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-red-500 font-black text-[11px] tracking-[0.4em] uppercase">Security Protocol: Active</span>
              </div>
            )}
          </div>

          {/* --- 3. RIGHT SECTION: WALLET & PROFILE --- */}
          <div className="hidden lg:flex items-center gap-6">
            {isOfficer && !isAdminPage && (
              <NavLink to="/admin" className="relative group px-6 py-2 rounded-full border border-red-500/50 overflow-hidden">
                <span className="absolute inset-0 bg-red-500/10 group-hover:bg-red-500/20 transition-all"></span>
                <span className="relative text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   TERMINAL
                </span>
              </NavLink>
            )}

            {isWalletConnected ? (
              <div className="flex items-center gap-3 bg-zinc-900/80 border border-white/10 p-1 pr-4 rounded-full group hover:border-cyan-500/50 transition-all">
                <button onClick={handleSwitchWallet} className="bg-gradient-to-r from-cyan-600 to-blue-600 p-2 rounded-full shadow-lg shadow-cyan-500/20 hover:rotate-180 transition-transform duration-500">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <span className="text-[11px] font-mono text-gray-400 tracking-wider group-hover:text-white transition-colors">{shortAddress}</span>
              </div>
            ) : (
              <button onClick={connectWallet} className="px-8 py-3 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all duration-500">
                Init Wallet
              </button>
            )}

            {isUserLoggedIn && (
              <div className="relative" ref={dropdownRef}>
                <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="relative group cursor-pointer">
                  <div className={`absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500 ${isProfileOpen ? 'opacity-100' : ''}`}></div>
                  <img src={userProfile.photo} alt="User" className="relative w-11 h-11 rounded-full border border-white/20 object-cover" />
                </div>

                {/* PREMIUM DROPDOWN */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-6 w-72 origin-top-right rounded-3xl bg-black/90 backdrop-blur-3xl border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1">Authenticated</p>
                      <h4 className="text-white font-black text-lg truncate leading-tight">{userProfile.name}</h4>
                      <p className="text-xs text-gray-500 truncate font-mono">{userProfile.email}</p>
                    </div>
                    <div className="p-2 space-y-1">
                      <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-gray-300 text-xs font-black uppercase tracking-widest transition-all">
                         Profile
                      </button>
                      <button onClick={() => { navigate('/dashboard'); setIsProfileOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-white/5 text-gray-300 text-xs font-black uppercase tracking-widest transition-all">
                         Dashboard
                      </button>
                    </div>
                    <div className="p-2 border-t border-white/5 bg-black/40">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest transition-all">
                         Terminate Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- MOBILE HAMBURGER --- */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden relative z-[110] w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-white/5 rounded-full border border-white/10">
            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`}></span>
            <span className={`w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </div>
      </nav>

      {/* --- MOBILE MENU OVERLAY --- */}
      <div className={`fixed inset-0 z-[90] bg-black transition-all duration-700 lg:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-10"}`}>
        <div className="flex flex-col items-center justify-center h-full space-y-10 px-10 text-center">
           {isUserLoggedIn && (
             <div className="mb-4">
               <img src={userProfile.photo} alt="User" className="w-20 h-20 rounded-full border-2 border-cyan-500 mx-auto mb-4" />
               <h2 className="text-white text-2xl font-black uppercase tracking-tighter">{userProfile.name}</h2>
             </div>
           )}
           
           {['Home', 'Blockchain', 'Map', 'About', 'Contact'].map((item, idx) => (
             <NavLink 
               key={item} 
               to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} 
               onClick={() => setIsMenuOpen(false)}
               className={mobileLinkClasses}
               style={{ transitionDelay: `${idx * 50}ms` }}
             >
               {item}
             </NavLink>
           ))}

           <div className="w-full h-px bg-white/10 my-4"></div>

           {isUserLoggedIn ? (
             <button onClick={handleLogout} className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">Terminate Session</button>
           ) : (
             <button onClick={() => { navigate("/login"); setIsMenuOpen(false); }} className="px-10 py-4 rounded-full bg-cyan-600 text-white font-black text-xs uppercase tracking-widest">Connect Identity</button>
           )}
        </div>
      </div>
    </>
  );
};

export default Navbar;