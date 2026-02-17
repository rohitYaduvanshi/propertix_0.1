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

  const isAdminPage = location.pathname === "/admin";
  const userProfile = currentUser || { name: "User", photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}` };

  const linkClasses = ({ isActive }) => 
    `relative text-[13px] font-bold tracking-widest uppercase transition-all duration-300 ${
      isActive ? "text-cyan-400" : "text-gray-400 hover:text-white"
    } group`;

  const shortAddress = walletAddress ? `${walletAddress.slice(0, 5)}...${walletAddress.slice(-4)}` : "";

  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
      appLogout();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      navigate('/login');
  };

  return (
    <nav className="w-full px-6 lg:px-12 py-5 flex items-center justify-between bg-black/60 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-[100] selection:bg-cyan-500/30">
      
      {/* 🔮 Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

      {/* --- 1. LOGO --- */}
      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="relative">
            <div className="absolute -inset-1 bg-cyan-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <img src={logo} alt="logo" className="h-9 lg:h-11 w-auto object-contain relative" />
        </div>
      </div>

      {/* --- 2. CENTER: NAV LINKS --- */}
      {!isAdminPage ? (
        <div className="hidden lg:flex items-center gap-10">
            {['Home', 'Blockchain', 'Map', 'About'].map((item) => (
                <NavLink key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className={linkClasses}>
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-500 transition-all duration-300 group-hover:w-full" />
                </NavLink>
            ))}
        </div>
      ) : (
        <div className="hidden lg:flex">
            <div className="px-6 py-2 rounded-full border border-red-500/20 bg-red-500/5 backdrop-blur-md">
                <span className="text-red-500 font-black text-[10px] tracking-[0.4em] uppercase animate-pulse">Federal Ledger Authority</span>
            </div>
        </div>
      )}

      {/* --- 3. RIGHT: ACTIONS --- */}
      <div className="hidden lg:flex items-center gap-6">
        
        {isOfficer && !isAdminPage && (
            <button onClick={() => navigate("/admin")} className="px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase text-red-400 tracking-tighter transition-all">
                Console
            </button>
        )}

        {isWalletConnected ? (
          <div className="group relative">
             <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full opacity-30 group-hover:opacity-100 blur-[2px] transition duration-500" />
             <div className="relative flex items-center gap-3 px-4 py-2 rounded-full bg-[#0a0a0a] border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-[11px] text-zinc-300 font-mono tracking-tight">{shortAddress}</span>
             </div>
          </div>
        ) : (
          <button onClick={connectWallet} className="relative group px-6 py-2.5 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 group-hover:scale-105 transition-transform" />
            <span className="relative text-xs font-black uppercase tracking-widest text-white">Initialize Wallet</span>
          </button>
        )}

        {/* User Profile */}
        {isUserLoggedIn && (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:opacity-80 transition-all p-1 rounded-full bg-white/5 border border-white/5">
              <img src={userProfile.photo} alt="P" className="w-9 h-9 rounded-full object-cover ring-2 ring-zinc-800" />
              <div className="pr-2">
                 <p className="text-[12px] font-black text-white leading-none">{userProfile.name.split(' ')[0]}</p>
              </div>
            </button>

            {/* Premium Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-4 w-64 rounded-[24px] bg-black/90 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,1)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Identity Verified</p>
                    <h4 className="text-sm font-black text-white truncate">{userProfile.name}</h4>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { label: 'Profile', icon: '👤', path: '/profile' },
                    { label: 'Dashboard', icon: '🏠', path: '/dashboard' }
                  ].map((item) => (
                    <button key={item.label} onClick={() => { navigate(item.path); setIsProfileOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-[13px] font-medium">
                        <span>{item.icon}</span> {item.label}
                    </button>
                  ))}
                  <div className="h-[1px] bg-white/5 mx-4 my-2" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-red-500/10 text-red-400 transition-all text-[13px] font-black uppercase tracking-widest">
                      🚪 Exit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- 4. MOBILE HAMBURGER --- */}
      <div className="lg:hidden flex items-center gap-4 z-[110]">
        {!isWalletConnected && !isUserLoggedIn && (
            <button onClick={() => navigate("/login")} className="px-5 py-2 rounded-full bg-cyan-500 text-black text-[10px] font-black uppercase">Login</button>
        )}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10">
          <div className="w-5 flex flex-col gap-1.5">
            <span className={`h-0.5 w-full bg-white rounded-full transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`h-0.5 w-full bg-white rounded-full ${isMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-full bg-white rounded-full transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
          </div>
        </button>
      </div>

      {/* --- 5. MOBILE MENU --- */}
      <div className={`fixed inset-0 bg-black/98 backdrop-blur-3xl z-[105] transition-all duration-500 lg:hidden ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
         <div className="flex flex-col h-full px-10 pt-32 space-y-8">
            {['Home', 'Blockchain', 'Map', 'About'].map((item, idx) => (
                <NavLink key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-4xl font-black text-white hover:text-cyan-500 transition-all">
                    <span className="text-cyan-500/30 text-sm font-mono mr-4">0{idx+1}</span> {item}
                </NavLink>
            ))}
            <div className="pt-10 border-t border-white/5">
                {isUserLoggedIn ? (
                    <button onClick={handleLogout} className="text-red-500 text-xl font-black uppercase tracking-widest">Sign Out</button>
                ) : (
                    <button onClick={() => {navigate('/login'); setIsMenuOpen(false);}} className="text-cyan-500 text-xl font-black uppercase tracking-widest">Authorize Access</button>
                )}
            </div>
         </div>
      </div>

    </nav>
  );
};

export default Navbar;