import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Lock, CheckCircle, UploadCloud, FileText, Fingerprint, ShieldCheck, Database } from "lucide-react"; 

import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";
import { useSmartAccount } from "../context/SmartAccountContext.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../utils/ipfs.js";

const Register_Asset = () => {
  const { smartAccount, smartAccountAddress, isLocalhost } = useSmartAccount();
  
  // Verification States
  const [inputAadhaar, setInputAadhaar] = useState(""); 
  const [isVerified, setIsVerified] = useState(false); 
  const [verifying, setVerifying] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    state: "", district: "", village: "", ownerName: "", 
    area: "", address: "", khasraNumber: "" 
  });
  const [images, setImages] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  // 🛠️ Step 1: Identity Matching (Bypass error: Link Aadhaar first) [cite: 2026-03-01]
  const handleVerifyAadhaar = async () => {
    if (inputAadhaar.length !== 12) return alert("Please enter a valid 12-digit Aadhaar number.");
    
    try {
      setVerifying(true);
      const provider = isLocalhost 
        ? new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
        : new ethers.providers.Web3Provider(window.ethereum);

      const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      // Mapping check from Smart Contract [cite: 2026-03-01]
      const storedHash = await contract.walletToIdentity(smartAccountAddress);
      const inputHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(inputAadhaar));

      if (storedHash === inputHash) {
        setIsVerified(true);
        alert("✅ Identity Verified! Registry Access Granted.");
      } else {
        alert("❌ Identity Mismatch. Ensure you use the Aadhaar linked during registration.");
      }
    } catch (err) {
      console.error(err);
      alert("Verification Error: Pehle 'Register' page par identity link karein.");
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isVerified) return alert("Verify your Aadhaar link first!");
    if (images.length < 1 || !docFile) return alert("Upload asset photos and legal deed.");

    try {
      setIsSubmitting(true);
      setStatus("Step 1/2: Anchoring Assets to IPFS...");

      // Multi-file IPFS Upload [cite: 2026-01-24]
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadFileToIPFS(img);
        imageUrls.push(url);
      }
      const docUrl = await uploadFileToIPFS(docFile);
      
      const metadata = { 
        ...formData, 
        requester: smartAccountAddress,
        images: imageUrls, 
        document: docUrl,
        timestamp: new Date().toISOString()
      };

      // Upload JSON to IPFS (This becomes the tokenURI) [cite: 2026-01-24]
      const metadataURL = await uploadJSONToIPFS(metadata);

      setStatus("Step 2/2: Authorizing Blockchain Entry...");

      // Synced with v4 Contract: (ownerName, ipfsMetadata) [cite: 2026-03-07]
      const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, smartAccount);
      
      const tx = await contract.requestRegistration(
        formData.ownerName, 
        metadataURL, 
        { value: ethers.utils.parseEther("0.001") } // Registration Fee [cite: 2026-03-07]
      );

      await tx.wait();
      setStatus("🎉 Registration Filed! Waiting for Govt Approval.");
      alert("Success! Your land record is now on the blockchain ledger.");

    } catch (err) { 
      console.error("Chain Error:", err);
      alert("Transaction Failed: " + (err.reason || "Check Balance or Role Permissions"));
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <section className="min-h-screen bg-black text-white p-6 font-sans flex flex-col items-center selection:bg-cyan-500/30">
      
      {/* Dynamic Header */}
      <div className="w-full max-w-4xl mt-12 mb-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full"></div>
        <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter relative z-10">
          Digital Land <span className="text-cyan-500 underline decoration-zinc-800">Deed</span>
        </h1>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mt-4 italic">Registry_Node_v4.0.1</p>
      </div>

      <div className="w-full max-w-2xl space-y-10 relative z-10">
        
        {/* IDENTITY VERIFICATION MODULE */}
        <div className={`p-10 rounded-[48px] border-2 transition-all duration-700 ${isVerified ? 'border-green-500/50 bg-green-500/5 shadow-[0_0_50px_rgba(34,197,94,0.1)]' : 'border-white/5 bg-zinc-950/50 backdrop-blur-3xl'}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 italic ${isVerified ? 'text-green-500' : 'text-zinc-400'}`}>
              <Fingerprint size={20} />
              {isVerified ? "Identity_Bonded_Success" : "Protocol_Identity_Match"}
            </h2>
          </div>

          {!isVerified ? (
            <div className="space-y-6">
              <input 
                type="text" 
                maxLength="12"
                placeholder="0000 0000 0000"
                className="w-full bg-black/50 border border-zinc-800 p-6 rounded-3xl text-cyan-400 font-mono text-2xl tracking-[0.4em] outline-none focus:border-cyan-500 transition-all text-center"
                onChange={(e) => setInputAadhaar(e.target.value.replace(/\D/g, ''))}
              />
              <button 
                onClick={handleVerifyAadhaar}
                disabled={verifying}
                className="w-full py-6 bg-white text-black hover:bg-cyan-500 hover:text-white font-black rounded-[24px] uppercase text-[11px] tracking-[0.4em] transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
              >
                {verifying ? "Searching Ledger..." : "Execute_Match_Logic"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 py-4">
              <CheckCircle className="text-green-500 animate-bounce" size={24} />
              <p className="text-[11px] text-green-500 font-black uppercase tracking-widest italic">Encrypted Connection Established</p>
            </div>
          )}
        </div>

        {/* ASSET REGISTRATION FORM */}
        <div className={`transition-all duration-1000 ${!isVerified ? 'opacity-5 blur-xl pointer-events-none scale-95' : 'opacity-100 blur-0 scale-100'}`}>
          <div className="bg-[#080808] border border-white/10 p-12 rounded-[64px] shadow-3xl">
            <form onSubmit={handleRegister} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="State/Region" required className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-xs font-bold uppercase tracking-widest" onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                <input type="text" placeholder="Plot_Index (Khasra)" required className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-xs font-bold uppercase tracking-widest" onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })} />
              </div>

              <input type="text" placeholder="Legal Full Name of Owner" required className="w-full bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-xs font-bold uppercase tracking-widest" onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />

              <div className="grid grid-cols-2 gap-6">
                <div onClick={() => document.getElementById('img-up').click()} className="border-2 border-dashed border-zinc-800 p-10 rounded-[40px] text-center cursor-pointer hover:border-cyan-500 group transition-all bg-zinc-900/20">
                  <input id="img-up" type="file" multiple hidden accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} />
                  <UploadCloud className="mx-auto mb-3 text-zinc-700 group-hover:text-cyan-500 group-hover:scale-125 transition-transform" />
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">{images.length > 0 ? `${images.length}_Files_Ready` : "Upload_Photos"}</p>
                </div>
                <div onClick={() => document.getElementById('doc-up').click()} className="border-2 border-dashed border-zinc-800 p-10 rounded-[40px] text-center cursor-pointer hover:border-cyan-500 group transition-all bg-zinc-900/20">
                  <input id="doc-up" type="file" hidden accept=".pdf" onChange={(e) => setDocFile(e.target.files[0])} />
                  <FileText className="mx-auto mb-3 text-zinc-700 group-hover:text-cyan-500 group-hover:scale-125 transition-transform" />
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic">{docFile ? "Deed_Anchored" : "Upload_Deed"}</p>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-8 bg-cyan-600 text-white font-black text-xs rounded-[32px] tracking-[0.5em] uppercase hover:bg-white hover:text-black transition-all shadow-[0_20px_50px_rgba(8,145,178,0.2)] active:scale-95 disabled:opacity-20">
                {isSubmitting ? "Syncing_to_Ledger..." : "Execute_Deed_Finalization"}
              </button>
              
              {status && <p className="text-center text-cyan-500 text-[10px] font-black animate-pulse uppercase tracking-[0.3em] italic underline decoration-zinc-800">{status}</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register_Asset;