import { useState } from "react";
import { ethers } from "ethers";
import { Lock, CheckCircle, UploadCloud, FileText, Fingerprint } from "lucide-react"; 

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

  // 🛠️ Step 1: Aadhaar Match Karne Wala Function
  const handleVerifyAadhaar = async () => {
    if (inputAadhaar.length !== 12) return alert("Please enter a 12-digit Aadhaar number.");
    
    try {
      setVerifying(true);
      const provider = isLocalhost 
        ? new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
        : new ethers.providers.Web3Provider(window.ethereum);

      const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      // Contract se current wallet ka linked Aadhaar Hash mangwana
      const storedHash = await contract.walletToIdentity(smartAccountAddress);
      
      // Input Aadhaar ka hash banana taaki match kar sakein
      const inputHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(inputAadhaar));

      if (storedHash === inputHash) {
        setIsVerified(true);
        alert("✅ Identity Matched! Form Unlocked.");
      } else {
        alert("❌ Mismatch: Ye Aadhaar is wallet se link nahi hai.");
      }
    } catch (err) {
      console.error(err);
      alert("Error: Pehle Register page par jaakar identity link karein.");
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setStatus("Step 1: Uploading Documents to IPFS...");

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
        document: docUrl 
      };

      const metadataURL = await uploadJSONToIPFS(metadata);

      setStatus("Step 2: Syncing with Blockchain...");
      const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, smartAccount);
      
      // Contract v4 calls with 2 params
      const tx = await contract.requestRegistration(
        formData.ownerName, 
        metadataURL, 
        { value: ethers.utils.parseEther("0.001") }
      );

      await tx.wait();
      setStatus("🎉 Property Registered Successfully!");
    } catch (err) { 
      console.error(err);
      alert("Transaction Failed: " + (err.reason || "Check Balance/Registration"));
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <section className="min-h-screen bg-black text-white p-8 font-sans flex flex-col items-center">
      
      <div className="w-full max-w-4xl text-center mt-10 mb-12">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">
          Asset <span className="text-cyan-500">Registry</span>
        </h1>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        
        {/* --- IDENTITY VERIFICATION UI --- */}
        <div className={`p-8 rounded-[40px] border-2 transition-all duration-500 ${isVerified ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-zinc-950'}`}>
          <div className="flex items-center gap-4 mb-6">
            <Fingerprint className={isVerified ? "text-green-500" : "text-cyan-500"} />
            <h2 className="text-sm font-black uppercase tracking-widest italic">
              {isVerified ? "Identity Linked" : "Verify Aadhaar to Unlock"}
            </h2>
          </div>

          {!isVerified ? (
            <div className="space-y-4">
              <input 
                type="text" 
                maxLength="12"
                placeholder="ENTER 12-DIGIT AADHAAR"
                className="w-full bg-black border border-zinc-800 p-5 rounded-2xl text-cyan-400 font-mono text-xl tracking-widest outline-none focus:border-cyan-500"
                onChange={(e) => setInputAadhaar(e.target.value.replace(/\D/g, ''))}
              />
              <button 
                onClick={handleVerifyAadhaar}
                disabled={verifying}
                className="w-full py-5 bg-white text-black hover:bg-cyan-500 hover:text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.3em] transition-all"
              >
                {verifying ? "Searching Ledger..." : "Match Identity"}
              </button>
            </div>
          ) : (
            <p className="text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle size={16} /> Access Granted. You can now fill the details.
            </p>
          )}
        </div>

        {/* --- REGISTRATION FORM (Unlocked only if verified) --- */}
        <div className={`transition-all duration-700 ${!isVerified ? 'opacity-20 pointer-events-none grayscale' : 'opacity-100'}`}>
          <div className="bg-zinc-950 border border-white/5 p-10 rounded-[56px] shadow-2xl">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="State" required className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                <input type="text" placeholder="Khasra Number" required className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })} />
              </div>

              <input type="text" placeholder="Legal Owner Name" required className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />

              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => document.getElementById('img-up').click()} className="border-2 border-dashed border-zinc-800 p-6 rounded-2xl text-center cursor-pointer hover:border-cyan-500">
                  <input id="img-up" type="file" multiple hidden accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} />
                  <UploadCloud className="mx-auto mb-1 text-zinc-700" />
                  <p className="text-[9px] font-black text-zinc-500 uppercase">{images.length > 0 ? `${images.length} Photos` : "Photos"}</p>
                </div>
                <div onClick={() => document.getElementById('doc-up').click()} className="border-2 border-dashed border-zinc-800 p-6 rounded-2xl text-center cursor-pointer hover:border-cyan-500">
                  <input id="doc-up" type="file" hidden accept=".pdf" onChange={(e) => setDocFile(e.target.files[0])} />
                  <FileText className="mx-auto mb-1 text-zinc-700" />
                  <p className="text-[9px] font-black text-zinc-500 uppercase">{docFile ? "Deed Loaded" : "Upload Deed"}</p>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-cyan-600 text-white font-black text-xs rounded-[24px] tracking-widest uppercase hover:bg-cyan-500 transition-all shadow-lg active:scale-95">
                {isSubmitting ? "Syncing..." : "Finalize Registration"}
              </button>
              
              {status && <p className="text-center text-cyan-500 text-[10px] font-black animate-pulse uppercase">{status}</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register_Asset;