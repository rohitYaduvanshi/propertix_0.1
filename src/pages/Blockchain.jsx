import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther, id } from "ethers"; 
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../utils/ipfs.js";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Blockchain = () => {
  const { isWalletConnected } = useAuth();
  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [formData, setFormData] = useState({
    state: "", district: "", village: "", aadhaar: "",
    ownerName: "", area: "", address: "", description: ""
  });

  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [images, setImages] = useState([]); 
  const [docFile, setDocFile] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    if (registrationPurpose === "Government") {
      setFormData(prev => ({ ...prev, ownerName: "Government of India" }));
    } else {
      setFormData(prev => ({ ...prev, ownerName: "" }));
    }
  }, [registrationPurpose]);

  const handleHierarchicalSearch = async () => {
    const query = `${formData.village}, ${formData.district}, ${formData.state}, India`;
    if (!formData.state) return alert("Please enter the State.");
    setStatus("Searching Area...");
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        setCoordinates({ lat, lng });
        setIsLocationSelected(true);
        setStatus("Pinned ✅");
      } else { alert("Not found. Pin manually."); }
    } catch (e) { console.error(e); }
    finally { setStatus(null); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (images.length !== 3 || !docFile) return alert("Upload 3 images and 1 document.");
    try {
      setIsSubmitting(true);
      setStatus("Uploading Assets...");
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadFileToIPFS(img);
        imageUrls.push(url);
      }
      const docUrl = await uploadFileToIPFS(docFile);
      const metadata = { ...formData, purpose: registrationPurpose, images: imageUrls, document: docUrl, location: coordinates };
      const metadataURL = await uploadJSONToIPFS(metadata);
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      const tx = await contract.requestRegistration(
        formData.ownerName, metadataURL, id(formData.aadhaar), formData.area.toString(), formData.address,
        { value: parseEther("0.001") }
      );
      
      setStatus("Mining Transaction...");
      await tx.wait();
      
      setTxHash(tx.hash);
      setStatus("✅ Registered Successfully!");
    } catch (err) { setStatus("❌ Error: " + (err.reason || err.message)); }
    finally { setIsSubmitting(false); }
  };

  return (
    // 🌌 NEW BACKGROUND DESIGN: Simple clean look matching crop image
    <section className="relative flex flex-col items-center px-4 md:px-8 py-20 min-h-screen bg-[#000000] text-white overflow-hidden">
      
      {/* 🟦 FLOATING SQUARES (Matches your crop image design) */}
      <div className="absolute inset-0 pointer-events-none z-0">
          {/* Subtle Glows */}
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full"></div>
          
          {/* The "Shocking" Square Border from Image */}
          <div className="absolute top-[15%] left-[5%] w-72 h-80 border border-cyan-500/20 rounded-[40px] rotate-[-10deg]"></div>
          <div className="absolute top-[18%] left-[8%] w-72 h-80 border border-white/5 rounded-[40px] rotate-[-5deg]"></div>
      </div>

      <div className="w-full max-w-6xl mb-12 text-center lg:text-left relative z-10">
        <p className="text-[11px] font-bold tracking-[0.4em] text-cyan-400 uppercase mb-6">REGISTER ON-CHAIN</p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
          Register a new <br/>
          <span className="text-cyan-400">verified property record</span>
        </h1>
        <p className="text-sm text-gray-400 mt-6 font-medium">Store details securely on IPFS & Blockchain. (Fee: 0.001 ETH)</p>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-start z-10">
        
        {/* LEFT SIDE: Placeholder for image content or guidelines */}
        <div className="hidden lg:block space-y-6 w-full order-2 lg:order-1">
             {txHash && (
                <div className="p-6 bg-zinc-900/60 border border-cyan-500/30 rounded-[32px] backdrop-blur-xl animate-in fade-in zoom-in">
                    <p className="text-[10px] font-black text-cyan-400 uppercase mb-3 tracking-widest">🔗 Ledger Transaction Secured</p>
                    <div className="flex items-center gap-2 bg-black/60 p-3 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-mono text-zinc-400 flex-1 truncate">{txHash}</span>
                        <button onClick={() => navigator.clipboard.writeText(txHash)} className="text-[10px] bg-cyan-600 px-4 py-2 rounded-xl font-black text-white">COPY</button>
                    </div>
                </div>
             )}
        </div>

        {/* RIGHT SIDE: THE FORM CARD */}
        <div className="w-full bg-[#0d0d0d] border border-white/10 p-6 md:p-10 rounded-[32px] shadow-2xl order-1 lg:order-2">
          <h2 className="text-xl font-bold mb-8">Property Registration Form</h2>
          
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest ml-1">Select Purpose</label>
                <div className="flex p-1 bg-black/40 rounded-2xl border border-zinc-800">
                {["Ownership", "Government"].map((p) => (
                    <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                    className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all uppercase ${registrationPurpose === p ? "bg-cyan-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}>
                    {p === "Ownership" ? "Ownership Claim" : "Government"}
                    </button>
                ))}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold ml-1">Aadhaar Number (Confidential)</label>
                <input type="password" placeholder="XXXX-XXXX-XXXX" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-cyan-500 transition-all" onChange={(e)=>setFormData({...formData, aadhaar: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold ml-1">Owner Name</label>
                <input type="text" placeholder="e.g. Rohit Kumar" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-cyan-500 disabled:opacity-30" onChange={(e)=>setFormData({...formData, ownerName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase text-gray-500 font-bold ml-1">Property Type</label>
                <select className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-cyan-500 text-gray-400">
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Agricultural</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase text-cyan-400 font-black tracking-widest ml-1">Pin Exact Location</label>
              <div className="relative flex gap-2">
                <input type="text" placeholder="Search address (e.g. Patna, Bihar)..." className="flex-1 bg-black/40 border border-zinc-800 p-4 rounded-xl text-sm outline-none" onChange={(e)=>setFormData({...formData, address: e.target.value})} />
                <button type="button" onClick={handleHierarchicalSearch} className="bg-zinc-800 px-4 rounded-xl text-[10px] font-bold">Find</button>
                <div className="bg-cyan-500/20 p-3 rounded-xl border border-cyan-500/50 flex items-center text-cyan-400">📍</div>
              </div>
              
              <div className="h-64 rounded-2xl overflow-hidden border border-zinc-800 shadow-xl relative">
                <MapContainer center={coordinates} zoom={13} style={{height: '100%', width: '100%'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController coords={coordinates} />
                    <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
                    {isLocationSelected && <Marker position={[coordinates.lat, coordinates.lng]} />}
                </MapContainer>
                <div className="absolute top-4 right-4 z-[1000]">
                    <div className="bg-black/80 px-3 py-1 rounded-full text-[9px] font-black text-yellow-500 border border-yellow-500/30 uppercase tracking-widest">
                        {isLocationSelected ? "● Pinned" : "○ Unpinned"}
                    </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div onClick={()=>document.getElementById('img-up').click()} className="border-2 border-dashed border-zinc-800 p-4 rounded-2xl text-center cursor-pointer hover:border-cyan-500/50 transition-all">
                <input id="img-up" type="file" multiple hidden onChange={(e)=>setImages(Array.from(e.target.files).slice(0,3))} />
                <p className="text-[9px] font-black text-gray-500 uppercase">{images.length === 3 ? "✅ 3 Images Ready" : "📸 Upload 3 Photos"}</p>
              </div>
              <div onClick={()=>document.getElementById('doc-up').click()} className="border-2 border-dashed border-zinc-800 p-4 rounded-2xl text-center cursor-pointer hover:border-cyan-500/50 transition-all">
                <input id="doc-up" type="file" hidden onChange={(e)=>setDocFile(e.target.files[0])} />
                <p className="text-[9px] font-black text-gray-500 uppercase">{docFile ? "✅ PDF Ready" : "📄 Legal PDF Doc"}</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-white text-black font-black text-xs rounded-2xl uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all active:scale-[0.98] disabled:opacity-50">
              {isSubmitting ? "Syncing..." : "Submit to Ledger"}
            </button>

            {status && (
                <div className="text-[10px] text-center font-bold text-cyan-400 animate-pulse uppercase tracking-widest">
                    {status}
                </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

const MapController = ({ coords }) => {
  const map = useMap();
  useEffect(() => { if (coords) map.setView([coords.lat, coords.lng], 16); }, [coords, map]);
  return null;
};

const LocationMarker = ({ setCoords, setIsSelected }) => {
  useMapEvents({ click(e) { setCoords(e.latlng); setIsSelected(true); } });
  return null;
};

export default Blockchain;