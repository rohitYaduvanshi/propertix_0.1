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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 🔥 1. MODERN TRANSACTION LOADER COMPONENT
const TransactionLoader = ({ statusText }) => (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-300">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/20 blur-[100px] rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-600/20 blur-[80px] rounded-full"></div>

        {/* Animated Rings */}
        <div className="relative flex items-center justify-center z-10 mb-8">
            <div className="absolute w-24 h-24 border-t-2 border-r-2 border-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute w-16 h-16 border-b-2 border-l-2 border-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
        </div>

        <h2 className="text-lg md:text-xl font-bold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse z-10 text-center px-4 uppercase">
            {statusText || "PROCESSING TRANSACTION..."}
        </h2>
        <p className="mt-4 text-xs text-gray-400 font-mono z-10 text-center max-w-sm px-4 leading-relaxed">
            Please confirm the transaction in your wallet and wait for blockchain confirmation. <br/>
            <span className="text-emerald-500 font-bold">Do not close or refresh this window.</span>
        </p>
    </div>
);

const Blockchain = () => {
  const { isWalletConnected } = useAuth();

  // --- FORM STATES ---
  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [ownerName, setOwnerName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [description, setDescription] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  
  // --- LOCATION & MAP STATES ---
  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // --- UPLOAD & STATUS STATES ---
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState(null);
  
  // Keys for Display
  const [ipfsLink, setIpfsLink] = useState(""); 
  const [txHash, setTxHash] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HELPER ---
  const sanitizeText = (str) => {
    return str ? str.normalize("NFKD").replace(/[^\x00-\x7F]/g, "") : "";
  };

  useEffect(() => {
    if (registrationPurpose === "Government") {
        setOwnerName("Government of India"); 
    } else {
        setOwnerName(""); 
    }
  }, [registrationPurpose]);

  const MapController = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
      if (coords) {
        map.setView([coords.lat, coords.lng], 16, { animate: true });
      }
    }, [coords, map]);
    return null;
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setCoordinates({ lat, lng });
        setIsLocationSelected(true);
      },
    });
    return isLocationSelected ? <Marker position={coordinates} /> : null;
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    try {
        const q = encodeURIComponent(searchQuery);
        const url = `https://photon.komoot.io/api/?q=${q}&limit=1`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        
        if (data && data.features && data.features.length > 0) {
            const feature = data.features[0];
            const lng = feature.geometry.coordinates[0];
            const lat = feature.geometry.coordinates[1];
            
            const props = feature.properties;
            const formattedAddress = [props.name, props.city, props.state, props.country]
                .filter(Boolean)
                .join(", ");

            const newCoords = { lat: parseFloat(lat), lng: parseFloat(lng) };
            
            setCoordinates(newCoords);
            setIsLocationSelected(true);
            
            if (!propertyAddress) setPropertyAddress(formattedAddress);
        } else {
            alert("Location not found. Try adding city/state name.");
        }
    } catch (error) {
        console.error("Search failed:", error);
        alert("Search failed. Please drag/click pin on map manually.");
    } finally {
        setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setStatus("Fetching location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setIsLocationSelected(true);
        setStatus(null);
      },
      (error) => setStatus("❌ Location error.")
    );
  };

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
        alert("You can only select up to 3 images.");
        setImages(files.slice(0, 3));
    } else {
        setImages(files);
    }
  };

  const handleDocumentsChange = (e) => {
    const files = Array.from(e.target.files || []);
    setDocuments(files);
  };

  // 🔴 MAIN REGISTRATION FUNCTION
  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIpfsLink("");
    setTxHash("");

    if (!isWalletConnected) return setStatus("Please connect wallet.");
    if (images.length !== 3) return setStatus("Please upload exactly 3 property images.");
    if (!aadhaarNumber) return setStatus("Aadhaar Number is required for verification.");
    if (!isLocationSelected) return setStatus("Please pin location on map.");

    try {
      setIsSubmitting(true);
      
      // 1. Upload Images
      setStatus("Uploading images to IPFS...");
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadFileToIPFS(img);
        if(url) imageUrls.push(url);
      }
      if(imageUrls.length === 0) throw new Error("Image upload failed");

      // 2. Upload Metadata
      setStatus("Creating digital record...");
      const metadata = {
        name: ownerName,
        description: description,
        image: imageUrls[0], 
        additionalImages: imageUrls,
        attributes: [
            { trait_type: "Address", value: propertyAddress },
            { trait_type: "Area", value: `${area} Sq Ft` },
            { trait_type: "Type", value: propertyType },
            { trait_type: "Latitude", value: coordinates.lat },
            { trait_type: "Longitude", value: coordinates.lng },
            { trait_type: "Purpose", value: registrationPurpose }
        ],
        createdAt: new Date().toISOString()
      };

      const metadataURL = await uploadJSONToIPFS(metadata);
      if(!metadataURL) throw new Error("Metadata upload failed");
      
      // 3. Generate Identity Hash
      const identityHash = id(aadhaarNumber); 

      // 4. Smart Contract Interaction
      setStatus("Waiting for wallet signature (Fee: 0.001 ETH)...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      // ✅ 5. FIX: Added 'ownerName' to match the latest Smart Contract
      const tx = await contract.requestRegistration(
          ownerName,           // 🆕 Added Owner Name
          metadataURL, 
          identityHash, 
          area.toString(),     
          propertyAddress,     
          {
             value: parseEther("0.001") 
          }
      );

      setStatus("Confirming Transaction on Blockchain...");
      await tx.wait();

      setIpfsLink(metadataURL); 
      setTxHash(tx.hash);

      setStatus("✅ Request Submitted Successfully! Waiting for Govt Verification.");

    } catch (err) {
      console.error(err);
      setStatus("❌ Registration failed. " + (err.reason || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const PurposeButton = ({ label, value }) => {
    const isSelected = registrationPurpose === value;
    return (
      <button
        type="button"
        onClick={() => setRegistrationPurpose(value)}
        className={`relative w-full px-4 py-3 text-sm font-medium rounded-xl border transition-all duration-300 ${
          isSelected
            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent shadow-lg"
            : "bg-zinc-900/50 border-zinc-700 text-gray-400 hover:text-cyan-100"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <section className="relative flex items-center justify-center px-8 py-16 overflow-hidden min-h-screen bg-black text-white">
      
      {/* 🔥 MODERN FULL SCREEN LOADER */}
      {isSubmitting && <TransactionLoader statusText={status} />}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-700/30 blur-3xl" />
        <div className="absolute left-10 top-10 h-72 w-72 border border-cyan-500/40 rounded-[40px] -rotate-6 opacity-40" />
      </div>

      <div className="relative max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-start pt-16">
        
        {/* LEFT SIDE */}
        <div className="space-y-4 lg:sticky lg:top-24 h-fit">
          <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400">REGISTER ON‑CHAIN</p>
          <h1 className="text-3xl md:text-4xl font-bold">
            Register a new <span className="block text-cyan-400">verified property record</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base">
              Store details securely on IPFS & Blockchain. (Fee: 0.001 ETH)
          </p>

          {!isWalletConnected && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              Please connect your wallet.
            </div>
          )}

          {(ipfsLink || txHash) && !isSubmitting && (
            <div className="mt-6 space-y-4 bg-zinc-900/90 border border-cyan-500/30 rounded-xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-white">Request Pending Approval</span>
              </div>

              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1 flex justify-between">
                    <span>🌍 IPFS Link (For Viewing)</span>
                    <span className="text-cyan-500 text-[9px] bg-cyan-500/10 px-1 rounded">PUBLIC VIEW</span>
                </p>
                <div className="flex items-center gap-2 bg-black/60 rounded-lg p-2 border border-white/10 hover:border-cyan-500/50 transition">
                    <span className="text-xs text-cyan-300 truncate flex-1 font-mono">{ipfsLink}</span>
                    <button onClick={() => navigator.clipboard.writeText(ipfsLink)} className="text-[10px] bg-cyan-600 px-3 py-1.5 rounded text-white font-bold hover:bg-cyan-500 transition">COPY</button>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1 flex justify-between">
                    <span>🔗 Request Hash</span>
                    <span className="text-purple-500 text-[9px] bg-purple-500/10 px-1 rounded">PROOF</span>
                </p>
                <div className="flex items-center gap-2 bg-black/60 rounded-lg p-2 border border-white/10 hover:border-purple-500/50 transition">
                    <span className="text-xs text-purple-300 truncate flex-1 font-mono">{txHash}</span>
                    <button onClick={() => navigator.clipboard.writeText(txHash)} className="text-[10px] bg-purple-600 px-3 py-1.5 rounded text-white font-bold hover:bg-purple-500 transition">COPY</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="relative">
          <div className="rounded-3xl bg-zinc-900/80 backdrop-blur-md border border-white/10 p-6 md:p-8 shadow-2xl">
            <h2 className="text-lg font-semibold mb-6 text-white border-b border-white/5 pb-4">Property Registration Form</h2>

            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs text-cyan-300 font-semibold uppercase">Select Purpose</label>
                <div className="grid grid-cols-2 gap-3">
                  <PurposeButton label="Ownership Claim" value="Ownership" />
                  <PurposeButton label="Government" value="Government" />
                </div>
              </div>

              <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-500 font-bold">Aadhaar Number (Confidential)</label>
                  <input 
                      type="text" 
                      value={aadhaarNumber} 
                      onChange={(e) => setAadhaarNumber(e.target.value)} 
                      required 
                      className="w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors" 
                      placeholder="XXXX-XXXX-XXXX" 
                  />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Owner Name</label>
                    <input 
                        type="text" 
                        value={ownerName} 
                        onChange={(e) => setOwnerName(e.target.value)} 
                        required 
                        disabled={registrationPurpose === "Government"}
                        className={`w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors ${registrationPurpose === "Government" ? "text-amber-400 font-bold cursor-not-allowed" : ""}`} 
                        placeholder="e.g. Rohit Kumar" 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Property Type</label>
                    <div className="relative">
                        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 appearance-none transition-colors cursor-pointer">
                            <option>Residential</option><option>Commercial</option><option>Plot</option><option>Industrial</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-cyan-300 font-semibold uppercase">Pin Exact Location</label>
                
                <div className="flex items-center gap-2 bg-black/50 border border-zinc-700 p-1 rounded-xl focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
                    <div className="pl-3 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        className="flex-1 bg-transparent border-none text-sm text-white focus:ring-0 focus:outline-none placeholder-gray-600 h-10"
                        placeholder="Search address (e.g. Patna, Bihar)..." 
                    />
                    <button type="button" onClick={handleManualSearch} disabled={isSearching} className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition focus:outline-none focus:ring-0">
                        {isSearching ? "..." : "Find"}
                    </button>
                    <button type="button" onClick={handleCurrentLocation} className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition focus:outline-none focus:ring-0" title="Use My Location">📍</button>
                </div>

                <div className="h-72 rounded-2xl overflow-hidden border border-zinc-700 relative z-0 shadow-inner group hover:border-zinc-500 transition-colors">
                    <MapContainer center={coordinates} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapController coords={isLocationSelected ? coordinates : null} />
                        <LocationMarker />
                    </MapContainer>
                    
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-white/10 z-[1000]">
                        <span className={`text-[10px] font-bold ${isLocationSelected ? "text-green-400" : "text-amber-400"}`}>
                            {isLocationSelected ? "● PINNED" : "○ UNPINNED"}
                        </span>
                    </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Address</label>
                    <input type="text" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} required className="w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors" placeholder="Full Address" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-gray-500 font-bold">Area</label>
                    <input type="number" value={area} onChange={(e) => setArea(e.target.value)} required className="w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors" placeholder="Sq Ft" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="w-full rounded-xl bg-black/50 border border-zinc-700 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 resize-none transition-colors" placeholder="Property features..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition group relative overflow-hidden ${images.length === 3 ? "border-green-500 bg-green-900/10" : "border-zinc-700 bg-black/30 hover:border-cyan-500 hover:bg-cyan-500/5"}`}
                    onClick={() => document.getElementById("img-input").click()}
                  >
                      <input id="img-input" type="file" accept="image/*" multiple onChange={handleImagesChange} className="hidden" />
                      {images.length > 0 ? (
                          <>
                            <div className="text-2xl mb-1">✅</div>
                            <p className="text-xs text-green-400 font-bold">{images.length} Images Selected</p>
                            <p className="text-[9px] text-gray-500 mt-1 truncate">{images[0]?.name}...</p>
                          </>
                      ) : (
                          <>
                            <div className="text-2xl mb-2 group-hover:scale-110 transition">📸</div>
                            <p className="text-xs text-gray-400 group-hover:text-cyan-400 font-medium">Upload Images (3)</p>
                          </>
                      )}
                  </div>

                  <div 
                    className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition group relative overflow-hidden ${documents.length > 0 ? "border-green-500 bg-green-900/10" : "border-zinc-700 bg-black/30 hover:border-cyan-500 hover:bg-cyan-500/5"}`}
                    onClick={() => document.getElementById("doc-input").click()}
                  >
                      <input id="doc-input" type="file" accept=".pdf,image/*" multiple onChange={handleDocumentsChange} className="hidden" />
                      {documents.length > 0 ? (
                          <>
                            <div className="text-2xl mb-1">✅</div>
                            <p className="text-xs text-green-400 font-bold">Document Added</p>
                            <p className="text-[9px] text-gray-500 mt-1 truncate">{documents[0]?.name}</p>
                          </>
                      ) : (
                          <>
                            <div className="text-2xl mb-2 group-hover:scale-110 transition">📄</div>
                            <p className="text-xs text-gray-400 group-hover:text-cyan-400 font-medium">Upload Docs</p>
                          </>
                      )}
                  </div>
              </div>

              <button type="submit" disabled={isSubmitting || !isWalletConnected} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]">
                SUBMIT APPLICATION (0.001 ETH)
              </button>

              {status && !isSubmitting && (
                <div className={`p-3 rounded-lg text-center text-xs font-medium border ${status.includes("✅") ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                    {status}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blockchain;