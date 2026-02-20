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
    // 🌌 Added Background Wrapper to match Home.jsx
    <section className="relative flex flex-col items-center px-4 md:px-8 py-8 min-h-screen bg-[#000000] text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Subtle Glows */}
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full"></div>

        {/* The "Shocking" Square Border from Image */}
        <div className="absolute top-[15%] left-[5%] w-72 h-80 border border-cyan-500/20 rounded-[40px] rotate-[-10deg]"></div>
        <div className="absolute top-[18%] left-[8%] w-72 h-80 border border-white/5 rounded-[40px] rotate-[-5deg]"></div>
      </div>
      {/* 🔥 SHOCKING GRID BACKGROUND END */}

      <div className="w-full max-w-6xl mb-12 text-center lg:text-left relative z-10">
        <p className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase mb-2">Immutable Protocol</p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">
          Register a new land Property<span className="text-cyan-400 block sm:inline"> for Verified record</span>
        </h1>
        <p className="text-[10px] font-black tracking-[0.4em] text-zinc-500 lowercase mt-2">Store details securely on IPFS & Blockchain Ledger</p>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-start z-10">

        {/* LEFT SIDE: Proofs & Info */}
        <div className="space-y-6 w-full order-2 lg:order-1 lg:sticky lg:top-24">
          <div className="p-8 bg-zinc-950/50 border border-white/5 rounded-[40px] backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Registration Guidelines</h2>
            <ul className="text-xs text-zinc-400 space-y-4">
              <li className="flex gap-3"><span className="text-cyan-400">01</span> Ensure Aadhaar ID matches your wallet owner identity for faster verification.</li>
              <li className="flex gap-3"><span className="text-cyan-400">02</span> Property images must be clear and show boundaries properly.</li>
              <li className="flex gap-3"><span className="text-cyan-400">03</span> Legal documents should be in PDF format and verified by local authority.</li>
            </ul>
          </div>

          {txHash && (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-8 w-full">
              <div className="p-4 sm:p-6 bg-emerald-500/5 border border-emerald-500/30 rounded-[32px] backdrop-blur-xl shadow-emerald-500/10 shadow-lg">
                <p className="text-[9px] font-bold text-emerald-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Transaction Secured
                </p>

                {/* 🛠️ Main Fix: Added 'w-full' and 'overflow-hidden' */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/5 w-full overflow-hidden">

                  <div className="flex-1 min-w-0 overflow-hidden">
                    {/* 🛠️ Text Fix: Added 'break-all' for mobile wrapping and 'truncate' for desktop */}
                    <p className="text-[10px] font-mono text-zinc-400 break-all sm:truncate leading-relaxed">
                      {txHash}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(txHash);
                      // logic for toast or "Copied!" text
                    }}
                    className="flex-shrink-0 text-[10px] bg-emerald-600 px-4 py-3 sm:py-2 rounded-xl font-black text-white hover:bg-emerald-400 active:scale-95 transition-all shadow-lg"
                  >
                    COPY
                  </button>
                </div>

                <p className="text-[8px] text-zinc-600 mt-3 italic tracking-tight">
                  *Identity synced with Neon DB and Blockchain Ledger.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="w-full bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-6 md:p-10 rounded-[48px] shadow-3xl order-1 lg:order-2">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="flex p-1.5 bg-black/60 rounded-2xl border border-zinc-800">
              {["Ownership", "Government"].map((p) => (
                <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                  className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${registrationPurpose === p ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {p === "Ownership" ? "Private Ownership" : "Govt Allocation"}
                </button>
              ))}
            </div>

            <div className="space-y-4 p-6 bg-black/40 rounded-[32px] border border-zinc-800/50">
              <label className="text-[10px] uppercase text-cyan-400 font-black tracking-widest ml-1">Location Geometry</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input type="text" placeholder="State" className="bg-zinc-900/80 text-sm p-4 rounded-2xl border border-zinc-700 outline-none focus:border-cyan-500/50 transition-all" onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                <input type="text" placeholder="District" className="bg-zinc-900/80 text-sm p-4 rounded-2xl border border-zinc-700 outline-none focus:border-cyan-500/50 transition-all" onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
                <input type="text" placeholder="Village" className="bg-zinc-900/80 text-sm p-4 rounded-2xl border border-zinc-700 outline-none focus:border-cyan-500/50 transition-all" onChange={(e) => setFormData({ ...formData, village: e.target.value })} />
              </div>
              <button type="button" onClick={handleHierarchicalSearch} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest shadow-lg shadow-cyan-900/20">LOCATE ON MAP</button>
            </div>

            <div className="h-64 rounded-[32px] overflow-hidden border border-zinc-800 shadow-2xl relative z-0">
              <MapContainer center={coordinates} zoom={13} style={{ height: '100%', width: '100%' }}>
                <LayersControl position="topright">
                  <LayersControl.BaseLayer checked name="Standard">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  </LayersControl.BaseLayer>
                  <LayersControl.BaseLayer name="Satellite">
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  </LayersControl.BaseLayer>
                </LayersControl>
                <MapController coords={coordinates} />
                <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
                {isLocationSelected && <Marker position={[coordinates.lat, coordinates.lng]} />}
              </MapContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Legal Name" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-sm outline-none focus:border-cyan-500 disabled:opacity-30 transition-all" onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
              <input type="password" placeholder="Aadhaar Number" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-sm outline-none focus:border-cyan-500 transition-all" onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })} />
            </div>

            <textarea placeholder="Property Address & Landmarks" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-sm h-24 resize-none outline-none focus:border-cyan-500 transition-all" onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <input type="number" placeholder="Total Area (Sq Ft)" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-sm outline-none focus:border-cyan-500 transition-all" onChange={(e) => setFormData({ ...formData, area: e.target.value })} />

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => document.getElementById('img-up').click()} className={`border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all ${images.length >= 3 ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 hover:border-cyan-500 bg-zinc-900/30"}`}>
                <input id="img-up" type="file" multiple hidden onChange={(e) => setImages(Array.from(e.target.files).slice(0, 3))} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{images.length >= 3 ? "✅ 3 Images Ready" : "📸 Upload 3 Photos"}</p>
              </div>
              <div onClick={() => document.getElementById('doc-up').click()} className={`border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all ${docFile ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 hover:border-cyan-500 bg-zinc-900/30"}`}>
                <input id="doc-up" type="file" hidden onChange={(e) => setDocFile(e.target.files[0])} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{docFile ? "✅ PDF Document Ready" : "📄 Legal PDF Doc"}</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-white text-black font-black text-xs rounded-2xl tracking-[0.3em] uppercase hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-50 active:scale-[0.98]">
              {isSubmitting ? "PROCESSING TRANSACTION..." : "SUBMIT TO BLOCKCHAIN (0.001 ETH)"}
            </button>
            {status && (
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-cyan-400 animate-pulse uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></span>
                {status}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* ✅ CSS (Exactly same as Home.jsx for consistency) */}
      <style>{`
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes grid-move {
            0% { transform: translateY(0); }
            100% { transform: translateY(54px); }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-grid-move { animation: grid-move 3s linear infinite; }
      `}</style>
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