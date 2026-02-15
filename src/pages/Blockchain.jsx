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
  const [ipfsLink, setIpfsLink] = useState(""); 
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
      await tx.wait();
      setIpfsLink(metadataURL);
      setTxHash(tx.hash);
      setStatus("✅ Registered Successfully!");
    } catch (err) { setStatus("❌ Error: " + (err.reason || err.message)); }
    finally { setIsSubmitting(false); }
  };

  return (
    <section className="relative flex flex-col items-center px-4 md:px-8 py-12 min-h-screen bg-black text-white overflow-x-hidden">
      
      {/* --- TOP TITLE TEXT --- */}
      <div className="w-full max-w-6xl mb-10 text-center lg:text-left">
        <p className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase mb-2">Immutable Protocol</p>
        <h1 className="text-3xl md:text-6xl font-black leading-tight">
          Propertix Land <span className="text-cyan-400">Ledger</span>
        </h1>
        <p className="text-gray-500 text-xs md:text-sm mt-2 font-medium">Verify ownership on Blockchain with Satellite Precision.</p>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        
        {/* LEFT SIDE: Proofs & Status */}
        <div className="space-y-6 w-full order-2 lg:order-1 lg:sticky lg:top-10">
          {(ipfsLink || txHash) ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-8">
              <div className="p-5 bg-zinc-900/60 border border-emerald-500/30 rounded-3xl backdrop-blur-xl">
                <p className="text-[10px] font-bold text-emerald-400 uppercase mb-3 tracking-tighter">🌍 IPFS Digital Asset</p>
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 truncate flex-1">{ipfsLink}</span>
                  <a href={ipfsLink} target="_blank" rel="noreferrer" className="text-[10px] bg-emerald-600 px-4 py-2 rounded-lg font-black text-white hover:bg-emerald-500 transition">VIEW</a>
                </div>
              </div>

              <div className="p-5 bg-zinc-900/60 border border-cyan-500/30 rounded-3xl backdrop-blur-xl">
                <p className="text-[10px] font-bold text-cyan-400 uppercase mb-3 tracking-tighter">🔗 Blockchain Transaction</p>
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-mono text-gray-400 truncate flex-1">{txHash}</span>
                  <button onClick={() => navigator.clipboard.writeText(txHash)} className="text-[10px] bg-cyan-600 px-4 py-2 rounded-lg font-black text-white hover:bg-cyan-500 transition">COPY</button>
                </div>
              </div>
            </div>
          ) : (
             <div className="hidden lg:block p-10 border border-white/5 rounded-[40px] bg-zinc-900/10">
                <p className="text-gray-600 text-sm italic font-serif">"The blockhash will appear here once the identity is secured on the mainnet..."</p>
             </div>
          )}
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="w-full bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[32px] shadow-3xl order-1 lg:order-2">
          <form onSubmit={handleRegister} className="space-y-6">
            
            <div className="flex p-1 bg-black/60 rounded-2xl border border-zinc-800">
              {["Ownership", "Government"].map((p) => (
                <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                  className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${registrationPurpose === p ? "bg-white text-black shadow-xl" : "text-gray-500"}`}>
                  {p === "Ownership" ? "PRIVATE OWNERSHIP" : "GOVT ALLOCATION"}
                </button>
              ))}
            </div>

            <div className="space-y-3 p-5 bg-black/40 rounded-3xl border border-zinc-800/50">
              <label className="text-[10px] uppercase text-cyan-400 font-black tracking-widest">Find Area (Step-by-Step)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="State" className="bg-zinc-900/80 text-xs p-3.5 rounded-xl border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, state: e.target.value})} />
                <input type="text" placeholder="District" className="bg-zinc-900/80 text-xs p-3.5 rounded-xl border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, district: e.target.value})} />
                <input type="text" placeholder="Village" className="bg-zinc-900/80 text-xs p-3.5 rounded-xl border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, village: e.target.value})} />
              </div>
              <button type="button" onClick={handleHierarchicalSearch} className="w-full bg-cyan-600/10 hover:bg-cyan-600 hover:text-white border border-cyan-600/30 py-3.5 rounded-xl text-[11px] font-black transition-all">LOCATE ON MAP</button>
            </div>

            {/* --- MAP WITH SATELLITE TOGGLE --- */}
            <div className="h-60 md:h-72 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl z-0">
               <MapContainer center={coordinates} zoom={13} style={{height: '100%', width: '100%'}}>
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Standard View">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite View">
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  <MapController coords={coordinates} />
                  <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
               </MapContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-cyan-500 disabled:opacity-30" onChange={(e)=>setFormData({...formData, ownerName: e.target.value})} />
              <input type="text" placeholder="Aadhaar ID" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, aadhaar: e.target.value})} />
            </div>

            <textarea placeholder="Address, Landmarks & Description" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs h-24 resize-none outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, address: e.target.value})} />
            <input type="number" placeholder="Area (Sq Ft)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, area: e.target.value})} />

            <div className="grid grid-cols-2 gap-4">
              <div onClick={()=>document.getElementById('img-up').click()} className={`border-2 border-dashed p-5 rounded-2xl text-center cursor-pointer transition-all ${images.length === 3 ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 hover:border-cyan-500"}`}>
                <input id="img-up" type="file" multiple hidden onChange={(e)=>setImages(Array.from(e.target.files).slice(0,3))} />
                <p className="text-[10px] font-black uppercase text-gray-500">{images.length === 3 ? "✅ 3 Images" : "📸 Upload 3 Photos"}</p>
              </div>
              <div onClick={()=>document.getElementById('doc-up').click()} className={`border-2 border-dashed p-5 rounded-2xl text-center cursor-pointer transition-all ${docFile ? "border-emerald-500 bg-emerald-500/5" : "border-zinc-800 hover:border-cyan-500"}`}>
                <input id="doc-up" type="file" hidden onChange={(e)=>setDocFile(e.target.files[0])} />
                <p className="text-[10px] font-black uppercase text-gray-500">{docFile ? "✅ PDF Ready" : "📄 PDF Document"}</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-white text-black font-black text-[12px] rounded-2xl tracking-[0.2em] uppercase hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-50">
              {isSubmitting ? "Processing on Blockchain..." : "Secure Identity (0.001 ETH)"}
            </button>

            {status && <div className="text-[10px] text-center font-bold text-cyan-400 animate-pulse uppercase tracking-widest">{status}</div>}
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