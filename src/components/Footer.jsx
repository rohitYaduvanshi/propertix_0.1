import { Link } from "react-router-dom";
import logo from "../assets/propertix.png";
import { FaGithub, FaTwitter, FaDiscord } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="relative bg-black pt-20 pb-10 overflow-hidden">
      {/* 1. Background Decor (Modern Accents) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        {/* Main Glass Card */}
        <div className="rounded-[40px] bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-8 md:p-12 shadow-2xl">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">

            {/* --- BRAND COLUMN (4 Cols) --- */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                  <img src={logo} alt="Propertix" className="h-8 w-auto brightness-110" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white font-trench">
                    Dream..!
                  </h2>
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em]">
                    The Dad of Trust
                  </p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-sm">
                Next-generation blockchain layer for land records. Turning legacy
                paperwork into immutable digital assets.
              </p>

              {/* Status Indicator */}
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                  Mainnet Beta v1.0
                </span>
              </div>
            </div>

            {/* --- NAVIGATION LINKS (4 Cols) --- */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-[0.2em] opacity-50">Protocol</h3>
                <ul className="space-y-3">
                  <FooterLink to="/">Ecosystem</FooterLink>
                  <FooterLink to="/registerAsset">Asset Mint</FooterLink>
                  <FooterLink to="/blockchain">Ledger</FooterLink>
                  <FooterLink to="/about">Whitepaper</FooterLink>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-[0.2em] opacity-50">Support</h3>
                <ul className="space-y-3">
                  <FooterLink to="/contact">Help Desk</FooterLink>
                  <FooterLink to="/docs">API Docs</FooterLink>
                  <FooterLink to="/terms">Legal</FooterLink>
                  <FooterLink to="/privacy">Privacy</FooterLink>
                </ul>
              </div>
            </div>

            {/* SOCIAL COLUMN - Icons Added Here ✅ */}
            <div className="lg:col-span-3 space-y-8">
              <div className="space-y-4">
                <h3 className="text-white font-bold text-xs uppercase tracking-[0.2em] opacity-50 md:text-right">Join Community</h3>
                <div className="flex lg:justify-end gap-3">
                  {/* अब हम सीधे Icon Component पास कर रहे हैं */}
                  <SocialIcon label="Github" icon={<FaGithub />} href="https://github.com/rohitYaduvanshi/propertix_0.1" />
                  <SocialIcon label="Twitter" icon={<FaTwitter />} href="https://twitter.com/..." />
                  <SocialIcon label="Discord" icon={<FaDiscord />} href="https://discord.gg/..." />
                </div>
              </div>

              <div className="lg:text-right">
                <p className="text-[11px] text-zinc-500 font-bold">
                  &copy; {new Date().getFullYear()} PROPERTIX LABS.<br />
                  SECURED BY SMART CONTRACTS.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Banner */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              <span>Security Audited</span>
              <span>Open Source</span>
              <span>Decentralized</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">
              Network ID: 0x8545_LOCALHOST_DEV
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="text-zinc-400 hover:text-cyan-400 text-sm transition-all duration-300 flex items-center group"
    >
      <span className="w-0 group-hover:w-2 h-[1px] bg-cyan-400 mr-0 group-hover:mr-2 transition-all"></span>
      {children}
    </Link>
  </li>
);

// 2. Updated SocialIcon to accept Icon Components 
const SocialIcon = ({ label, icon, href }) => (
  <a 
    href={href}
    target="_blank" 
    rel="noopener noreferrer"
    className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl text-zinc-400 hover:bg-cyan-500 hover:text-black hover:-translate-y-1 transition-all duration-500 group relative no-underline shadow-lg"
  >
    {icon}
    
    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-white text-black text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap shadow-xl">
      {label}
    </div>
  </a>
);

export default Footer;