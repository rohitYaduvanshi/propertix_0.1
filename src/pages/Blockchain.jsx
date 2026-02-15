import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther, id } from "ethers"; 
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../utils/ipfs.js";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const Blockchain = () => {
  const { isWalletConnected } = useAuth();
  
  // --- Form States ---
  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [formData, setFormData] = useState({
    state: "", district: "", village: "", aadhaar: "",
    ownerName: "", area: "", address: "", description: ""
  });

  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [images, setImages] = useState([]); // Must be 3
  const [docFile, setDocFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [ipfsLink, setIpfsLink] = useState(""); 
  const [txHash, setTxHash] = useState("");

  // Auto-set owner for Govt
  useEffect(() => {
    if (registrationPurpose === "Government") {
      setFormData(prev => ({ ...prev, ownerName: "Government of India" }));
    } else {
      setFormData(prev => ({ ...prev, ownerName: "" }));
    }
  }, [registrationPurpose]);

  const handleHierarchicalSearch = async () => {
    const query = `${formData.village}, ${formData.district}, ${formData.state}, India`;
    if (!formData.state) return alert("State field is mandatory!");
    setStatus("Locating...");
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        setCoordinates({ lat, lng });
        setIsLocationSelected(true);
      }
    } catch (e) { console.error(e); }
    finally { setStatus(null); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (images.length !== 3) return alert("Please upload exactly 3 images.");
    if (!docFile) return alert("Please upload the document file.");
    
    try {
      setIsSubmitting(true);
      setStatus("Uploading Assets...");
      
      // Upload all 3 images
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadFileToIPFS(img);
        imageUrls.push(url);
      }
      const docUrl = await uploadFileToIPFS(docFile);

      const metadata = {
        ...formData,
        purpose: registrationPurpose,
        images: imageUrls,
        document: docUrl,
        coords: coordinates
      };

      const metadataURL = await uploadJSONToIPFS(metadata);
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      const tx = await contract.requestRegistration(
        formData.ownerName, metadataURL, id(formData.aadhaar), formData.area.toString(), formData.address,
        { value: parseEther("0.001") }
      );

      setStatus("Confirming Transaction...");
      await tx.wait();
      
      setIpfsLink(metadataURL);
      setTxHash(tx.hash);
      setStatus("✅ Registered Successfully!");
    } catch (err) {
      setStatus("❌ Failed: " + (err.reason || err.message));
    } finally { setIsSubmitting(false); }
  };

  return (
    // Fixed Responsive Section: items-start and overflow-x-hidden to prevent cutting
    <section className="relative flex items-start justify-center px-4 md:px-8 py-20 min-h-screen bg-black text-white overflow-x-hidden">
      
      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Left Side: Proofs */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit w-full">
          <div className="text-left">
            <p className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">Propertix v2.0</p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Secure Land <span className="text-cyan-400">Ledger</span></h1>
          </div>

          {(ipfsLink || txHash) && (
            <div className="space-y-3 w-full animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 bg-zinc-900/80 border border-emerald-500/30 rounded-2xl overflow-hidden">
                <p className="text-[9px] font-bold text-emerald-400 mb-2">🌍 IPFS METADATA LINK</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-gray-500 truncate flex-1">{ipfsLink}</span>
                  <a href={ipfsLink} target="_blank" className="text-[9px] bg-emerald-600 px-3 py-1.5 rounded font-bold">VIEW</a>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-cyan-500/30 rounded-2xl overflow-hidden">
                <p className="text-[9px] font-bold text-cyan-400 mb-2">🔗 TRANSACTION HASH</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-gray-500 truncate flex-1">{txHash}</span>
                  <button onClick={() => navigator.clipboard.writeText(txHash)} className="text-[9px] bg-cyan-600 px-3 py-1.5 rounded font-bold">COPY</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Form (Fully Responsive) */}
        <div className="w-full bg-zinc-900/30 backdrop-blur-xl border border-white/5 p-5 md:p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Purpose Switch */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 rounded-xl border border-zinc-800">
              {["Ownership", "Government"].map((p) => (
                <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                  className={`py-2.5 text-[10px] font-bold rounded-lg transition-all ${registrationPurpose === p ? "bg-cyan-600 text-white" : "text-gray-500"}`}>
                  {p === "Ownership" ? "PRIVATE CLAIM" : "GOVT ALLOCATION"}
                </button>
              ))}
            </div>

            {/* Step-by-Step Location */}
            <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-zinc-800">
              <p className="text-[10px] text-cyan-500 font-black">LOCATE AREA (INDIA)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input type="text" placeholder="State" className="bg-zinc-900 text-xs p-3 rounded-xl border border-zinc-700 w-full" onChange={(e)=>setFormData({...formData, state: e.target.value})} />
                <input type="text" placeholder="District" className="bg-zinc-900 text-xs p-3 rounded-xl border border-zinc-700 w-full" onChange={(e)=>setFormData({...formData, district: e.target.value})} />
                <input type="text" placeholder="Village" className="bg-zinc-900 text-xs p-3 rounded-xl border border-zinc-700 w-full" onChange={(e)=>setFormData({...formData, village: e.target.value})} />
              </div>
              <button type="button" onClick={handleHierarchicalSearch} className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all">LOCATE ON MAP</button>
            </div>

            {/* Map Container - Responsive Height */}
            <div className="h-48 md:h-60 rounded-2xl overflow-hidden border border-zinc-800">
               <MapContainer center={coordinates} zoom={13} style={{height: '100%', width: '100%'}}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController coords={coordinates} />
                  <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
               </MapContainer>
            </div>

            {/* Other Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold ml-1">OWNER NAME</label>
                <input type="text" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs" onChange={(e)=>setFormData({...formData, ownerName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold ml-1">AADHAAR NUMBER</label>
                <input type="text" placeholder="XXXX-XXXX-XXXX" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs" onChange={(e)=>setFormData({...formData, aadhaar: e.target.value})} />
              </div>
            </div>

            <textarea placeholder="Property Address & Description" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs h-20 resize-none" onChange={(e)=>setFormData({...formData, address: e.target.value})} />
            
            <input type="number" placeholder="Area (Sq Ft)" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs" onChange={(e)=>setFormData({...formData, area: e.target.value})} />

            {/* File Upload Section - Responsive Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div onClick={()=>document.getElementById('img-up').click()} className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer transition-all ${images.length === 3 ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 hover:border-cyan-500"}`}>
                <input id="img-up" type="file" multiple hidden onChange={(e)=>setImages(Array.from(e.target.files).slice(0,3))} />
                <p className="text-[9px] font-bold">{images.length === 3 ? "✅ 3 PHOTOS READY" : "📸 UPLOAD 3 PHOTOS"}</p>
              </div>
              <div onClick={()=>document.getElementById('doc-up').click()} className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer transition-all ${docFile ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 hover:border-cyan-500"}`}>
                <input id="doc-up" type="file" hidden onChange={(e)=>setDocFile(e.target.files[0])} />
                <p className="text-[9px] font-bold">{docFile ? "✅ DOCUMENT READY" : "📄 UPLOAD PDF DOC"}</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[11px] rounded-xl tracking-[0.2em] transition-all shadow-xl disabled:opacity-50">
              {isSubmitting ? "PROCESSING TRANSACTION..." : "SUBMIT APPLICATION (0.001 ETH)"}
            </button>

            {status && <div className="text-[10px] text-center font-bold text-cyan-400 animate-pulse">{status}</div>}
          </form>
        </div>
      </div>
    </section>
  );
};

// --- Sub-Components ---
const MapController = ({ coords }) => {
  const map = useMap();
  useEffect(() => { if (coords) map.setView([coords.lat, coords.lng], 16); }, [coords]);
  return null;
};

const LocationMarker = ({ setCoords, setIsSelected }) => {
  useMapEvents({ click(e) { setCoords(e.latlng); setIsSelected(true); } });
  return null;
};

export default Blockchain;