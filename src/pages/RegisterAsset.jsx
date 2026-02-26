import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { ShieldAlert, MapPin, Database, CheckCircle, FileText, UploadCloud } from "lucide-react"; 

import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../utils/ipfs.js";

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const Register_Asset = () => {
  const { isWalletConnected } = useAuth();
  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [formData, setFormData] = useState({
    state: "", district: "", village: "", aadhaar: "",
    ownerName: "", area: "", address: "", description: "",
    khasraNumber: "" 
  });

  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [images, setImages] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState("");

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (registrationPurpose === "Government") {
      setFormData(prev => ({ ...prev, ownerName: "Government of India" }));
    } else {
      setFormData(prev => ({ ...prev, ownerName: "" }));
    }
  }, [registrationPurpose]);

  // ✅ Simple Handlers (AI logic removed for now)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    if (files.length > 0) setImages(files);
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (file) setDocFile(file);
  };

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
      } else { alert("Location not found. Please pin manually on map."); }
    } catch (e) { console.error(e); }
    finally { setStatus(null); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isWalletConnected) return alert("Please connect your wallet first.");
    if (images.length < 1 || !docFile) return alert("Upload required property files.");
    if (!formData.khasraNumber) return alert("Official Khasra/Plot Number is required.");

    try {
      setIsSubmitting(true);
      setStatus("Step 1/3: Storing Assets on IPFS...");
      
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

      setStatus("Step 2/3: Authorizing Blockchain Ledger...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      const tx = await contract.requestRegistration(
        formData.ownerName, 
        metadataURL, 
        formData.area.toString(), 
        formData.address,
        formData.khasraNumber,
        { value: parseEther("0.001") }
      );

      setStatus("Step 3/3: Finalizing Governance Request...");
      await tx.wait();

      setTxHash(tx.hash);
      setStatus("🎉 Application Filed! Waiting for Govt Verification.");
    } catch (err) { 
      console.error(err);
      setErrorMessage(err.reason || "Transaction failed. Check if identity is linked or gas is sufficient.");
      setShowError(true);
      setStatus(null);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <section className="relative flex flex-col items-center px-4 md:px-8 py-8 min-h-screen bg-[#000000] text-white overflow-hidden font-sans">
      
      {/* ERROR MODAL */}
      {showError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/90 backdrop-blur-xl">
          <div className="relative bg-zinc-950 border border-red-500/30 p-8 rounded-[40px] max-w-sm w-full text-center shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Chain Protocol Error</h2>
            <p className="mt-4 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-widest">{errorMessage}</p>
            <button onClick={() => setShowError(false)} className="mt-8 w-full py-4 bg-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">Dismiss</button>
          </div>
        </div>
      )}

      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-6xl mb-12 text-center lg:text-left relative z-10 mt-10">
        <p className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase mb-4 italic">Registry_Node_Access</p>
        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter uppercase italic">
          Digital Land Deed<br/>
          <span className="text-cyan-500">Blockchain Sync</span>
        </h1>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-start z-10">
        
        {/* LEFT: STATUS TRACKER */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="p-10 bg-zinc-950/40 border border-white/5 rounded-[48px] backdrop-blur-3xl shadow-3xl">
            <h2 className="text-xl font-black text-white mb-8 italic uppercase tracking-tighter">Deed Lifecycle</h2>
            <div className="space-y-8">
               <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]"><Database className="w-5 h-5"/></div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-white tracking-widest">Phase 1: Legal Submission</h4>
                    <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed">Data anchored to IPFS & Blockchain. Govt Officer verifies Khasra link.</p>
                  </div>
               </div>
               <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-700"><MapPin className="w-5 h-5"/></div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Phase 2: Field Survey</h4>
                    <p className="text-[9px] text-zinc-700 mt-1">Ground inspection by Official Surveyor to confirm boundaries.</p>
                  </div>
               </div>
               <div className="flex items-start gap-5">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-700"><CheckCircle className="w-5 h-5"/></div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Phase 3: NFT Minting</h4>
                    <p className="text-[9px] text-zinc-700 mt-1">Registrar issues the Immutable Digital Certificate (NFT).</p>
                  </div>
               </div>
            </div>
          </div>
          
          {txHash && (
            <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-[32px] animate-pulse">
              <p className="text-[10px] font-black text-cyan-400 uppercase mb-2 italic">Protocol_Sync_Active</p>
              <p className="text-[9px] font-mono text-zinc-500 break-all">{txHash}</p>
            </div>
          )}
        </div>

        {/* RIGHT: REGISTRATION FORM */}
        <div className="w-full bg-[#080808] border border-white/10 p-8 md:p-12 rounded-[56px] shadow-3xl">
          <form onSubmit={handleRegister} className="space-y-8">
            <div className="flex p-1.5 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              {["Ownership", "Government"].map((p) => (
                <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                  className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-[0.2em] ${registrationPurpose === p ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {p}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <input type="text" placeholder="State" required className="bg-zinc-900/40 text-[11px] font-bold p-5 rounded-2xl border border-zinc-800 outline-none focus:border-cyan-500 transition-colors" onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
               <input type="text" placeholder="District" required className="bg-zinc-900/40 text-[11px] font-bold p-5 rounded-2xl border border-zinc-800 outline-none focus:border-cyan-500 transition-colors" onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
               <input type="text" placeholder="Village" required className="bg-zinc-900/40 text-[11px] font-bold p-5 rounded-2xl border border-zinc-800 outline-none focus:border-cyan-500 transition-colors" onChange={(e) => setFormData({ ...formData, village: e.target.value })} />
            </div>

            <div className="bg-cyan-500/5 border border-cyan-500/10 p-6 rounded-3xl">
               <label className="text-[9px] font-black uppercase text-cyan-500 tracking-[0.4em] mb-3 block">Plot Identity (Khasra No)</label>
               <input 
                  type="text" 
                  placeholder="Official ID from Revenue Records" 
                  required
                  className="w-full bg-black/40 border border-zinc-800 p-5 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all font-bold tracking-widest" 
                  onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })} 
               />
            </div>

            <button type="button" onClick={handleHierarchicalSearch} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border border-white/5 transition-all active:scale-95 shadow-lg">Verify Location on Map</button>

            <div className="h-72 rounded-[40px] overflow-hidden border border-zinc-800 relative z-0 grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <MapContainer center={coordinates} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController coords={coordinates} />
                <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
                {isLocationSelected && <Marker position={[coordinates.lat, coordinates.lng]} />}
              </MapContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">Area (Sq. Ft)</label>
                <input type="number" placeholder="Ex: 1500" required className="w-full bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl text-[11px] font-bold outline-none focus:border-cyan-500" onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">Owner Name</label>
                <input type="text" placeholder="Full Legal Name" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl text-[11px] font-bold outline-none focus:border-cyan-500 disabled:opacity-30" onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
              </div>
            </div>

            <textarea placeholder="Physical Address & Nearby Landmarks..." required className="w-full bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl text-[11px] font-bold h-28 resize-none outline-none focus:border-cyan-500" onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => document.getElementById('img-up').click()} className={`group border-2 border-dashed p-8 rounded-3xl text-center cursor-pointer transition-all duration-500 ${images.length > 0 ? "border-cyan-500 bg-cyan-500/5" : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/20"}`}>
                <input id="img-up" type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                <UploadCloud className={`w-6 h-6 mx-auto mb-2 ${images.length > 0 ? "text-cyan-500" : "text-zinc-700"}`} />
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{images.length > 0 ? `${images.length} IMAGES READY` : "UPLOAD PHOTOS"}</p>
              </div>

              <div onClick={() => document.getElementById('doc-up').click()} className={`group border-2 border-dashed p-8 rounded-3xl text-center cursor-pointer transition-all duration-500 ${docFile ? "border-cyan-500 bg-cyan-500/5" : "border-zinc-800 hover:border-zinc-600 bg-zinc-900/20"}`}>
                <input id="doc-up" type="file" hidden accept="application/pdf,image/*" onChange={handleDocUpload} />
                <FileText className={`w-6 h-6 mx-auto mb-2 ${docFile ? "text-cyan-500" : "text-zinc-700"}`} />
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{docFile ? "DOC READY" : "UPLOAD DEED"}</p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-white text-black font-black text-xs rounded-[24px] tracking-[0.4em] uppercase hover:bg-cyan-500 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-95 disabled:opacity-20">
              {isSubmitting ? "TRANSACTION_IN_PROGRESS" : "EXECUTE DEED REQUEST"}
            </button>
            
            {status && (
              <div className="flex items-center justify-center gap-3 text-[10px] font-black text-cyan-500 animate-pulse uppercase tracking-[0.3em] italic">
                <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></div>
                {status}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

// Helper Components for Map
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