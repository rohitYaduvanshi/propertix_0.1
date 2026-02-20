import { FaLinkedin, FaGithub, FaTwitter, FaChalkboardTeacher, FaQuoteLeft, FaTerminal, FaShieldAlt, FaLayerGroup } from "react-icons/fa";

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 relative selection:bg-cyan-500/30">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- SECTION 1: THE MISSION (Redefined) --- */}
        <section className="mb-48 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500">
            The Digital Frontier
          </div>
          <h1 className="font-trench text-6xl md:text-8xl uppercase tracking-tighter mb-10 leading-[0.9]">
            Redefining <span className="text-cyan-400">Ownership</span> <br /> 
            Through Cryptography
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left">
            <FeatureCard 
              icon={<FaShieldAlt className="text-cyan-500" />}
              title="Legacy Fragility"
              desc="Physical land deeds are vulnerable to loss, forgery, and administrative manipulation, leading to decades of legal disputes."
            />
            <FeatureCard 
              icon={<FaTerminal className="text-cyan-500" />}
              title="Immutable Proof"
              desc="Propertix digitizes assets into Blockchain-verified NFTs, creating a permanent, tamper-proof history of ownership."
            />
            <FeatureCard 
              icon={<FaLayerGroup className="text-cyan-500" />}
              title="Zero-Friction"
              desc="Smart Contracts automate transfers, ensuring capital only moves when title verification is cryptographically confirmed."
            />
          </div>
        </section>

        {/* --- SECTION 2: THE MENTOR (Executive View) --- */}
        <section className="mb-48">
          <div className="flex flex-col items-center">
             <div className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
               Project Mentor
             </div>
             
             <div className="relative w-full max-w-4xl group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-[48px] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                
                <div className="relative bg-zinc-950 rounded-[48px] p-10 md:p-16 text-center border border-white/10 overflow-hidden">
                   <FaQuoteLeft className="absolute top-10 left-10 text-white/5 text-9xl -rotate-12" />
                   
                   <div className="relative z-10">
                      <div className="w-40 h-40 mx-auto mb-8 rounded-full p-1 bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-2xl">
                         <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=prof" alt="Mentor" className="w-full h-full object-cover" />
                         </div>
                      </div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter mb-2 italic">Prof. Mentor Name</h2>
                      <p className="text-cyan-500 font-bold text-xs uppercase tracking-[0.2em] mb-6 underline underline-offset-8 decoration-white/10">Department Head & Strategic Advisor</p>
                      <p className="text-zinc-400 text-lg md:text-xl italic max-w-2xl mx-auto leading-relaxed mb-10">
                        "Propertix represents a fundamental shift in digital trust. It bridges the gap between traditional governance and the decentralized future."
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

        {/* --- SECTION 3: THE ARCHITECT (HIGH-END IMPROVED) --- */}
        <section className="mb-48 bg-zinc-900/30 rounded-[60px] p-10 md:p-20 border border-white/5 shadow-inner">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                <span className="text-cyan-400 font-bold text-xs uppercase tracking-[0.4em] block mb-4">Engineering Lead</span>
                <h2 className="font-trench text-5xl md:text-7xl uppercase tracking-tighter mb-8">The <br /> Architect</h2>
                
                <p className="text-zinc-300 text-lg leading-relaxed mb-6 font-medium">
                  I am <span className="text-white font-black border-b-2 border-cyan-500">Your Name</span>. 
                  My focus is on the intersection of Real Estate logic and Cryptographic security.
                </p>
                <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-md">
                  Designing the Core Protocol and Smart Contract architecture, I ensure every digital deed is as legally sound as it is technically unhackable.
                </p>

                {/* Tech Stack Mini-Display */}
                <div className="flex flex-wrap gap-3 mb-12">
                   {['Solidity', 'Ethers.js', 'React', 'IPFS'].map(tech => (
                     <span key={tech} className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{tech}</span>
                   ))}
                </div>

                <div className="flex gap-5">
                  <SocialLink href="#" icon={<FaLinkedin />} label="LinkedIn" />
                  <SocialLink href="#" icon={<FaGithub />} label="GitHub" />
                  <SocialLink href="#" icon={<FaTwitter />} label="Twitter" />
                </div>
              </div>

              <div className="order-1 lg:order-2 relative">
                 <div className="absolute -inset-1 bg-cyan-500 rounded-[40px] opacity-20 blur-2xl"></div>
                 <div className="relative aspect-square rounded-[40px] bg-black border border-white/20 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=architect" className="w-full h-full object-cover grayscale brightness-110 hover:grayscale-0 transition-all duration-700" alt="Architect" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black to-transparent"></div>
                    <div className="absolute bottom-6 left-6">
                       <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Auth_ID: 0x71...B49</p>
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
              name="Collaborator 1" 
              role="Lead UI Engineer" 
              img="https://api.dicebear.com/7.x/avataaars/svg?seed=fe" 
              bio="Translating complex on-chain metadata into seamless, intuitive user experiences."
              linkedin="#" github="#" twitter="#"
            />
            <TeamCard 
              name="Collaborator 2" 
              role="Protocol Analyst" 
              img="https://api.dicebear.com/7.x/avataaars/svg?seed=sec" 
              bio="Auditing smart contract logic and ensuring regulatory compliance in digital deeds."
              linkedin="#" github="#" twitter="#"
            />
          </div>
        </section>

      </div>
    </div>
  );
};

// Reusable Feature Card
const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 bg-zinc-900/50 rounded-[32px] border border-white/5 backdrop-blur-sm group hover:border-cyan-500/30 transition-all duration-500">
    <div className="mb-6 text-2xl">{icon}</div>
    <h3 className="text-white font-black text-sm uppercase tracking-widest mb-4 group-hover:text-cyan-400 transition-colors">{title}</h3>
    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

// Reusable Social Link
const SocialLink = ({ href, icon, label }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center">
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-zinc-400 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 group-hover:-translate-y-1 shadow-xl">
      {icon}
    </div>
    <span className="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500">{label}</span>
  </a>
);

// Reusable Team Card
const TeamCard = ({ name, role, img, bio, linkedin, github, twitter }) => (
  <div className="bg-zinc-900/30 border border-white/5 rounded-[40px] p-10 hover:bg-zinc-900/50 transition-all duration-500 group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-8 text-white/5 text-6xl font-black">01</div>
    <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
      <div className="w-24 h-24 rounded-3xl bg-zinc-800 overflow-hidden rotate-3 group-hover:rotate-0 transition-transform duration-500 border border-white/10">
        <img src={img} alt={name} className="w-full h-full object-cover" />
      </div>
      <div>
        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{name}</h4>
        <p className="text-cyan-500 font-bold text-[10px] uppercase tracking-[0.3em]">{role}</p>
      </div>
    </div>
    <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">{bio}</p>
    <div className="flex gap-5">
      <a href={linkedin} className="text-zinc-500 hover:text-cyan-400 transition-colors text-xl"><FaLinkedin /></a>
      <a href={github} className="text-zinc-500 hover:text-cyan-400 transition-colors text-xl"><FaGithub /></a>
      <a href={twitter} className="text-zinc-500 hover:text-cyan-400 transition-colors text-xl"><FaTwitter /></a>
    </div>
  </div>
);

export default About;