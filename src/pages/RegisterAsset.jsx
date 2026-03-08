import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ShieldAlert, MapPin, Database, CheckCircle, FileText, UploadCloud, Lock } from "lucide-react"; 

import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";
import { useSmartAccount } from "../context/SmartAccountContext.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../utils/ipfs.js";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const Register_Asset = () => {
  const { smartAccount, smartAccountAddress, isLocalhost } = useSmartAccount();
  
  const [inputAadhaar, setInputAadhaar] = useState(""); // UI wala Aadhaar input
  const [isVerified, setIsVerified] = useState(false); // Matching status
  
  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [formData, setFormData] = useState({
    state: "", district: "", village: "", ownerName: "", 
    area: "", address: "", khasraNumber: "" 
  });

  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [images, setImages] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  // 🛠️ LOGIC: Aadhaar Match Karne Wala Function
  const verifyIdentity = async () => {
    if (inputAadhaar.length !== 12) return alert("Enter 12-digit Aadhaar");
    
    try {
      setStatus("Verifying Identity with Blockchain Ledger...");
      
      const provider = isLocalhost 
        ? new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
        : new ethers.providers.Web3Provider(window.ethereum);

      const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      // Contract se stored hash nikalna [cite: 2026-03-01]
      const storedHash = await contract.walletToIdentity(smartAccountAddress);
      
      // Input wale Aadhaar ka hash banana
      const inputHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(inputAadhaar));

      if (storedHash === inputHash) {
        setIsVerified(true);
        alert("✅ Identity Matched! You can now register the property.");
      } else {
        alert("❌ Aadhaar Mismatch! Please use the Aadhaar linked with this wallet.");
      }
    } catch (err) {
      console.error(err);
      alert("Error: Ensure you have registered your identity first.");
    } finally {
      setStatus(null);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isVerified) return alert("Please verify your Aadhaar first.");
    if (images.length < 1 || !docFile) return alert("Upload required files.");

    try {
      setIsSubmitting(true);
      setStatus("Uploading Assets to IPFS...");

      // IPFS Upload Logic [cite: 2026-01-24]
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
        location: coordinates
      };

      const metadataURL = await uploadJSONToIPFS(metadata);

      setStatus("Syncing with Smart Contract...");

      // Contract Call (v4 logic: ownerName, metadataURL) [cite: 2026-01-24]
      const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, smartAccount);
      const tx = await contract.requestRegistration(
        formData.ownerName, 
        metadataURL, 
        { value: ethers.utils.parseEther("0.001") }
      );

      await tx.wait();
      setStatus("🎉 Property Registered Successfully!");
      alert("Zameen ka record blockchain par save ho gaya hai!");

    } catch (err) { 
      console.error(err);
      alert("Registration Failed: " + (err.reason || "Blockchain Reverted"));
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <section className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto mt-10">
        <h1 className="text-5xl font-black uppercase italic italic tracking-tighter mb-10">
          Property <span className="text-cyan-500">Registry Node</span>
        </h1>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* LEFT: Identity Verification UI */}
          <div className="space-y-6">
            <div className={`p-8 rounded-[40px] border transition-all ${isVerified ? 'border-green-500 bg-green-500/5' : 'border-cyan-500/20 bg-zinc-900/50'}`}>
              <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-3">
                <Lock className={isVerified ? "text-green-500" : "text-cyan-500"} />
                Identity Bonding
              </h2>
              
              {!isVerified ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Confirm Aadhaar linked to this wallet</p>
                  <input 
                    type="text" 
                    maxLength="12"
                    placeholder="ENTER 12-DIGIT AADHAAR"
                    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-cyan-500 font-bold tracking-widest outline-none focus:border-cyan-500"
                    onChange={(e) => setInputAadhaar(e.target.value)}
                  />
                  <button 
                    onClick={verifyIdentity}
                    className="w-full py-4 bg-cyan-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-cyan-500 transition-all"
                  >
                    Match Identity
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-green-500 font-black uppercase text-xs">
                  <CheckCircle size={20} /> Identity Verified & Locked
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Registration Form (Disabled until verified) */}
          <div className={`transition-opacity duration-500 ${!isVerified ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="bg-zinc-950 border border-white/10 p-10 rounded-[48px]">
              <form onSubmit={handleRegister} className="space-y-6">
                <input 
                  type="text" 
                  placeholder="Official Owner Name" 
                  required 
                  className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs"
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Khasra No." required className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })} />
                  <input type="number" placeholder="Area (SqFt)" required className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
                </div>

                {/* Upload Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => document.getElementById('img-up').click()} className="border-2 border-dashed border-zinc-800 p-6 rounded-2xl text-center cursor-pointer hover:border-cyan-500">
                    <input id="img-up" type="file" multiple hidden accept="image/*" onChange={(e) => setImages(Array.from(e.target.files))} />
                    <UploadCloud className="mx-auto mb-1 text-zinc-600" />
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Property Photos</p>
                  </div>
                  <div onClick={() => document.getElementById('doc-up').click()} className="border-2 border-dashed border-zinc-800 p-6 rounded-2xl text-center cursor-pointer hover:border-cyan-500">
                    <input id="doc-up" type="file" hidden accept=".pdf" onChange={(e) => setDocFile(e.target.files[0])} />
                    <FileText className="mx-auto mb-1 text-zinc-600" />
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">Legal Deed</p>
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-white text-black font-black text-[10px] rounded-2xl tracking-[0.3em] uppercase hover:bg-cyan-500 transition-all">
                  {isSubmitting ? "SYNCING..." : "REGISTER ASSET"}
                </button>
                {status && <p className="text-center text-cyan-500 text-[9px] font-black animate-pulse">{status}</p>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register_Asset;