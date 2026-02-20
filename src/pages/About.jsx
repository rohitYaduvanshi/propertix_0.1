import { FaLinkedin, FaGithub, FaTwitter, FaChalkboardTeacher, FaQuoteLeft, FaTerminal, FaShieldAlt, FaLayerGroup, FaCode } from "react-icons/fa";

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 relative selection:bg-cyan-500/30">
      {/* Background Mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-black to-black pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- SECTION 1: MISSION --- */}
        <section className="mb-48 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">
            Protocol Overview
          </div>
          <h1 className="font-trench text-6xl md:text-8xl uppercase tracking-tighter mb-10 leading-[0.9]">
            Redefining <span className="text-cyan-400">Ownership</span> <br /> 
            Through Cryptography
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left">
            <FeatureCard icon={<FaShieldAlt className="text-cyan-500" />} title="Legacy Fragility" desc="Physical deeds are vulnerable to forgery and administrative manipulation, leading to endless legal disputes." />
            <FeatureCard icon={<FaTerminal className="text-cyan-500" />} title="Immutable Proof" desc="Propertix digitizes assets into Blockchain NFTs, creating a permanent, tamper-proof history of ownership." />
            <FeatureCard icon={<FaLayerGroup className="text-cyan-500" />} title="Zero-Friction" desc="Smart Contracts automate transfers, ensuring capital moves only when verification is cryptographically confirmed." />
          </div>
        </section>

        {/* --- SECTION 2: THE MENTOR (The Centerpiece) --- */}
        <section className="mb-48">
          <div className="flex flex-col items-center">
             <div className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
               Project Mentor
             </div>
             
             <div className="relative w-full max-w-4xl group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-[48px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-zinc-950 rounded-[48px] p-10 md:p-16 text-center border border-white/10 overflow-hidden">
                   <FaQuoteLeft className="absolute top-10 left-10 text-white/5 text-9xl -rotate-12" />
                   
                   <div className="relative z-10">
                      {/* Unique Profile Frame for Sir */}
                      <div className="relative w-44 h-44 mx-auto mb-8">
                         <div className="absolute inset-0 bg-cyan-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                         <div className="relative w-full h-full rounded-full border-2 border-cyan-500/30 overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 shadow-2xl">
                            <img src="/assets/professor-sir.png" alt="Mentor" className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700" />
                         </div>
                      </div>

                      <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Prof. Mentor Name</h2>
                      <p className="text-cyan-500 font-bold text-xs uppercase tracking-[0.2em] mb-6">Department Head & Strategic Advisor</p>
                      <p className="text-zinc-400 text-lg md:text-xl italic max-w-2xl mx-auto leading-relaxed mb-10">
                        "Propertix is a paradigm shift. It bridges the gap between traditional governance and the decentralized future."
                      </p>
                      <div className="flex justify-center gap-8">
                        <SocialLink href="#" icon={<FaLinkedin />} label="LinkedIn" />
                        <SocialLink href="#" icon={<FaTwitter />} label="Twitter" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* --- SECTION 3: THE ARCHITECT (Unique Section for YOU) --- */}
        <section className="mb-48 bg-zinc-900/20 rounded-[60px] p-10 md:p-20 border border-white/5 shadow-2xl overflow-hidden relative">
           {/* Cyber-Grid Background overlay */}
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div>
                <div className="flex items-center gap-2 text-cyan-500 mb-4">
                    <FaCode className="text-sm" />
                    <span className="font-bold text-xs uppercase tracking-[0.4em]">Engineering Lead</span>
                </div>
                <h2 className="font-trench text-5xl md:text-7xl uppercase tracking-tighter mb-8">The <br /> Architect</h2>
                
                <p className="text-zinc-300 text-lg leading-relaxed mb-6 font-medium">
                  I am <span className="text-white font-black border-b-2 border-cyan-500">Your Name</span>. 
                  Building the future of property verification through cryptographic certainty.
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-md italic">
                  "Code is law, and in the realm of Propertix, it ensures that ownership is absolute and undeniable."
                </p>

                <div className="flex flex-wrap gap-3 mb-12">
                   {['Solidity', 'Web3.js', 'React', 'IPFS'].map(tech => (
                     <span key={tech} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-bold text-cyan-400 uppercase tracking-widest">{tech}</span>
                   ))}
                </div>

                <div className="flex gap-5">
                  <SocialLink href="#" icon={<FaLinkedin />} label="LinkedIn" />
                  <SocialLink href="#" icon={<FaGithub />} label="GitHub" />
                </div>
              </div>

              <div className="relative group">
                 {/* This is the unique photo frame for You */}
                 <div className="absolute -inset-2 bg-cyan-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                 <div className="relative aspect-[4/5] rounded-[40px] bg-zinc-950 border border-white/10 overflow-hidden">
                    <img 
                        src="/assets/your-photo.png" 
                        className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105 transition-all duration-1000 ease-in-out" 
                        alt="Architect" 
                    />
                    {/* Floating Info Tag */}
                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                       <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Developer ID: 0x71...B49</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- SECTION 4: THE CORE TEAM --- */}
        <section className="pb-20">
          <div className="flex items-center gap-6 mb-16">
            <h3 className="font-trench text-4xl uppercase tracking-tight whitespace-nowrap">Collaborators</h3>
            <div className="h-[1px] w-full bg-white/10"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <TeamCard 
              name="Member Name 1" 
              role="Lead UI Engineer" 
              img="/assets/member1.png" 
              bio="Translating complex on-chain metadata into seamless, intuitive user experiences."
              linkedin="#" github="#"
            />
            <TeamCard 
              name="Member Name 2" 
              role="Security Researcher" 
              img="/assets/member2.png" 
              bio="Auditing smart contract logic and ensuring regulatory compliance."
              linkedin="#" github="#"
            />
          </div>
        </section>

      </div>
    </div>
  );
};

// --- Sub-Components ---

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 bg-zinc-900/30 rounded-[32px] border border-white/5 hover:border-cyan-500/30 transition-all duration-500 group">
    <div className="mb-6 text-2xl group-hover:scale-110 transition-transform duration-500">{icon}</div>
    <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4">{title}</h3>
    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const SocialLink = ({ href, icon, label }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center">
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-zinc-400 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 group-hover:-translate-y-1 shadow-xl">
      {icon}
    </div>
    <span className="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500">{label}</span>
  </a>
);

const TeamCard = ({ name, role, img, bio, linkedin, github }) => (
  <div className="bg-zinc-900/20 border border-white/5 rounded-[40px] p-10 hover:bg-zinc-900/40 transition-all duration-500 group relative overflow-hidden">
    <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
      {/* Team Member Unique Frame */}
      <div className="w-24 h-24 rounded-3xl bg-zinc-800 border border-white/10 overflow-hidden relative group-hover:border-cyan-500/50 transition-colors">
        <img src={img} alt={name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
      </div>
      <div>
        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{name}</h4>
        <p className="text-cyan-500 font-bold text-[10px] uppercase tracking-[0.3em]">{role}</p>
      </div>
    </div>
    <p className="text-zinc-400 text-sm leading-relaxed mb-8">{bio}</p>
    <div className="flex gap-5">
      <a href={linkedin} className="text-zinc-500 hover:text-cyan-400 transition-colors text-xl"><FaLinkedin /></a>
      <a href={github} className="text-zinc-500 hover:text-cyan-400 transition-colors text-xl"><FaGithub /></a>
    </div>
  </div>
);

export default About;