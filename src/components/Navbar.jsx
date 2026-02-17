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

  // 🛑 Check: Are we on Admin Page?
  const isAdminPage = location.pathname === "/admin";

  // --- DUMMY USER DATA ---
  const userProfile = currentUser || {
    name: "User",
    email: "user@example.com",
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  };

  const linkClasses = "text-sm font-medium text-gray-200 hover:text-cyan-400 transition-colors";
  const mobileLinkClasses = "block text-base font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/5 px-4 py-3 rounded-xl transition-all";

  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  // Dropdown close logic for Desktop Profile
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // SWITCH WALLET LOGIC
  const handleSwitchWallet = async () => {
    appLogout();
    setIsMenuOpen(false); // Close mobile menu if open
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

  return (
    <nav className="w-full px-6 lg:px-8 py-4 flex items-center justify-between bg-black/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-[100]">

      {/* --- 1. LEFT SECTION: LOGO --- */}
      <div className="flex items-center gap-3 z-50">
        <img src={logo} alt="logo" className="h-8 lg:h-10 w-auto object-contain cursor-pointer" onClick={() => navigate('/')} />
      </div>

      {/* --- 2. CENTER SECTION: DESKTOP LINKS --- */}
      {!isAdminPage ? (
        <div className="hidden lg:flex items-center gap-8">
            <NavLink to="/" className={linkClasses}>Home</NavLink>
            <NavLink to="/blockchain" className={linkClasses}>Blockchain</NavLink>
            <NavLink to="/map" className={linkClasses}>Property-Map</NavLink>
            <NavLink to="/about" className={linkClasses}>About</NavLink>
            <NavLink to="/contact" className={linkClasses}>Contact</NavLink>
        </div>
      ) : (
        <div className="hidden lg:flex items-center justify-center">
            <span className="text-red-500 font-bold tracking-[0.2em] border border-red-500/30 px-6 py-2 rounded bg-red-500/5 animate-pulse">
                GOVERNMENT ADMINISTRATION
            </span>
        </div>
      )}

      {/* --- 3. RIGHT SECTION: DESKTOP WALLET & PROFILE --- */}
      <div className="hidden lg:flex items-center gap-4">

        {/* Admin Panel Button */}
        {isOfficer && !isAdminPage && (
            <NavLink 
                to="/admin" 
                className="text-red-400 font-bold border border-red-500/50 px-4 py-1.5 rounded-full hover:bg-red-500/10 transition-all text-xs uppercase tracking-wider shadow-lg shadow-red-900/20"
            >
                👮‍♂️ Admin Panel
            </NavLink>
        )}

        {/* Wallet Badge & Switcher */}
        {isWalletConnected ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 transition-colors">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-gray-300 font-mono">{shortAddress}</span>
            <button 
                onClick={handleSwitchWallet} 
                title="Switch Wallet Account"
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-all"
            >
                🔁
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-5 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-all shadow-lg shadow-cyan-500/20"
          >
            Connect Wallet
          </button>
        )}

        {/* Profile Dropdown */}
        {isUserLoggedIn && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 focus:outline-none group"
            >
              <img
                src={userProfile.photo}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-zinc-700 group-hover:border-cyan-500 transition-all object-cover"
              />
              <div className="text-left">
                <p className="text-[10px] text-gray-400 leading-none">Welcome,</p>
                <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition leading-tight">{userProfile.name.split(' ')[0]}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Desktop Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-72 origin-top-right rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="p-5 bg-gradient-to-br from-zinc-800/50 to-transparent border-b border-white/5">
                  <div className="flex items-start gap-3">
                    <img src={userProfile.photo} alt="User" className="w-12 h-12 rounded-full border-2 border-white/10 object-cover" />
                    <div>
                      <h4 className="text-white font-bold text-base truncate">{userProfile.name}</h4>
                      <p className="text-xs text-cyan-400 font-mono truncate">{userProfile.email}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {!isAdminPage && (
                      <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-gray-200 text-sm font-medium">
                        👤 My Profile
                      </button>
                  )}
                  {!isAdminPage && (
                      <button onClick={() => { navigate('/dashboard'); setIsProfileOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 text-gray-200 text-sm font-medium">
                        🏠 Owner Dashboard
                      </button>
                  )}
                </div>
                <div className="p-2 border-t border-white/5 mt-1">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-red-400 text-sm font-bold">
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- 4. MOBILE HAMBURGER BUTTON --- */}
      <div className="flex lg:hidden items-center gap-4 z-50">
        {!isWalletConnected && !isUserLoggedIn && (
            <button onClick={() => navigate("/login")} className="px-4 py-1.5 rounded-full bg-sky-500/75 text-white text-xs font-bold">
                Login
            </button>
        )}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-1 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* --- 5. MOBILE FULL-SCREEN MENU (Slide down animation) --- */}
      <div className={`absolute top-[100%] left-0 w-full bg-black/95 backdrop-blur-3xl border-b border-white/10 overflow-hidden transition-all duration-300 ease-in-out lg:hidden ${
          isMenuOpen ? "max-h-screen border-b border-white/10 shadow-2xl" : "max-h-0 border-transparent opacity-0"
      }`}>
        <div className="px-6 py-8 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto">
            
            {/* Mobile Profile Card */}
            {isUserLoggedIn && (
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-2">
                    <img src={userProfile.photo} alt="User" className="w-14 h-14 rounded-full border-2 border-cyan-500/50 object-cover" />
                    <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Logged In As</p>
                        <h4 className="text-white font-bold text-lg">{userProfile.name}</h4>
                        {isWalletConnected ? (
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs text-green-400 font-mono">{shortAddress}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-amber-500">Wallet Disconnected</span>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile Admin Warning */}
            {isAdminPage && (
                <div className="text-center py-2 mb-2">
                    <span className="text-red-500 font-bold text-xs tracking-[0.2em] border border-red-500/30 px-4 py-2 rounded-lg bg-red-500/5">
                        ADMINISTRATION MODE
                    </span>
                </div>
            )}

            {/* Mobile Nav Links */}
            {!isAdminPage && (
                <div className="flex flex-col space-y-2">
                    <NavLink to="/" className={mobileLinkClasses} onClick={() => setIsMenuOpen(false)}>Home</NavLink>
                    <NavLink to="/blockchain" className={mobileLinkClasses} onClick={() => setIsMenuOpen(false)}>Blockchain</NavLink>
                    <NavLink to="/map" className={mobileLinkClasses} onClick={() => setIsMenuOpen(false)}>Property-Map</NavLink>
                    <NavLink to="/about" className={mobileLinkClasses} onClick={() => setIsMenuOpen(false)}>About</NavLink>
                    <NavLink to="/contact" className={mobileLinkClasses} onClick={() => setIsMenuOpen(false)}>Contact</NavLink>
                </div>
            )}

            <div className="h-[1px] bg-white/5 my-2"></div>

            {/* Mobile Dashboard & Actions */}
            {isOfficer && !isAdminPage && (
                <NavLink to="/admin" className="text-red-400 font-bold uppercase tracking-wider text-sm px-4 py-3 hover:bg-red-500/10 rounded-xl transition-all" onClick={() => setIsMenuOpen(false)}>
                    👮‍♂️ Open Admin Panel
                </NavLink>
            )}
            
            {isUserLoggedIn ? (
                <div className="flex flex-col space-y-2">
                    {!isAdminPage && <NavLink to="/profile" className={mobileLinkClasses} onClick={() => setIsMenuOpen(false)}>👤 My Profile</NavLink>}
                    {!isAdminPage && <NavLink to="/dashboard" className={mobileLinkClasses} onClick={() => setIsMenuOpen(false)}>🏠 Owner Dashboard</NavLink>}
                    
                    <button onClick={handleSwitchWallet} className="text-left text-gray-300 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 text-base font-medium transition-all">
                        🔁 Switch Wallet
                    </button>
                    
                    <button onClick={handleLogout} className="text-left text-red-400 hover:text-red-300 font-bold text-base px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all mt-2">
                        🚪 Sign Out
                    </button>
                </div>
            ) : (
                <button onClick={() => { navigate("/login"); setIsMenuOpen(false); }} className="w-full py-4 mt-2 rounded-xl bg-sky-500/75 text-white font-bold shadow-lg">
                    Login / Connect Wallet
                </button>
            )}
        </div>
      </div>

    </nav>
  );
};

export default Navbar;