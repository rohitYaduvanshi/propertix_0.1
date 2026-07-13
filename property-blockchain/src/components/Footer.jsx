import { Link } from "react-router-dom";
import logo from "../assets/propertix.png";
import { FaGithub, FaTwitter, FaDiscord } from "react-icons/fa";

const Footer = () => {
  return (
    <footer
      className="relative overflow-hidden pt-20 pb-8"
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        background: "linear-gradient(180deg, #050505 0%, #020202 100%)"
      }}>

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.05), transparent 70%)" }} />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.04), transparent 70%)" }} />

      {/* Top border glow line */}
      <div className="absolute top-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.3), rgba(59,130,246,0.3), transparent)" }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Main Footer Card */}
        <div className="rounded-[32px] overflow-hidden mb-10"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)"
          }}>
          <div className="p-10 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Brand Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.1))",
                    border: "1px solid rgba(6,182,212,0.2)",
                    boxShadow: "0 0 20px rgba(6,182,212,0.1)"
                  }}>
                  <img src={logo} alt="Propertix" className="h-8 w-auto" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                    PROPERTIX
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em]"
                    style={{ color: "#06b6d4" }}>
                    Land Registry on Blockchain
                  </p>
                </div>
              </div>

              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm">
                Next-generation blockchain layer for land records. Turning legacy paperwork
                into immutable, tamper-proof digital assets secured by Ethereum smart contracts.
              </p>

              {/* Status chip */}
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Mainnet Beta v1.0 • Live</span>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <SocialIcon label="Github" icon={<FaGithub />} href="https://github.com/rohitYaduvanshi/propertix_0.1" />
                <SocialIcon label="Twitter" icon={<FaTwitter />} href="https://twitter.com/" />
                <SocialIcon label="Discord" icon={<FaDiscord />} href="https://discord.gg/" />
              </div>
            </div>

            {/* Links Grid */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-10">
              <div className="space-y-5">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] opacity-40">Protocol</h3>
                <ul className="space-y-3">
                  <FooterLink to="/">Ecosystem</FooterLink>
                  <FooterLink to="/registerAsset">Register Asset</FooterLink>
                  <FooterLink to="/map">Property Map</FooterLink>
                  <FooterLink to="/about">About</FooterLink>
                </ul>
              </div>
              <div className="space-y-5">
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] opacity-40">Support</h3>
                <ul className="space-y-3">
                  <FooterLink to="/contact">Help Desk</FooterLink>
                  <FooterLink to="/contact">API Docs</FooterLink>
                  <FooterLink to="/about">Legal</FooterLink>
                  <FooterLink to="/about">Privacy</FooterLink>
                </ul>
              </div>
            </div>

            {/* Stats / Features */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] opacity-40">Network Stats</h3>
              {[
                { label: "Total Deeds", val: "2,400+" },
                { label: "Verified Users", val: "890+" },
                { label: "TX Speed", val: "< 2s" },
                { label: "Uptime", val: "99.9%" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between items-center py-2 px-3 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span className="text-xs font-black text-cyan-400">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            <span>Security Audited</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Open Source</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>Decentralized</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] text-zinc-600 font-bold tracking-wider">
              © {new Date().getFullYear()} PROPERTIX LABS. ALL RIGHTS RESERVED.
            </p>
            <p className="text-[10px]" style={{ fontFamily: "'Space Mono', monospace", color: "#333" }}>
              Chain: 0x7a69 • PROPERTIX_TESTNET
            </p>
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
      className="text-zinc-500 text-sm transition-all duration-300 flex items-center gap-2 group hover:text-cyan-400"
    >
      <span className="w-0 group-hover:w-3 h-px bg-cyan-400 transition-all duration-300 flex-shrink-0" />
      {children}
    </Link>
  </li>
);

const SocialIcon = ({ label, icon, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="relative w-10 h-10 rounded-xl flex items-center justify-center text-lg text-zinc-400 transition-all duration-300 group"
    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(6,182,212,0.12)";
      e.currentTarget.style.borderColor = "rgba(6,182,212,0.4)";
      e.currentTarget.style.color = "#06b6d4";
      e.currentTarget.style.transform = "translateY(-3px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      e.currentTarget.style.color = "#71717a";
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    {icon}
    <div className="absolute -top-9 scale-0 group-hover:scale-100 transition-all bg-white text-black text-[10px] px-2 py-1 rounded font-black whitespace-nowrap shadow-xl">
      {label}
    </div>
  </a>
);

export default Footer;