import { FaLinkedin, FaGithub, FaTwitter, FaChalkboardTeacher } from "react-icons/fa";

const About = () => {
  return (
    <div className="min-h-screen bg-black text-white py-20 px-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* --- SECTION 1: PROJECT VISION --- */}
        <div className="text-center mb-24">
          <h1 className="font-trench text-5xl md:text-7xl uppercase tracking-tighter mb-6">
            About <span className="text-cyan-400">Propertix</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            We are building a decentralized future for real estate. Propertix turns traditional 
            land records into <span className="text-white font-bold">Immutable Digital Assets</span>, 
            ensuring transparency, security, and trust for every citizen.
          </p>
        </div>

        {/* --- SECTION 2: THE MENTOR (TEACHER) --- */}
        <div className="mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <FaChalkboardTeacher /> Guided By
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-[40px] p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center backdrop-blur-3xl shadow-2xl">
            <div className="w-48 h-48 rounded-[30px] bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shrink-0 shadow-2xl">
              <div className="w-full h-full bg-zinc-900 rounded-[28px] flex items-center justify-center overflow-hidden">
                {/* यहाँ टीचर की फोटो लगायें */}
                <span className="text-5xl">👨‍🏫</span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Prof. Your Teacher's Name</h2>
              <p className="text-cyan-400 font-bold text-sm uppercase tracking-widest mb-4">Project Mentor & Guide</p>
              <p className="text-zinc-400 leading-relaxed text-lg">
                "Inspiration starts with a question." Under their constant guidance, we learned how to 
                bridge the gap between traditional governance and blockchain technology. Their mentorship 
                turned our messy code into a scalable protocol.
              </p>
            </div>
          </div>
        </div>

        {/* --- SECTION 3: THE TEAM --- */}
        <div>
          <h3 className="font-trench text-4xl mb-12 uppercase tracking-tight text-center md:text-left">
            The <span className="text-purple-500">Core</span> Team
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 (YOU) */}
            <TeamCard 
              name="Your Name" 
              role="Lead Developer / Architect" 
              img="👨‍💻" 
              bio="Blockchain enthusiast and full-stack dev focused on building secure on-chain protocols."
              linkedin="#"
              github="#"
            />

            {/* Team Member 2 */}
            <TeamCard 
              name="Partner Name" 
              role="UI/UX & Frontend" 
              img="🎨" 
              bio="Crafting seamless digital experiences with a focus on modern minimalist aesthetics."
              linkedin="#"
              github="#"
            />

            {/* Team Member 3 */}
            <TeamCard 
              name="Partner Name" 
              role="Blockchain Researcher" 
              img="⛓️" 
              bio="Specializing in Smart Contract security and ZK-Proof implementations for land records."
              linkedin="#"
              github="#"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

// Reusable Team Card Component
const TeamCard = ({ name, role, img, bio, linkedin, github }) => (
  <div className="group relative">
    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative bg-white/5 border border-white/10 rounded-[32px] p-8 hover:border-cyan-500/50 transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm">
      <div className="text-5xl mb-6">{img}</div>
      <h4 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{name}</h4>
      <p className="text-cyan-500 font-bold text-[10px] uppercase tracking-widest mb-4">{role}</p>
      <p className="text-zinc-500 text-sm leading-relaxed mb-6">
        {bio}
      </p>
      <div className="flex gap-4">
        <a href={linkedin} className="text-zinc-400 hover:text-white transition-colors text-xl"><FaLinkedin /></a>
        <a href={github} className="text-zinc-400 hover:text-white transition-colors text-xl"><FaGithub /></a>
      </div>
    </div>
  </div>
);

export default About;