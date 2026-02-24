import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther, id } from "ethers";
import Tesseract from "tesseract.js"; 
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { ShieldAlert, Loader2, MapPin, FileText, CheckCircle, Database } from "lucide-react"; 

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
    khasraNumber: "" // ✅ New Field for Govt Officer
  });

  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [images, setImages] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState("");

  // ✅ AI & Error States
  const [isVerifying, setIsVerifying] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (registrationPurpose === "Government") {
      setFormData(prev => ({ ...prev, ownerName: "Government of India" }));
    } else {
      setFormData(prev => ({ ...prev, ownerName: "" }));
    }
  }, [registrationPurpose]);

  // ✅ AI Multi-Model Verification (Visual + Text)
  const verifyWithAI = async (file, type) => {
    setIsVerifying(true);
    setStatus(type === 'image' ? "AI Vision: Analyzing Landscape..." : "AI OCR: Scanning Document...");
    
    try {
      if (type === 'image') {
        const imgElement = document.createElement('img');
        imgElement.src = URL.createObjectURL(file);
        await new Promise((resolve) => (imgElement.onload = resolve));
        
        const model = await mobilenet.load();
        const predictions = await model.classify(imgElement);
        
        const landLabels = ["valley", "field", "plain", "plateau", "hill", "mountain", "earth", "soil", "grass", "nature", "agriculture"];
        const isValidVisual = predictions.some(p => 
          landLabels.some(label => p.className.toLowerCase().includes(label))
        );

        if (!isValidVisual) {
          setErrorMessage("Image Rejected: AI detected '" + predictions[0].className + "'. Please upload a clear plot or field photo.");
          setShowError(true);
          return false;
        }
      } else {
        const result = await Tesseract.recognize(file, 'eng');
        const text = result.data.text.toLowerCase();
        const landKeywords = ["khasra", "plot", "registry", "survey", "area", "deed", "stamp", "land", "property", "village"];
        
        if (!landKeywords.some(key => text.includes(key))) {
          setErrorMessage("Document Rejected: No land-related legal terms found. Please upload valid registry papers.");
          setShowError(true);
          return false;
        }
      }
      return true;
    } catch (error) {
      setErrorMessage("AI Engine Error: Analysis failed. Try again with a clearer file.");
      setShowError(true);
      return false;
    } finally {
      setIsVerifying(false);
      setStatus(null);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    if (files.length === 0) return;
    const isValid = await verifyWithAI(files[0], 'image');
    if (isValid) setImages(files);
    else e.target.value = "";
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isValid = await verifyWithAI(file, 'doc');
    if (isValid) setDocFile(file);
    else e.target.value = "";
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
      } else { alert("Not found. Pin manually."); }
    } catch (e) { console.error(e); }
    finally { setStatus(null); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isWalletConnected) return alert("Please connect wallet.");
    if (images.length !== 3 || !docFile) return alert("Upload required files.");
    if (!formData.khasraNumber) return alert("Khasra/Plot Number is required.");

    try {
      setIsSubmitting(true);
      setStatus("Step 1: Uploading to IPFS...");
      
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadFileToIPFS(img);
        imageUrls.push(url);
      }
      const docUrl = await uploadFileToIPFS(docFile);
      
      const metadata = { ...formData, purpose: registrationPurpose, images: imageUrls, document: docUrl, location: coordinates };
      const metadataURL = await uploadJSONToIPFS(metadata);

      setStatus("Step 2: Blockchain Interaction...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      // ✅ Calling requestRegistration with Khasra Number
      const tx = await contract.requestRegistration(
        formData.ownerName, 
        metadataURL, 
        formData.aadhaar, 
        formData.area.toString(), 
        formData.address,
        formData.khasraNumber, // ✅ Added Khasra Number
        { value: parseEther("0.001") }
      );

      setStatus("Step 3: Awaiting Governance Approval...");
      await tx.wait();

      setTxHash(tx.hash);
      setStatus("✅ Registered Successfully! Under Govt Review.");
    } catch (err) { 
      setErrorMessage(err.reason || "Transaction failed. Identity might not be linked.");
      setShowError(true);
      setStatus(null);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <section className="relative flex flex-col items-center px-4 md:px-8 py-8 min-h-screen bg-[#000000] text-white overflow-hidden font-sans">
      
      {/* --- ERROR MODAL --- */}
      {showError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
          <div className="relative bg-zinc-950 border border-red-500/30 p-8 rounded-[40px] max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Verification Failed</h2>
            <p className="mt-4 text-zinc-500 text-xs leading-relaxed">{errorMessage}</p>
            <button onClick={() => setShowError(false)} className="mt-8 w-full py-4 bg-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Retry Upload</button>
          </div>
        </div>
      )}

      {/* Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-6xl mb-12 text-center lg:text-left relative z-10">
        <p className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase mb-2">Neural_Assets_v2</p>
        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter uppercase italic">
          Mint Property NFT<span className="text-cyan-400 block sm:inline"> with Govt Protocol</span>
        </h1>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-start z-10">
        
        {/* LEFT SIDE: GOVT PROTOCOL TRACKER */}
        <div className="space-y-6 w-full lg:sticky lg:top-24">
          <div className="p-8 bg-zinc-950/50 border border-white/5 rounded-[40px] backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-black text-white mb-6 italic uppercase tracking-tighter">Registration Protocol</h2>
            <div className="space-y-6">
               <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500"><Database className="w-4 h-4"/></div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-300">Phase 1: Legal Identity</h4>
                    <p className="text-[10px] text-zinc-500">Govt Officer verifies Aadhaar/PAN & Khasra No.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600"><MapPin className="w-4 h-4"/></div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-600 tracking-widest">Phase 2: Survey Desk</h4>
                    <p className="text-[10px] text-zinc-600">Physical field inspection & Visual AI audit.</p>
                  </div>
               </div>
               <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600"><CheckCircle className="w-4 h-4"/></div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-zinc-600 tracking-widest">Phase 3: NFT Minting</h4>
                    <p className="text-[10px] text-zinc-600">Registrar approves final on-chain deed.</p>
                  </div>
               </div>
            </div>
          </div>
          {txHash && (
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/30 rounded-[32px] animate-in slide-in-from-bottom-4">
              <p className="text-[9px] font-black text-emerald-400 uppercase mb-2">TX_SUBMITTED</p>
              <p className="text-[9px] font-mono text-zinc-500 break-all">{txHash}</p>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="w-full bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-6 md:p-10 rounded-[48px] shadow-3xl">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="flex p-1.5 bg-black/60 rounded-2xl border border-zinc-800">
              {["Ownership", "Government"].map((p) => (
                <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                  className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${registrationPurpose === p ? "bg-white text-black" : "text-zinc-500"}`}>
                  {p}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <input type="text" placeholder="State" className="bg-zinc-900/80 text-xs p-4 rounded-2xl border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
               <input type="text" placeholder="District" className="bg-zinc-900/80 text-xs p-4 rounded-2xl border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
               <input type="text" placeholder="Village" className="bg-zinc-900/80 text-xs p-4 rounded-2xl border border-zinc-700 outline-none focus:border-cyan-500" onChange={(e) => setFormData({ ...formData, village: e.target.value })} />
            </div>

            {/* ✅ KHASRA NUMBER INPUT */}
            <div className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-3xl group">
               <label className="text-[8px] font-black uppercase text-cyan-500 tracking-[0.3em] mb-2 block">Khasra / Survey Number</label>
               <input 
                  type="text" 
                  placeholder="Enter Official Plot Number" 
                  required
                  className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 transition-all font-bold tracking-widest text-white" 
                  onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })} 
               />
            </div>

            <button type="button" onClick={handleHierarchicalSearch} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-900/20">LOCATE ON MAP</button>

            <div className="h-64 rounded-[32px] overflow-hidden border border-zinc-800 relative z-0">
              <MapContainer center={coordinates} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController coords={coordinates} />
                <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
                {isLocationSelected && <Marker position={[coordinates.lat, coordinates.lng]} />}
              </MapContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Legal Name" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-cyan-500 disabled:opacity-30" onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
              <input type="password" placeholder="Aadhaar Number" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs outline-none focus:border-cyan-500" onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })} />
            </div>

            <textarea placeholder="Property Address & Landmarks" className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-xs h-24 resize-none outline-none focus:border-cyan-500" onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => document.getElementById('img-up').click()} className={`relative border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all duration-500 overflow-hidden ${images.length >= 3 ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 hover:border-cyan-500 bg-zinc-900/30"}`}>
                {isVerifying && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center animate-in fade-in" />}
                <input id="img-up" type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {images.length >= 3 ? "✅ IMAGES VERIFIED" : "📸 PLOT IMAGES"}
                </p>
              </div>

              <div onClick={() => document.getElementById('doc-up').click()} className={`relative border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all duration-500 overflow-hidden ${docFile ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 hover:border-cyan-500 bg-zinc-900/30"}`}>
                {isVerifying && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center animate-in fade-in" />}
                <input id="doc-up" type="file" hidden accept="application/pdf,image/*" onChange={handleDocUpload} />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {docFile ? "✅ RECORD VERIFIED" : "📄 REGISTRY DOC"}
                </p>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting || isVerifying} className="w-full py-5 bg-white text-black font-black text-xs rounded-2xl tracking-[0.3em] uppercase hover:bg-cyan-400 transition-all shadow-2xl disabled:opacity-30">
              {isSubmitting ? "SYNCING TO BLOCKCHAIN..." : isVerifying ? "AI ANALYZING..." : "SUBMIT APPLICATION (0.001 ETH)"}
            </button>
            
            {status && (
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-cyan-400 animate-pulse uppercase tracking-[0.3em] italic">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></span>
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

export default Register_Asset;