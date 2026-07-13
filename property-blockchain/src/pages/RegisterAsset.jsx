import { useState, useEffect, useRef, useMemo } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { ShieldAlert, MapPin, Database, CheckCircle, FileText, UploadCloud, Globe, Navigation, Search, HelpCircle } from "lucide-react"; 

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
  const [imageNames, setImageNames] = useState([]);
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const markerRef = useRef(null);

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (registrationPurpose === "Government") {
      setFormData(prev => ({ ...prev, ownerName: "Government of India" }));
    } else {
      setFormData(prev => ({ ...prev, ownerName: "" }));
    }
  }, [registrationPurpose]);

  // Handle draggable marker drag-end event
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          setCoordinates({ lat: Number(newLatLng.lat.toFixed(6)), lng: Number(newLatLng.lng.toFixed(6)) });
          setIsLocationSelected(true);
        }
      },
    }),
    [],
  );

  // File Upload Handlers
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    if (files.length > 0) {
      setImages(files);
      setImageNames(files.map(f => f.name));
    }
  };

  const handleDocUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFile(file);
      setDocName(file.name);
    }
  };

  // Search Address / Landmark
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setStatus("Searching Location...");
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        setCoordinates({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        setIsLocationSelected(true);
        setStatus("Location Pinned ✅");
      } else { 
        alert("Location not found. Please locate it manually on the map."); 
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setStatus(null); 
    }
  };

  // Locate current GPS coordinates
  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setStatus("Locating via GPS...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: Number(latitude.toFixed(6)), lng: Number(longitude.toFixed(6)) });
        setIsLocationSelected(true);
        setStatus("GPS Location Pinned ✅");
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve location. Please check if GPS permissions are enabled.");
        setStatus(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Hierarchical Search using State, District, Village inputs
  const handleHierarchicalSearch = async () => {
    const query = `${formData.village}, ${formData.district}, ${formData.state}, India`;
    if (!formData.state) return alert("Please enter the State.");
    setStatus("Auto-Locating Area...");
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data?.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        setCoordinates({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        setIsLocationSelected(true);
        setStatus("Pinned ✅");
      } else { 
        alert("Address match not found. Please pin manually using search box or click."); 
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setStatus(null); 
    }
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
    <section className="relative flex flex-col items-center px-4 md:px-8 py-8 min-h-screen bg-[#030712] text-white overflow-hidden font-sans">
      
      {/* ERROR MODAL */}
      {showError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/90 backdrop-blur-xl">
          <div className="relative bg-zinc-950 border border-red-500/30 p-8 rounded-[32px] max-w-sm w-full text-center shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Chain Protocol Error</h2>
            <p className="mt-4 text-zinc-500 text-[10px] leading-relaxed uppercase tracking-widest">{errorMessage}</p>
            <button onClick={() => setShowError(false)} className="mt-8 w-full py-4 bg-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">Dismiss</button>
          </div>
        </div>
      )}

      {/* Decorative Glow blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-6xl mb-12 text-center lg:text-left relative z-10 mt-10">
        <p className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase mb-4 italic">Registry_Node_Access</p>
        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter uppercase italic">
          Digital Land Deed<br/>
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Blockchain Sync</span>
        </h1>
      </div>

      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-start z-10">
        
        {/* LEFT: STATUS TRACKER */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="p-8 md:p-10 bg-zinc-950/60 border border-white/5 rounded-[36px] backdrop-blur-3xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none"></div>
            
            <h2 className="text-xl font-black text-white mb-10 italic uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              Deed Lifecycle
            </h2>
            
            <div className="relative pl-6 border-l-2 border-zinc-800/80 space-y-12">
               {/* STEP 1 */}
               <div className="relative">
                  <div className="absolute -left-[37px] top-0.5 w-6 h-6 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-[10px] font-black text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                    1
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                      Phase 1: Legal Submission
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[8px] font-bold tracking-widest uppercase">Active</span>
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                      Landowner uploads details & deeds. Metadata is signed and securely stored on IPFS, creating a pending Ledger state.
                    </p>
                  </div>
               </div>
               
               {/* STEP 2 */}
               <div className="relative">
                  <div className="absolute -left-[37px] top-0.5 w-6 h-6 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                    2
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">
                      Phase 2: Field Survey
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                      Official Surveyor visits the mapped location. Validates coordinates physically and approves the boundary request.
                    </p>
                  </div>
               </div>
               
               {/* STEP 3 */}
               <div className="relative">
                  <div className="absolute -left-[37px] top-0.5 w-6 h-6 rounded-full bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                    3
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">
                      Phase 3: NFT Minting
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                      Registrar verifies blockchain signatures, marks title deed as verified, and mints an ownership NFT to your wallet.
                    </p>
                  </div>
               </div>
            </div>
          </div>
          
          {txHash && (
            <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-pulse">
              <p className="text-[10px] font-black text-cyan-400 uppercase mb-2 italic">Protocol_Sync_Active</p>
              <p className="text-[9px] font-mono text-zinc-500 break-all">{txHash}</p>
            </div>
          )}
        </div>

        {/* RIGHT: REGISTRATION FORM */}
        <div className="w-full bg-[#08080c] border border-white/5 p-8 md:p-12 rounded-[48px] shadow-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none"></div>

          <form onSubmit={handleRegister} className="space-y-8 relative z-10">
            <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
              {["Ownership", "Government"].map((p) => (
                <button key={p} type="button" onClick={() => setRegistrationPurpose(p)}
                  className={`flex-1 py-3.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-[0.2em] ${registrationPurpose === p ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {p}
                </button>
              ))}
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">State</label>
                <input type="text" placeholder="e.g. Uttar Pradesh" required className="w-full bg-zinc-900/40 text-xs font-bold p-4 rounded-xl border border-zinc-800 outline-none focus:border-cyan-500 focus:bg-zinc-900/60 transition-all text-white placeholder:text-zinc-600" onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">District</label>
                <input type="text" placeholder="e.g. Lucknow" required className="w-full bg-zinc-900/40 text-xs font-bold p-4 rounded-xl border border-zinc-800 outline-none focus:border-cyan-500 focus:bg-zinc-900/60 transition-all text-white placeholder:text-zinc-600" onChange={(e) => setFormData({ ...formData, district: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">Village / Sector</label>
                <input type="text" placeholder="e.g. Gomti Nagar" required className="w-full bg-zinc-900/40 text-xs font-bold p-4 rounded-xl border border-zinc-800 outline-none focus:border-cyan-500 focus:bg-zinc-900/60 transition-all text-white placeholder:text-zinc-600" onChange={(e) => setFormData({ ...formData, village: e.target.value })} />
              </div>
            </div>

            {/* Plot Identity */}
            <div className="bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border border-cyan-500/15 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-xl rounded-full pointer-events-none"></div>
              <label className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.3em] mb-3 block">Plot Identity (Khasra No)</label>
              <input 
                type="text" 
                placeholder="Official ID from Revenue Records (e.g. 124-A)" 
                required
                className="w-full bg-black/60 border border-zinc-800/80 p-4 rounded-xl text-xs outline-none focus:border-cyan-500 focus:border-cyan-500/50 transition-all font-mono font-bold tracking-widest text-cyan-300 placeholder:text-zinc-600" 
                onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })} 
              />
            </div>

            {/* Auto-locate helper */}
            <button 
              type="button" 
              onClick={handleHierarchicalSearch} 
              className="w-full bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-500" />
              Auto-Locate via Address Inputs
            </button>

            {/* MAP CARD */}
            <div className="bg-zinc-900/20 border border-zinc-800/80 p-6 rounded-[28px] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black uppercase text-white tracking-[0.2em]">Map Coordinates Pin</h3>
                </div>
                <button
                  type="button"
                  onClick={handleGetMyLocation}
                  className="flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 hover:bg-cyan-900/50 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  <Navigation className="w-3 h-3 text-cyan-400" />
                  GPS Locate
                </button>
              </div>

              {/* SEARCH BOX ON MAP */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search landmark, colony, or custom location..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearchLocation(); } }}
                    className="w-full bg-black/40 border border-zinc-800 text-[11px] font-medium pl-11 pr-4 py-3.5 rounded-xl outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-600"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleSearchLocation}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Search
                </button>
              </div>

              {/* THE MAP CONTAINER */}
              <div className="h-80 rounded-2xl overflow-hidden border border-zinc-800 relative z-0 transition-all duration-300">
                <MapContainer center={coordinates} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="🗺️ Standard Map">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="🛰️ Satellite View">
                      <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
                      />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="🏔️ Terrain View">
                      <TileLayer
                        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenTopoMap contributors'
                      />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  
                  <MapController coords={coordinates} />
                  <LocationMarker setCoords={setCoordinates} setIsSelected={setIsLocationSelected} />
                  {isLocationSelected && (
                    <Marker 
                      position={[coordinates.lat, coordinates.lng]} 
                      draggable={true}
                      eventHandlers={eventHandlers}
                      ref={markerRef}
                    />
                  )}
                </MapContainer>
              </div>

              {/* Coordinates Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-zinc-500 ml-1">Pin Latitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    placeholder="Latitude" 
                    value={coordinates.lat}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setCoordinates(prev => ({ ...prev, lat: val }));
                        setIsLocationSelected(true);
                      }
                    }}
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-xs font-mono outline-none focus:border-cyan-500 text-white" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-zinc-500 ml-1">Pin Longitude</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    placeholder="Longitude" 
                    value={coordinates.lng}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setCoordinates(prev => ({ ...prev, lng: val }));
                        setIsLocationSelected(true);
                      }
                    }}
                    className="w-full bg-black/40 border border-zinc-800 p-4 rounded-xl text-xs font-mono outline-none focus:border-cyan-500 text-white" 
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-1.5 bg-cyan-950/20 border border-cyan-500/10 p-3.5 rounded-xl">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[9px] text-zinc-400 leading-normal uppercase tracking-wider">
                  Tip: Click anywhere on the map or drag the blue marker to adjust position. You can also paste precise coordinates manually.
                </p>
              </div>
            </div>

            {/* Land Area and Owner Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">Area (Sq. Ft)</label>
                <input type="number" placeholder="Ex: 1500" required className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-cyan-500 text-white placeholder:text-zinc-600" onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">Owner Name</label>
                <input type="text" placeholder="Full Legal Name" value={formData.ownerName} disabled={registrationPurpose === "Government"} className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-xs font-bold outline-none focus:border-cyan-500 text-white disabled:opacity-30 placeholder:text-zinc-600" onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
              </div>
            </div>

            {/* Physical Address */}
            <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-zinc-500 ml-2">Physical Address & Landmarks</label>
              <textarea placeholder="e.g. Plot No 42, Opposite Metro Pillar 12..." required className="w-full bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl text-xs font-bold h-24 resize-none outline-none focus:border-cyan-500 text-white placeholder:text-zinc-600" onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            
            {/* Upload fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div onClick={() => document.getElementById('img-up').click()} className={`group border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 ${images.length > 0 ? "border-cyan-500/60 bg-cyan-950/20" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/10"}`}>
                <input id="img-up" type="file" multiple hidden accept="image/*" onChange={handleImageUpload} />
                <UploadCloud className={`w-6 h-6 mx-auto mb-2 transition-colors ${images.length > 0 ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{images.length > 0 ? `${images.length} Photos Selected` : "Upload Land Photos"}</p>
                {imageNames.length > 0 && (
                  <div className="mt-2 text-[8px] text-zinc-500 truncate max-w-full px-2">
                    {imageNames.join(", ")}
                  </div>
                )}
              </div>

              <div onClick={() => document.getElementById('doc-up').click()} className={`group border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 ${docFile ? "border-cyan-500/60 bg-cyan-950/20" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/10"}`}>
                <input id="doc-up" type="file" hidden accept="application/pdf,image/*" onChange={handleDocUpload} />
                <FileText className={`w-6 h-6 mx-auto mb-2 transition-colors ${docFile ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{docFile ? "Deed Document Loaded" : "Upload Deed Document"}</p>
                {docName && (
                  <div className="mt-2 text-[8px] text-zinc-500 truncate max-w-full px-2">
                    {docName}
                  </div>
                )}
              </div>
            </div>

            {/* Execute Button */}
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-2xl tracking-[0.3em] uppercase hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none"
            >
              {isSubmitting ? "TRANSACTION_IN_PROGRESS..." : "EXECUTE DEED REQUEST"}
            </button>
            
            {status && (
              <div className="flex items-center justify-center gap-3 text-[10px] font-black text-cyan-500 animate-pulse uppercase tracking-[0.3em] italic">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div>
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
  useMapEvents({ 
    click(e) { 
      setCoords({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }); 
      setIsSelected(true); 
    } 
  });
  return null;
};

export default Register_Asset;