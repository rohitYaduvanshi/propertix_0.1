// src/components/Footer.jsx
import { Link } from "react-router-dom";
import logo from "../assets/propertix.png";

const Footer = () => {
  return (
    <footer className=" bg-gradient-to-t from-black via-zinc-950 to-black border-t ">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Glassmorphism wrapper */}
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_18px_70px_rgba(0,0,0,0.85)] px-5 md:px-7 py-6 md:py-7 flex flex-col md:flex-row gap-8 md:gap-10 md:items-center md:justify-between">
          {/* Brand + tagline */}
          <div className="flex items-start gap-4 md:gap-5">
            <div className="flex-shrink-0">
              <div className="relative h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-cyan-400 p-[2px] shadow-[0_0_25px_rgba(129,140,248,0.7)]">
                <div className="h-full w-full rounded-2xl bg-black flex items-center justify-center">
                  <img
                    src={logo}
                    alt="Propertix logo"
                    className="h-7 w-auto object-contain"
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-base md:text-lg font-semibold text-white">
                Propertix
                <span className="ml-1 text-xs font-normal text-cyan-300/80 tracking-wide">
                  / Property on-chain
                </span>
              </h4>
              <p className="mt-1 text-[12px] md:text-[13px] text-gray-300 leading-relaxed max-w-md">
                A blockchain‑powered layer for property records, turning
                traditional documents into verifiable on‑chain proofs that are
                transparent and tamper‑resistant.
              </p>
            </div>
          </div>

          {/* Navigation columns */}
          <div className="flex-1 grid grid-cols-2 gap-6 text-[12px] md:text-[13px] text-gray-300">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-100 uppercase tracking-[0.18em]">
                Navigation
              </p>
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/registerAsset">RegisterAsset</FooterLink>
              <FooterLink to="/about">About project</FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-100 uppercase tracking-[0.18em]">
                Resources
              </p>
              <FooterLink to="/blockchain">Smart contracts</FooterLink>
              <span className="block text-gray-500">
                Whitepaper
                <span className="ml-1 text-[11px] text-gray-600">
                  (coming soon)
                </span>
              </span>
              <FooterLink to="/blockchain">Developer docs</FooterLink>
              <FooterLink to="/contact">Support</FooterLink>
            </div>
          </div>

          {/* Social + status */}
          <div className="flex flex-col items-start md:items-end gap-3">
            {/* Social icons */}
            <div className="flex items-center gap-3">
              <SocialDot label="GitHub" />
              <SocialDot label="LinkedIn" />
              <SocialDot label="X" />
            </div>
            {/* Status pill */}
            <div className="flex items-center gap-2 text-[11px] md:text-[12px] text-gray-300">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
              <span>Testnet prototype · Not for real transactions</span>
            </div>
            <p className="text-[11px] md:text-[12px] text-gray-500">
              &copy; {new Date().getFullYear()} Propertix. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }) => (
  <Link
    to={to}
    className="block text-gray-300 hover:text-cyan-300 transition-colors duration-200"
  >
    {children}
  </Link>
);

// Simple glowing circular icons (placeholder – later real links de sakta hai)
const SocialDot = ({ label }) => (
  <button
    type="button"
    aria-label={label}
    className="relative h-8 w-8 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-[11px] text-gray-200 shadow-[0_0_18px_rgba(148,163,184,0.35)] hover:border-cyan-400/80 hover:text-cyan-300 hover:shadow-[0_0_22px_rgba(34,211,238,0.75)] transition-all duration-200"
  >
    {/* first letter as icon */}
    <span className="font-medium">
      {label.charAt(0)}
    </span>
  </button>
);

export default Footer;
