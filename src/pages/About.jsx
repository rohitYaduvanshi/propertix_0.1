import { FaLinkedin, FaGithub, FaTwitter, FaFingerprint } from "react-icons/fa";
// --- 1. Images Import (प्रोफेशनल तरीका) ---
import profImg from "../assets/professor.png";
import myImg from "../assets/my-photo.png";
import m1 from "../assets/m1.png";
import m2 from "../assets/m1.png";
import m3 from "../assets/m1.png";
import m4 from "../assets/m1.png";

const About = () => {
  return (
    <div className="min-h-screen bg-[#020202] text-white py-24 px-6 relative overflow-hidden">

      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* --- HEADER: ULTRA MODERN & BOLD --- */}
        <header className="relative mb-40 group">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[2px] w-12 bg-cyan-500"></div>
            <span className="text-cyan-500 font-mono text-[10px] uppercase tracking-[0.6em] font-black">
              0x_Digital_Manifesto
            </span>
          </div>

          <h1 className="font-trench text-7xl md:text-[11rem] uppercase tracking-tighter leading-[0.85] italic mb-10">
            <span className="block text-white transition-all duration-700 hover:tracking-normal cursor-default">
              Beyond
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x bg-[length:200%_200%]">
              Propertix
            </span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <p className="text-zinc-400 text-xl md:text-2xl font-light leading-snug max-w-2xl border-l border-zinc-800 pl-8">
                We are engineering an <span className="text-white font-bold">Immutable Ledger</span> for the real world.
                Bridging the gap between physical land ownership and cryptographic certainty.
              </p>
            </div>
            <div className="lg:col-span-5 flex lg:justify-end">
              <div className="text-[10px] font-mono text-zinc-600 uppercase leading-loose border border-white/5 p-4 rounded-xl backdrop-blur-sm">
                System_Status: <span className="text-emerald-500">Online</span> <br />
                Protocol_v: 1.0.4_Stable <br />
                Network: On-Chain_Records
              </div>
            </div>
          </div>
        </header>

        {/* --- SECTION 1: THE MENTOR --- */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition duration-700 blur-2xl rounded-[40px]"></div>
              <div className="relative bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden aspect-[4/3]">
                <img src={profImg} alt="Mentor" className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-1000" />
                <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black to-transparent">
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic">Prof. Jayanta Basak</h2>
                  <p className="text-cyan-500 text-[10px] font-bold tracking-widest uppercase">Strategic Advisor</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <FaFingerprint className="text-5xl text-cyan-500 opacity-20" />
              <h3 className="text-2xl font-bold italic text-zinc-300">"Truth is code, and code is law."</h3>
              <p className="text-zinc-500 text-lg">Blockchain technology is not merely a tool for finance; it is the foundation for a more 
                equitable legal system. Propertix is the first step toward that reality.</p>
              <div className="flex gap-4 pt-4">
                <SocialBtn label="LinkedIn" href="#" />
                <SocialBtn label="Twitter" href="#" />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: THE ARCHITECT (The Engine) --- */}
        <section className="mb-48 relative">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[60px] p-10 md:p-20 overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="order-2 lg:order-1">
                <div className="inline-block px-4 py-1 bg-cyan-500 text-black text-[10px] font-black uppercase tracking-widest mb-6">Founder & Lead</div>
                <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 italic transform -skew-x-6">The Architect</h2>
                <p className="text-zinc-400 text-lg mb-8">
                  Hey, I'm <span className="text-white font-bold border-b-2 border-cyan-500">Your Name</span>.
                  I bridge the gap between complex blockchain logic and high-performance user interfaces.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl"><span className="text-[10px] text-zinc-600 uppercase font-black block mb-1">Role</span><p className="text-xs font-bold text-zinc-300 tracking-wide">Core Architecture</p></div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-2xl"><span className="text-[10px] text-zinc-600 uppercase font-black block mb-1">Focus</span><p className="text-xs font-bold text-zinc-300 tracking-wide">Smart Contracts & Security</p></div>
                </div>
                <div className="flex gap-4">
                  <SocialBtn label="GitHub" href="#" />
                  <SocialBtn label="LinkedIn" href="#" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-cyan-500 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative h-full w-full rounded-[50px] border-4 border-white/5 overflow-hidden rotate-3 group-hover:rotate-0 transition-transform duration-700">
                    <img src={myImg} alt="Architect" className="w-full h-full object-cover grayscale brightness-110 group-hover:grayscale-0 transition-all duration-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: THE COLLABORATORS --- */}
        <section className="pb-20">
          <h2 className="font-trench text-4xl md:text-6xl uppercase tracking-tighter italic mb-16">Technical <span className="text-cyan-500">Unit</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MemberCard name="Partner 1" role="UI/UX Lead" img={m1} />
            <MemberCard name="Partner 2" role="DevOps" img={m2} />
            <MemberCard name="Partner 3" role="Researcher" img={m3} />
            <MemberCard name="Partner 4" role="Quality Assurance" img={m4} />
          </div>
        </section>

      </div>
    </div>
  );
};

// --- Updated Components ---

const SocialBtn = ({ label, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="px-6 py-2 border border-white/10 hover:border-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-500 text-[10px] font-black uppercase tracking-widest rounded-full">
    {label}
  </a>
);

const MemberCard = ({ name, role, img }) => (
  <div className="group relative bg-zinc-950 border border-white/5 p-6 rounded-[32px] hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-2">
    <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 border border-white/5">
      <img src={img} alt={name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" />
    </div>
    <h4 className="text-lg font-black uppercase tracking-tight text-white mb-1">{name}</h4>
    <p className="text-cyan-500 text-[9px] font-black uppercase tracking-[0.2em]">{role}</p>
  </div>
);

export default About;