import { FaLinkedin, FaGithub, FaTwitter, FaChalkboardTeacher, FaQuoteLeft } from "react-icons/fa";

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white py-24 px-6 relative selection:bg-cyan-500/30">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-0 w-72 h-72 bg-purple-600/10 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- SECTION 1: PROPERTIX REVOLUTION (STORY) --- */}
        <section className="mb-40 text-center">
          <h1 className="font-trench text-6xl md:text-8xl uppercase tracking-tighter mb-8 leading-none">
            The New Era of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Land Records</span>
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 text-left">
            <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
              <h3 className="text-cyan-400 font-black text-xs uppercase tracking-widest mb-4">The Problem</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">पारंपरिक जमीन के कागजात खो सकते हैं, जलाए जा सकते हैं या उनके साथ छेड़छाड़ की जा सकती है। आज भी जमीन के विवाद सालों तक अदालतों में चलते हैं।</p>
            </div>
            <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md scale-105 border-cyan-500/30">
              <h3 className="text-cyan-400 font-black text-xs uppercase tracking-widest mb-4">Our Solution</h3>
              <p className="text-zinc-100 text-sm leading-relaxed">Propertix ब्लॉकचेन का उपयोग करके हर रिकॉर्ड को एक <strong>Immutable NFT</strong> में बदल देता है। अब आपकी जमीन का मालिक कौन है, यह पूरी दुनिया के सामने पारदर्शी और सुरक्षित है।</p>
            </div>
            <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
              <h3 className="text-cyan-400 font-black text-xs uppercase tracking-widest mb-4">The Future</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">बिना किसी बिचौलिए के सीधे खरीद-बिक्री। स्मार्ट कॉन्ट्रैक्ट्स यह सुनिश्चित करते हैं कि पैसा तभी ट्रांसफर हो जब मालिकाना हक बदल जाए।</p>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: THE MENTOR (CENTER FOCUS) --- */}
        <section className="mb-40">
          <div className="flex flex-col items-center">
             <div className="inline-flex items-center gap-2 px-6 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-12 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
               <FaChalkboardTeacher className="text-lg" /> Project Mentor
             </div>
             
             <div className="relative w-full max-w-4xl bg-gradient-to-b from-white/10 to-transparent p-[1px] rounded-[48px]">
                <div className="bg-zinc-950 rounded-[47px] p-10 md:p-16 text-center relative overflow-hidden">
                   {/* Quote Icon Background */}
                   <FaQuoteLeft className="absolute top-10 left-10 text-white/5 text-9xl -rotate-12" />
                   
                   <div className="relative z-10">
                      <div className="w-40 h-40 mx-auto mb-8 rounded-full p-1 bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-2xl shadow-cyan-500/20">
                         <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center">
                            {/* PROFESSOR IMAGE HERE */}
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=mentor" alt="Mentor" className="w-full h-full object-cover" />
                         </div>
                      </div>
                      <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Prof. Mentor Name</h2>
                      <p className="text-cyan-500 font-bold text-xs uppercase tracking-[0.2em] mb-6">Head of Innovation Department</p>
                      <p className="text-zinc-400 text-lg italic max-w-2xl mx-auto leading-relaxed mb-8">
                        "Propertix is not just a project; it's a paradigm shift in how we perceive digital trust and ownership in the modern age."
                      </p>
                      <div className="flex justify-center gap-6">
                        <SocialLink href="#" icon={<FaLinkedin />} label="LinkedIn" />
                        <SocialLink href="#" icon={<FaTwitter />} label="Twitter" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        <hr className="border-white/5 mb-40" />

        {/* --- SECTION 3: THE ARCHITECT (YOU) --- */}
        <section className="mb-40">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="font-trench text-5xl uppercase tracking-tighter mb-6">The <span className="text-cyan-400">Architect</span></h2>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                  Hey, I'm <span className="text-white font-bold">Your Name</span>. I started Propertix with a single goal: to kill corruption in real estate through code. As the Lead Architect, I handle the Smart Contracts and Core Protocol.
                </p>
                <div className="flex gap-4">
                  <SocialLink href="#" icon={<FaLinkedin />} label="LinkedIn" />
                  <SocialLink href="#" icon={<FaGithub />} label="GitHub" />
                  <SocialLink href="#" icon={<FaTwitter />} label="Twitter" />
                </div>
              </div>
              <div className="relative group">
                 <div className="absolute -inset-4 bg-cyan-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition duration-500" />
                 <div className="relative w-full aspect-square rounded-[40px] bg-zinc-900 border border-white/10 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=architect" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="Architect" />
                 </div>
              </div>
           </div>
        </section>

        {/* --- SECTION 4: THE CORE TEAM --- */}
        <section>
          <div className="text-center mb-16">
            <h3 className="font-trench text-4xl uppercase tracking-tight">Core <span className="text-purple-500">Collaborators</span></h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <TeamCard 
              name="Collaborator 1" 
              role="Frontend Lead" 
              img="https://api.dicebear.com/7.x/avataaars/svg?seed=frontend" 
              bio="Ensuring the complex blockchain data looks simple and beautiful for the users."
              linkedin="#" github="#" twitter="#"
            />
            <TeamCard 
              name="Collaborator 2" 
              role="Security Researcher" 
              img="https://api.dicebear.com/7.x/avataaars/svg?seed=security" 
              bio="Hunting bugs in smart contracts before they hunt our users."
              linkedin="#" github="#" twitter="#"
            />
          </div>
        </section>

      </div>
    </div>
  );
};

// Reusable Social Link
const SocialLink = ({ href, icon, label }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center">
    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-zinc-400 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500 group-hover:-translate-y-1">
      {icon}
    </div>
    <span className="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500">{label}</span>
  </a>
);

// Reusable Team Card
const TeamCard = ({ name, role, img, bio, linkedin, github, twitter }) => (
  <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-8 hover:bg-white/[0.06] transition-all duration-500 group">
    <div className="flex items-center gap-6 mb-6">
      <div className="w-20 h-20 rounded-2xl bg-zinc-800 overflow-hidden">
        <img src={img} alt={name} className="w-full h-full object-cover" />
      </div>
      <div>
        <h4 className="text-xl font-black text-white uppercase tracking-tight">{name}</h4>
        <p className="text-purple-500 font-bold text-[10px] uppercase tracking-widest">{role}</p>
      </div>
    </div>
    <p className="text-zinc-500 text-sm leading-relaxed mb-6">{bio}</p>
    <div className="flex gap-4">
      <a href={linkedin} className="text-zinc-500 hover:text-white transition-colors text-lg"><FaLinkedin /></a>
      <a href={github} className="text-zinc-500 hover:text-white transition-colors text-lg"><FaGithub /></a>
      <a href={twitter} className="text-zinc-500 hover:text-white transition-colors text-lg"><FaTwitter /></a>
    </div>
  </div>
);

export default About;