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

// --- Formats for search and icons ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
  const [images, setImages] = useState([]); // Array of 3 files
  const [docFile, setDocFile] = useState(null); // Single PDF/Doc
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [ipfsLink, setIpfsLink] = useState(""); 
  const [txHash, setTxHash] = useState("");

  // Logic for Govt Ownership
  useEffect(() => {
    if (registrationPurpose === "Government") {
      setFormData(prev => ({ ...prev, ownerName: "Government of India" }));
    } else {
      setFormData(prev => ({ ...prev, ownerName: "" }));
    }
  }, [registrationPurpose]);

  const handleHierarchicalSearch = async () => {
    const query = `${formData.village}, ${formData.district}, ${formData.state}, India`;
    if (!formData.state) return alert("Please enter at least the State name.");
    
    setStatus("Searching Area...");
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        setCoordinates({ lat, lng });
        setIsLocationSelected(true);
        setStatus("Location Pinned ✅");
      } else {
        alert("Area not found. Please pinpoint manually on map.");
      }
    } catch (error) {
      console.error(error);
    } finally { setStatus(null); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (images.length !== 3) return alert("Please upload exactly 3 property images.");
    if (!docFile) return alert("Please upload the property document (PDF).");
    if (!isLocationSelected) return alert("Please locate the property on map.");
    
    try {
      setIsSubmitting(true);
      setStatus("Uploading Assets to IPFS...");
      
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
        location: coordinates,
        timestamp: new Date().toISOString()
      };

      const metadataURL = await uploadJSONToIPFS(metadata);
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      setStatus("Confirming on Blockchain...");
      const tx = await contract.requestRegistration(
        formData.ownerName, metadataURL, id(formData.aadhaar), formData.area.toString(), formData.address,
        { value: parseEther("0.001") }
      );

      setStatus("Mining Transaction...");
      await tx.wait();
      
      setIpfsLink(metadataURL);
      setTxHash(tx.hash);
      setStatus("✅ Successfully Registered!");
    } catch (err) {
      setStatus("❌ Error: " + (err.reason || err.message));
    } finally { setIsSubmitting(false); }
  };

  return (
    <section className="relative flex items-start justify-center px-4 md:px-8 py-20 min-h-screen bg-black text-white overflow-x-hidden">
      
      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12">
        
        {/* LEFT SIDE: Proofs & Links (Sticky for Desktop) */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit w-full order-2 lg:order-1">
          <div className="text-left">
            <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">Propertix Protocol</p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Immutable Land <span className="text-cyan-400">Registry</span></h1>
          </div>

          {(ipfsLink || txHash) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-5 w-full">
              <div className="p-4 bg-zinc-900/80 border border-emerald-500/30 rounded-2xl overflow-hidden">
                <p className="text-[9px] font-bold text-emerald-400 uppercase mb-2">🌍 IPFS Digital Certificate</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500 truncate flex-1">{ipfsLink}</span>
                  <a href={ipfsLink} target="_blank" rel="noreferrer" className="text-[9px] bg-emerald-600 px-3 py-1.5 rounded font-bold whitespace-nowrap">VIEW</a>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/80 border border-cyan-500/30 rounded-2xl overflow-hidden">
                <p className="text-[9px] font-bold text-cyan-400 uppercase mb-2">🔗 Transaction Proof (Hash)</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500 truncate flex-1">{txHash}</span>
                  <button onClick={() => navigator.clipboard.writeText(txHash)} className="text-[9px] bg-cyan-600 px-3 py-1.5 rounded font-bold whitespace-nowrap">COPY</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Form (Full Responsive) */}
        <div className="w-full bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-5 md:p-8 rounded-3xl shadow-3xl order-1 lg:order-2">
          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Purpose Switch */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 rounded-xl border border-zinc-800">
              {["Ownership", "Government"].map((p) => (
                <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                  className={`py-3 text-[10px] font-bold rounded-lg transition-all ${registrationPurpose === p ? "bg-cyan-600 text-white shadow-lg" : "text-gray-500"}`}>
                  {p === "Ownership" ? "PRIVATE CLAIM" : "GOVT ALLOCATION"}
                </button>
              ))}
            </div>

            {/* Hierarchical Search Section */}
            <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-zinc-800">
              <label className="text-[10px] uppercase text-cyan-500 font-black">Locate Property Area</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input type="text" placeholder="State" className="bg-zinc-900 text-xs p-3 rounded-xl border border-zinc-700 w-full" onChange={(e)=>setFormData({...formData, state: e.target.value})} />
                <input type="text" placeholder="District" className="bg-zinc-900 text-xs p-3 rounded-xl border border-zinc-700 w-full" onChange={(e)=>setFormData({...formData, district: e.target.value})} />
                <input type="text" placeholder="Village" className="bg-zinc-900 text-xs p-3 rounded-xl border border-zinc-700 w-full" onChange={(e)=>setFormData({...formData, village: e.target.value})} />
              </div>
              <button type="button" onClick={handleHierarchicalSearch} className="w-full bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all uppercase">Find on Map</button>
            </div>

            {/* Map Container */}
            <div className="h-48 md:h-60 rounded-2xl overflow-hidden border border-zinc-800 z-0">
               <MapContainer center={coordinates} zoom={13} style={{height: '100%', width: '100%'}}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController coords={coordinates} />
                  <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
               </MapContainer>
            </div>

            {/* Owner & Aadhaar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Owner Full Name" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-black/40 border border-zinc-800 p-3.5 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all disabled:opacity-50" onChange={(e)=>setFormData({...formData, ownerName: e.target.value})} />
              <input type="text" placeholder="Aadhaar Number" className="w-full bg-black/40 border border-zinc-800 p-3.5 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all" onChange={(e)=>setFormData({...formData, aadhaar: e.target.value})} />
            </div>

            <textarea placeholder="Exact Address & Landmarks" className="w-full bg-black/40 border border-zinc-800 p-3.5 rounded-xl text-xs h-20 resize-none outline-none focus:border-cyan-500 transition-all" onChange={(e)=>setFormData({...formData, address: e.target.value})} />
            
            <input type="number" placeholder="Total Area (Sq Ft)" className="w-full bg-black/40 border border-zinc-800 p-3.5 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all" onChange={(e)=>setFormData({...formData, area: e.target.value})} />

            {/* Upload Section - Grid for Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div onClick={()=>document.getElementById('img-up').click()} className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer transition-all ${images.length === 3 ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 hover:border-cyan-500"}`}>
                <input id="img-up" type="file" multiple hidden onChange={(e)=>setImages(Array.from(e.target.files).slice(0,3))} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{images.length === 3 ? "✅ 3 Photos Uploaded" : "📸 Upload 3 Photos"}</p>
              </div>
              <div onClick={()=>document.getElementById('doc-up').click()} className={`border-2 border-dashed p-4 rounded-xl text-center cursor-pointer transition-all ${docFile ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 hover:border-cyan-500"}`}>
                <input id="doc-up" type="file" hidden onChange={(e)=>setDocFile(e.target.files[0])} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{docFile ? "✅ Document Ready" : "📄 Upload Land PDF"}</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-4.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[11px] rounded-xl tracking-[0.3em] uppercase transition-all shadow-2xl disabled:opacity-50">
              {isSubmitting ? "Syncing to Blockchain..." : "Register Property (0.001 ETH)"}
            </button>

            {status && <div className="text-[10px] text-center font-bold text-cyan-400 animate-pulse">{status}</div>}
          </form>
        </div>
      </div>
    </section>
  );
};

// --- Helper Components for Leaflet ---
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