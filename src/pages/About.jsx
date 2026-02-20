import { FaLinkedin, FaGithub, FaTwitter, FaChalkboardTeacher, FaTerminal, FaFingerprint, FaShieldUint } from "react-icons/fa";

const About = () => {
  return (
    <div className="min-h-screen bg-[#020202] text-white py-24 px-6 relative overflow-hidden">
      
      {/* --- BACKGROUND ELEMENTS --- */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-500/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- HEADER: BIG & BOLD --- */}
        <div className="relative mb-32">
          <span className="text-cyan-500 font-black text-xs uppercase tracking-[0.5em] mb-4 block">0x_Project_Identity</span>
          <h1 className="font-trench text-7xl md:text-9xl uppercase tracking-tighter leading-none mb-6 italic transform -skew-x-6">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Propertix</span>
          </h1>
          <div className="h-1 w-32 bg-cyan-500 mb-8" />
          <p className="max-w-3xl text-zinc-400 text-lg md:text-xl font-medium leading-relaxed">
            We are not just a database; we are the **Immutable Source of Truth**. Propertix is engineering the future of 
            real estate by anchoring physical world assets into the decentralized web.
          </p>
        </div>

        {/* --- SECTION 1: THE MENTOR (The Visionary) --- */}
        <section className="mb-48">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              {/* Photo Frame with Cyber Edges */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition duration-700 blur-xl"></div>
              <div className="relative bg-zinc-900 border-2 border-white/10 rounded-[40px] overflow-hidden aspect-[4/3] transform group-hover:scale-[1.02] transition-all duration-700">
                <img src="/assets/my-photo.png" alt="Mentor" className="w-full h-full object-cover grayscale brightness-90 group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black to-transparent">
                  <p className="text-cyan-400 font-black text-[10px] tracking-widest uppercase mb-1 underline decoration-cyan-500/50 underline-offset-4">Primary Consultant</p>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">Prof. Mentor Name</h2>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <FaFingerprint className="text-5xl text-cyan-500 opacity-20" />
              <h3 className="text-2xl font-bold uppercase tracking-tight italic text-zinc-300">"Mentorship is the backbone of Innovation."</h3>
              <p className="text-zinc-500 text-lg leading-relaxed">
                Under his strategic guidance, Propertix evolved from a conceptual idea to a production-ready protocol. 
                His expertise in systemic governance ensured our smart contracts align with real-world legalities.
              </p>
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
                         <img src="/assets/my-photo.png" alt="Architect" className="w-full h-full object-cover grayscale brightness-110 group-hover:grayscale-0 transition-all duration-700" />
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </section>

        {/* --- SECTION 3: THE COLLABORATORS (4 Grid) --- */}
        <section className="pb-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <h2 className="font-trench text-4xl md:text-6xl uppercase tracking-tighter italic">Technical <span className="text-cyan-500">Unit</span></h2>
            <p className="text-zinc-600 font-mono text-xs uppercase tracking-[0.3em]">Execution_Team_v1.0</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MemberCard name="Partner 1" role="UI/UX Lead" img="/assets/m1.png" />
            <MemberCard name="Partner 2" role="DevOps" img="/assets/m2.png" />
            <MemberCard name="Partner 3" role="Researcher" img="/assets/m3.png" />
            <MemberCard name="Partner 4" role="Quality Assurance" img="/assets/m4.png" />
          </div>
        </section>

      </div>
    </div>
  );
};

// --- Custom Modern Components ---

const SocialBtn = ({ label, href }) => (
  <a href={href} className="px-6 py-2 border border-white/10 hover:border-cyan-500 hover:bg-cyan-500 hover:text-black transition-all duration-500 text-[10px] font-black uppercase tracking-widest rounded-full">
    {label}
  </a>
);

const MemberCard = ({ name, role, img }) => (
  <div className="group relative bg-zinc-900/50 border border-white/5 p-6 rounded-[32px] hover:bg-zinc-800 transition-all duration-500 hover:-translate-y-2">
    <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 border border-white/10">
      <img src={img} alt={name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" />
    </div>
    <h4 className="text-lg font-black uppercase tracking-tight text-white mb-1">{name}</h4>
    <p className="text-cyan-500 text-[9px] font-black uppercase tracking-[0.2em]">{role}</p>
    
    <div className="mt-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
       <div className="h-1 w-1 rounded-full bg-zinc-600" />
       <div className="h-1 w-1 rounded-full bg-zinc-600" />
       <div className="h-1 w-1 rounded-full bg-zinc-600" />
    </div>
  </div>
);

export default About;