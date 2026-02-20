import { FaLinkedin, FaGithub, FaTwitter, FaChalkboardTeacher, FaTerminal, FaShieldAlt, FaLayerGroup } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";

// --- 1. Images Import (Assets से करें) ---
// import profImg from "../assets/professor.png";
 import myImg from "../assets/my-photo.png";
// import member1 from "../assets/member1.png";
// ... (इसी तरह बाकी 4)

const About = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] py-32 px-6 font-sans selection:bg-cyan-500/20">
      
      {/* Structural Background (Minimalist) */}
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none opacity-20" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* --- HEADER: THE MANIFESTO --- */}
        <header className="mb-40 border-l border-cyan-500 pl-8">
          <p className="text-cyan-500 font-mono text-xs tracking-[0.5em] uppercase mb-4">Protocol: Propertix</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8">
            Engineering Trust <br /> in Digital Realty.
          </h1>
          <p className="text-zinc-500 text-lg max-w-2xl leading-relaxed">
            Propertix is a decentralized infrastructure layer designed to solve the structural 
            inefficiencies of land ownership through cryptographic validation and 
            immutable ledger technology.
          </p>
        </header>

        {/* --- SECTION 1: THE MENTOR (The Origin) --- */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-2 block">01. Mentorship</span>
              <h2 className="text-3xl font-bold text-white mb-6">Prof. Mentor Name</h2>
              <p className="text-zinc-500 text-sm leading-relaxed mb-8 italic border-l-2 border-zinc-800 pl-6">
                "Blockchain technology is not merely a tool for finance; it is the foundation for a more 
                equitable legal system. Propertix is the first step toward that reality."
              </p>
              <div className="flex gap-4">
                <SocialIcon href="#" icon={<FaLinkedin />} />
                <SocialIcon href="#" icon={<FaTwitter />} />
                <SocialIcon href="#" icon={<HiOutlineMail />} />
              </div>
            </div>
            <div className="lg:col-span-7 order-1 lg:order-2">
              {/* Professor Photo Container */}
              <div className="relative aspect-video bg-zinc-900 overflow-hidden border border-white/5 grayscale hover:grayscale-0 transition-all duration-700">
                <img src="/assets/professor-sir.png" alt="Professor" className="w-full h-full object-cover opacity-70 hover:opacity-100" />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: THE ARCHITECT (Technical Core) --- */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
             <div className="lg:col-span-7">
               {/* Your Photo Container */}
               <div className="relative aspect-[16/9] bg-zinc-900 overflow-hidden border border-cyan-500/20 grayscale hover:grayscale-0 transition-all duration-700">
                  <img src={myImg} alt="Architect" className="w-full h-full object-cover opacity-70 hover:opacity-100" />
               </div>
             </div>
             <div className="lg:col-span-5">
               <span className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-2 block">02. Lead Engineering</span>
               <h2 className="text-3xl font-bold text-white mb-4">Your Name</h2>
               <p className="text-cyan-500/80 font-mono text-xs uppercase mb-6 tracking-widest">Full-Stack Blockchain Architect</p>
               <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                 Responsible for the end-to-end architecture of the Propertix protocol, 
                 from Solidity-based smart contracts to the React-powered interface.
               </p>
               <div className="flex gap-4">
                 <SocialIcon href="#" icon={<FaLinkedin />} />
                 <SocialIcon href="#" icon={<FaGithub />} />
               </div>
             </div>
          </div>
        </section>

        {/* --- SECTION 3: THE TEAM (Modular Grid) --- */}
        <section className="pb-32">
          <div className="mb-16 flex justify-between items-end border-b border-white/5 pb-8">
             <h3 className="text-2xl font-bold text-white tracking-tight">Technical Collaborators</h3>
             <span className="text-zinc-600 font-mono text-[10px] uppercase">03. Support Staff</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5">
            <TeamTile 
              name="Partner 1" 
              role="UI Engineer" 
              img="/assets/member1.png" 
              href="#" 
            />
            <TeamTile 
              name="Partner 2" 
              role="Protocol Security" 
              img="/assets/member2.png" 
              href="#" 
            />
            <TeamTile 
              name="Partner 3" 
              role="Blockchain Analyst" 
              img="/assets/member3.png" 
              href="#" 
            />
            <TeamTile 
              name="Partner 4" 
              role="Backend Dev" 
              img="/assets/member4.png" 
              href="#" 
            />
          </div>
        </section>

      </div>
    </div>
  );
};

// --- Senior Dev Components (Clean & Lightweight) ---

const SocialIcon = ({ href, icon }) => (
  <a 
    href={href} 
    target="_blank" 
    className="text-zinc-500 hover:text-cyan-400 transition-colors duration-300 text-lg"
  >
    {icon}
  </a>
);

const TeamTile = ({ name, role, img, href }) => (
  <div className="bg-[#050505] p-8 group transition-all duration-500">
    <div className="aspect-square bg-zinc-900 border border-white/5 mb-6 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
      <img src={img} alt={name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
    </div>
    <h4 className="text-white font-bold text-sm tracking-tight mb-1">{name}</h4>
    <p className="text-zinc-600 text-[11px] font-mono uppercase tracking-widest mb-4">{role}</p>
    <a href={href} className="text-[10px] text-cyan-500/50 hover:text-cyan-400 font-bold uppercase tracking-tighter transition-colors">Connect +</a>
  </div>
);

export default About;