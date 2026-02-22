import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope, FaMapMarkerAlt, FaDiscord } from "react-icons/fa";

const Contact = () => {
  return (
    <div className="min-h-screen bg-[#020202] text-white py-24 px-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- HEADER --- */}
        <div className="mb-20">
          <span className="text-cyan-500 font-black text-xs uppercase tracking-[0.5em] mb-4 block underline decoration-cyan-500/30 underline-offset-8">
            Terminal_Entry: Contact
          </span>
          <h1 className="font-trench text-6xl md:text-8xl uppercase tracking-tighter italic transform -skew-x-6">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Touch</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* --- LEFT SIDE: CONTACT INFO --- */}
          <div className="lg:col-span-5 space-y-12">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-6 italic">Connect with the Lab</h3>
              <p className="text-zinc-500 text-lg leading-relaxed max-w-sm">
                Have a question about the protocol or want to partner with us? Our encrypted channels are open.
              </p>
            </div>

            <div className="space-y-8">
              <ContactMethod 
                icon={<FaEnvelope className="text-cyan-500" />} 
                label="Official Email" 
                value="labs@propertix.onchain" 
              />
              <ContactMethod 
                icon={<FaMapMarkerAlt className="text-cyan-500" />} 
                label="HQ Location" 
                value="Decentralized / Remote" 
              />
              <ContactMethod 
                icon={<FaDiscord className="text-cyan-500" />} 
                label="Discord Server" 
                value="discord.gg/propertix" 
              />
            </div>

            {/* Social Links */}
            <div className="pt-8 border-t border-white/5 flex gap-6">
              <SocialIcon href="#" icon={<FaLinkedin />} />
              <SocialIcon href="#" icon={<FaGithub />} />
              <SocialIcon href="#" icon={<FaTwitter />} />
            </div>
          </div>

          {/* --- RIGHT SIDE: CONTACT FORM --- */}
          <div className="lg:col-span-7">
            <div className="bg-white/[0.02] border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-3xl relative">
              <div className="absolute top-6 right-8 text-[10px] font-mono text-zinc-700 tracking-[0.3em] uppercase">Secure_Transmission_v1.0</div>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Your Name" placeholder="John Doe" type="text" />
                  <InputGroup label="Email Address" placeholder="john@example.com" type="email" />
                </div>
                
                <InputGroup label="Subject" placeholder="Inquiry about Asset Minting" type="text" />
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">Message</label>
                  <textarea 
                    rows="5" 
                    placeholder="Write your encrypted message here..."
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-4 text-zinc-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-zinc-700"
                  ></textarea>
                </div>

                <button className="w-full py-5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-[24px] text-black font-black uppercase tracking-[0.2em] text-xs hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:-translate-y-1 transition-all duration-500">
                  Transmit Message
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const ContactMethod = ({ icon, label, value }) => (
  <div className="flex items-center gap-6 group">
    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
      <p className="text-zinc-200 font-bold tracking-tight">{value}</p>
    </div>
  </div>
);

const InputGroup = ({ label, placeholder, type }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-4">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      className="bg-white/5 border border-white/10 rounded-full px-6 py-4 text-zinc-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-300 placeholder:text-zinc-700"
    />
  </div>
);

const SocialIcon = ({ href, icon }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-2xl text-zinc-600 hover:text-cyan-500 transition-colors duration-500">
    {icon}
  </a>
);

export default Contact;