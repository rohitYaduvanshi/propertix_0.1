import { useState, useEffect } from "react";
import { ShieldAlert, MapPin, Database, CheckCircle, FileText, UploadCloud } from "lucide-react"; 

import { useSmartAccount } from "../context/SmartAccountContext.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../utils/ipfs.js";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Map Icons Fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Register_Asset = () => {
  const { smartAccountAddress } = useSmartAccount(); // Login check ke liye
  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [formData, setFormData] = useState({
    state: "", district: "", village: "", ownerName: "", 
    area: "", address: "", khasraNumber: "" 
  });

  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [images, setImages] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState(""); 

  // Auto-fill owner name for Govt purpose
  useEffect(() => {
    if (registrationPurpose === "Government") {
      setFormData(prev => ({ ...prev, ownerName: "Government of India" }));
    }
  }, [registrationPurpose]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    if (files.length > 0) setImages(files);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Simple Validation
    if (images.length < 1 || !docFile) return alert("Please upload property photos and deed.");

    try {
      setIsSubmitting(true);
      setStatus("Step 1/2: Storing on IPFS Ledger...");

      // 1. Upload files to IPFS (Demo Mode) [cite: 2026-01-24]
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadFileToIPFS(img);
        imageUrls.push(url);
      }
      const docUrl = await uploadFileToIPFS(docFile);
      
      const metadata = { 
        ...formData, 
        requester: smartAccountAddress || "Demo_User",
        images: imageUrls, 
        document: docUrl, 
        location: coordinates
      };

      // 2. Metadata storage [cite: 2026-01-24]
      const metadataCID = await uploadJSONToIPFS(metadata);
      console.log("Record Anchored to IPFS:", metadataCID);

      setStatus("Step 2/2: Finalizing Registration...");
      
      // Delay for UI experience
      await new Promise(resolve => setTimeout(resolve, 1500));

      setTxHash("PROPTX_" + Math.random().toString(36).substring(7).toUpperCase());
      setStatus("🎉 Property Registered Successfully!");
      
      alert("Success! Your property data is now secured on IPFS. Demo registration complete.");

    } catch (err) { 
      console.error(err);
      alert("System Busy. Please check your Pinata API connection.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <section className="relative flex flex-col items-center px-4 md:px-8 py-8 min-h-screen bg-black text-white font-sans">
      
      {/* Page Header */}
      <div className="w-full max-w-6xl mb-12 mt-10 z-10">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">
          Property <span className="text-cyan-500">Registration</span>
        </h1>
        <p className="text-zinc-500 text-xs mt-2 font-bold uppercase tracking-widest italic">Digital Deed Management Node</p>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-12 z-10">
        
        {/* Status Display */}
        <div className="space-y-6">
          <div className="p-8 bg-zinc-900/50 border border-white/10 rounded-[40px] backdrop-blur-xl">
            <h2 className="text-lg font-black mb-6 uppercase tracking-tighter italic">Process Tracker</h2>
            <div className="space-y-6">
               <div className="flex gap-4">
                  <Database className="text-cyan-500" />
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Phase 1: Encrypted Storage (IPFS)</p>
               </div>
               <div className="flex gap-4">
                  <CheckCircle className="text-zinc-700" />
                  <p className="text-[10px] uppercase font-bold text-zinc-700">Phase 2: Registry Approval (Pending)</p>
               </div>
            </div>
          </div>
          
          {txHash && (
            <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-3xl">
              <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Record_ID: {txHash}</p>
            </div>
          )}
        </div>

        {/* The Form */}
        <div className="bg-zinc-950 border border-white/10 p-8 rounded-[48px]">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <input type="text" placeholder="State" required className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
               <input type="text" placeholder="Khasra No." required className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })} />
            </div>

            <input type="text" placeholder="Owner Name" value={formData.ownerName} className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs" onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
            
            <textarea placeholder="Property Address Details..." required className="w-full bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-xs h-24" onChange={(e) => setFormData({ ...formData, address: e.target.value })} />

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => document.getElementById('img-up').click()} className="border-2 border-dashed border-zinc-800 p-6 rounded-2xl text-center cursor-pointer hover:border-cyan-500 transition-all">
                <input id="img-up" type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                <UploadCloud className="mx-auto mb-1 text-zinc-600" />
                <p className="text-[9px] font-bold text-zinc-500 uppercase">Photos ({images.length})</p>
              </div>

              <div onClick={() => document.getElementById('doc-up').click()} className="border-2 border-dashed border-zinc-800 p-6 rounded-2xl text-center cursor-pointer hover:border-cyan-500 transition-all">
                <input id="doc-up" type="file" hidden accept=".pdf,image/*" onChange={(e) => setDocFile(e.target.files[0])} />
                <FileText className="mx-auto mb-1 text-zinc-600" />
                <p className="text-[9px] font-bold text-zinc-500 uppercase">{docFile ? "Deed Loaded" : "Upload Deed"}</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-white text-black font-black text-[10px] rounded-2xl tracking-[0.3em] uppercase hover:bg-cyan-500 transition-all active:scale-95">
              {isSubmitting ? "PROCESSING..." : "REGISTER PROPERTY"}
            </button>
            
            {status && <p className="text-center text-cyan-500 text-[9px] font-black animate-pulse">{status}</p>}
          </form>
        </div>
      </div>
    </section>
  );
};

// Map Helper components (Originals kept for UI)
const MapController = ({ coords }) => {
  const map = useMap();
  useEffect(() => { if (coords) map.setView([coords.lat, coords.lng], 16); }, [coords, map]);
  return null;
};
const LocationMarker = ({ setCoords, setIsSelected }) => {
  useMapEvents({ click(e) { setCoords(e.latlng); setIsSelected(true); } });
  return null;
};

export default Register_Asset;