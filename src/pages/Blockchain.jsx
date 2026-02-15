import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther, id } from "ethers"; 
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../utils/ipfs.js";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- Formats for search ---
const SEARCH_STEPS = ["State", "District", "Village/Area"];

const Blockchain = () => {
  const { isWalletConnected } = useAuth();
  
  // --- Form States ---
  const [formData, setFormData] = useState({
    state: "",
    district: "",
    village: "",
    aadhaar: "",
    ownerName: "",
    area: "",
    address: "",
    description: ""
  });

  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [ipfsLink, setIpfsLink] = useState(""); 
  const [txHash, setTxHash] = useState("");
  const [images, setImages] = useState([]);

  // --- Map Hierarchy Search ---
  const handleHierarchicalSearch = async () => {
    const query = `${formData.village}, ${formData.district}, ${formData.state}, India`;
    if (!formData.state) return alert("Please enter at least the State name.");
    
    setStatus("Searching location in India...");
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        setCoordinates({ lat, lng });
        setIsLocationSelected(true);
        setStatus("Location Pinned ✅");
      } else {
        alert("Location not found. Please try a nearby area.");
      }
    } catch (error) {
      console.error(error);
    } finally { setStatus(null); }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setCoordinates(e.latlng);
        setIsLocationSelected(true);
      },
    });
    return isLocationSelected ? <Marker position={coordinates} /> : null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (images.length < 1) return setStatus("Upload property image.");
    
    try {
      setIsSubmitting(true);
      setStatus("Uploading to IPFS...");
      
      const imgUrl = await uploadFileToIPFS(images[0]);
      const metadata = {
        ...formData,
        lat: coordinates.lat,
        lng: coordinates.lng,
        image: imgUrl,
        purpose: registrationPurpose
      };

      const metadataURL = await uploadJSONToIPFS(metadata);
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      setStatus("Confirm in Wallet...");
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
    <section className="relative flex items-start justify-center px-4 md:px-8 py-24 min-h-screen bg-black text-white overflow-x-hidden">
      
      <div className="relative max-w-6xl w-full grid lg:grid-cols-2 gap-10">
        
        {/* LEFT SIDE: Proofs & Links */}
        <div className="space-y-6 lg:sticky lg:top-24 h-fit">
          <div>
            <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">PROPERTIX SECURE</p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">Digital Land <span className="text-cyan-400">Registry</span></h1>
          </div>

          {(ipfsLink || txHash) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-5">
              {/* IPFS Card */}
              <div className="p-4 bg-zinc-900/80 border border-emerald-500/30 rounded-2xl">
                <p className="text-[9px] font-bold text-emerald-400 uppercase mb-2">🌍 IPFS Digital Asset (Metadata)</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400 truncate flex-1">{ipfsLink}</span>
                  <a href={ipfsLink} target="_blank" className="text-[9px] bg-emerald-600 px-3 py-1 rounded font-bold">VIEW</a>
                </div>
              </div>

              {/* Hash Card */}
              <div className="p-4 bg-zinc-900/80 border border-cyan-500/30 rounded-2xl">
                <p className="text-[9px] font-bold text-cyan-400 uppercase mb-2">🔗 Blockchain Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400 truncate flex-1">{txHash}</span>
                  <button onClick={() => navigator.clipboard.writeText(txHash)} className="text-[9px] bg-cyan-600 px-3 py-1 rounded font-bold">COPY</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Hierarchical Form */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-3xl">
          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Hierarchical Search Section */}
            <div className="space-y-3 p-4 bg-black/40 rounded-2xl border border-zinc-800">
              <label className="text-[10px] uppercase text-cyan-500 font-black">Location Hierarchy (India)</label>
              <div className="grid grid-cols-3 gap-2">
                <input type="text" placeholder="State" className="bg-zinc-900 text-[11px] p-2 rounded-lg border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, state: e.target.value})} />
                <input type="text" placeholder="District" className="bg-zinc-900 text-[11px] p-2 rounded-lg border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, district: e.target.value})} />
                <input type="text" placeholder="Village" className="bg-zinc-900 text-[11px] p-2 rounded-lg border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e)=>setFormData({...formData, village: e.target.value})} />
              </div>
              <button type="button" onClick={handleHierarchicalSearch} className="w-full bg-zinc-800 hover:bg-cyan-600 py-2 rounded-lg text-[10px] font-bold transition-all">LOCATE AREA ON MAP</button>
            </div>

            {/* Map Container */}
            <div className="h-60 rounded-2xl overflow-hidden border border-zinc-800">
               <MapContainer center={coordinates} zoom={13} style={{height: '100%'}}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController coords={coordinates} />
                  <LocationMarker />
               </MapContainer>
            </div>

            {/* Other Fields */}
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Owner Name" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-sm" onChange={(e)=>setFormData({...formData, ownerName: e.target.value})} />
              <input type="text" placeholder="Aadhaar Number" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-sm" onChange={(e)=>setFormData({...formData, aadhaar: e.target.value})} />
            </div>

            <input type="text" placeholder="Exact Property Address" className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-sm" onChange={(e)=>setFormData({...formData, address: e.target.value})} />
            
            <div className="flex gap-4">
              <input type="number" placeholder="Area (Sq Ft)" className="w-1/2 bg-black/40 border border-zinc-800 p-3 rounded-xl text-sm" onChange={(e)=>setFormData({...formData, area: e.target.value})} />
              <div onClick={()=>document.getElementById('img-up').click()} className="w-1/2 border border-dashed border-zinc-700 p-3 rounded-xl text-center cursor-pointer text-[10px]">
                <input id="img-up" type="file" hidden onChange={(e)=>setImages([e.target.files[0]])} />
                {images.length > 0 ? "✅ IMAGE READY" : "📸 UPLOAD PHOTO"}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[11px] rounded-xl tracking-widest transition-all">
              {isSubmitting ? "PROCESSING..." : "SUBMIT APPLICATION (0.001 ETH)"}
            </button>

            {status && <div className="text-[10px] text-center font-bold text-cyan-400 animate-pulse">{status}</div>}
          </form>
        </div>
      </div>
    </section>
  );
};

// Helper to update map view
const MapController = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 16);
  }, [coords, map]);
  return null;
};

export default Blockchain;