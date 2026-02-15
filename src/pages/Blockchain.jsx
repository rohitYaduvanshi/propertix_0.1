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

// 🔥 MODERN TRANSACTION LOADER COMPONENT (Responsive)
const TransactionLoader = ({ statusText }) => (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-cyan-600/20 blur-[100px] rounded-full"></div>
        <div className="relative flex items-center justify-center z-10 mb-8">
            <div className="absolute w-20 h-20 md:w-24 md:h-24 border-t-2 border-r-2 border-cyan-400 rounded-full animate-spin"></div>
            <div className="absolute w-12 h-12 md:w-16 md:h-16 border-b-2 border-l-2 border-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-tr from-cyan-400 to-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.8)]"></div>
        </div>
        <h2 className="text-base md:text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse z-10 uppercase">
            {statusText || "PROCESSING TRANSACTION..."}
        </h2>
        <p className="mt-4 text-[10px] md:text-xs text-gray-400 font-mono z-10 leading-relaxed max-w-xs">
            Confirm in wallet and wait. <br/>
            <span className="text-emerald-500 font-bold">Do not close this window.</span>
        </p>
    </div>
);

const Blockchain = () => {
  const { isWalletConnected } = useAuth();
  const [registrationPurpose, setRegistrationPurpose] = useState("Ownership");
  const [ownerName, setOwnerName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [description, setDescription] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 20.5937, lng: 78.9629 });
  const [isLocationSelected, setIsLocationSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState(null);
  const [ipfsLink, setIpfsLink] = useState(""); 
  const [txHash, setTxHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (coords) map.setView([coords.lat, coords.lng], 16, { animate: true });
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
        const data = await response.json();
        if (data?.features?.length > 0) {
            const feature = data.features[0];
            const [lng, lat] = feature.geometry.coordinates;
            const props = feature.properties;
            const formattedAddress = [props.name, props.city, props.state].filter(Boolean).join(", ");
            setCoordinates({ lat, lng });
            setIsLocationSelected(true);
            if (!propertyAddress) setPropertyAddress(formattedAddress);
        } else {
            alert("Location not found.");
        }
    } catch (error) {
        alert("Search failed. Select manually on map.");
    } finally {
        setIsSearching(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isWalletConnected) return setStatus("Please connect wallet.");
    if (images.length !== 3) return setStatus("Upload exactly 3 images.");
    if (!isLocationSelected) return setStatus("Pin location on map.");

    try {
      setIsSubmitting(true);
      setStatus("Uploading to IPFS...");
      const imageUrls = [];
      for (let img of images) {
        const url = await uploadFileToIPFS(img);
        if(url) imageUrls.push(url);
      }
      
      const metadata = {
        name: ownerName,
        description,
        attributes: [
            { trait_type: "Address", value: propertyAddress },
            { trait_type: "Area", value: area },
            { trait_type: "Latitude", value: coordinates.lat },
            { trait_type: "Longitude", value: coordinates.lng }
        ]
      };

      const metadataURL = await uploadJSONToIPFS(metadata);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

      setStatus("Sign transaction (0.001 ETH)...");
      const tx = await contract.requestRegistration(
          ownerName, metadataURL, id(aadhaarNumber), area.toString(), propertyAddress,
          { value: parseEther("0.001") }
      );

      setStatus("Confirming on Blockchain...");
      await tx.wait();
      setIpfsLink(metadataURL); 
      setTxHash(tx.hash);
      setStatus("✅ Success! Request Submitted.");
    } catch (err) {
      setStatus("❌ Failed: " + (err.reason || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const PurposeButton = ({ label, value }) => (
    <button type="button" onClick={() => setRegistrationPurpose(value)}
      className={`w-full px-3 py-3 text-[11px] font-bold rounded-xl border transition-all ${
        registrationPurpose === value ? "bg-cyan-600 text-white border-transparent shadow-lg" : "bg-zinc-900/50 border-zinc-700 text-gray-400"
      }`}
    >
      {label}
    </button>
  );

  return (
    // Updated: Changed h-screen to min-h-screen and items-center to items-start for scrolling
    <section className="relative flex items-start justify-center px-4 md:px-8 py-24 min-h-screen bg-black text-white overflow-x-hidden">
      
      {isSubmitting && <TransactionLoader statusText={status} />}

      <div className="relative max-w-6xl w-full grid lg:grid-cols-2 gap-10">
        
        {/* LEFT SIDE: Info (Responsive Sticky) */}
        <div className="space-y-4 lg:sticky lg:top-24 h-fit">
          <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">PROPERTIX NODE</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Register your <span className="text-cyan-400">Digital Land</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-sm">Immutable ownership powered by Blockchain & IPFS.</p>

          {(ipfsLink || txHash) && !isSubmitting && (
            <div className="mt-6 p-4 bg-zinc-900/90 border border-cyan-500/30 rounded-2xl space-y-3 animate-in slide-in-from-bottom-5">
               <p className="text-[10px] font-bold text-emerald-400">✅ TRANSACTION COMPLETE</p>
               <div className="text-[9px] font-mono text-gray-500 break-all bg-black/50 p-2 rounded">Hash: {txHash}</div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: FORM (Responsive container) */}
        <div className="relative w-full">
          <div className="rounded-2xl md:rounded-3xl bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-5 md:p-8 shadow-3xl">
            <form onSubmit={handleRegister} className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-cyan-500 font-black">Registration Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <PurposeButton label="Private Ownership" value="Ownership" />
                  <PurposeButton label="Govt Allocation" value="Government" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-500 font-bold">Aadhaar No</label>
                  <input type="text" value={aadhaarNumber} onChange={(e)=>setAadhaarNumber(e.target.value)} required className="w-full rounded-xl bg-black/40 border border-zinc-800 px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all" placeholder="XXXX-XXXX-XXXX" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-500 font-bold">Full Name</label>
                  <input type="text" value={ownerName} onChange={(e)=>setOwnerName(e.target.value)} disabled={registrationPurpose === "Government"} className="w-full rounded-xl bg-black/40 border border-zinc-800 px-4 py-3 text-sm focus:border-cyan-500 outline-none disabled:opacity-50" placeholder="Rohit Kumar" />
                </div>
              </div>

              {/* MAP SECTION (Responsive height) */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-cyan-500 font-black">Geolocation</label>
                <div className="flex gap-1">
                  <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs outline-none" placeholder="Search city..." />
                  <button type="button" onClick={handleManualSearch} className="bg-zinc-800 px-4 rounded-lg text-[10px] font-bold">FIND</button>
                </div>
                <div className="h-52 md:h-64 rounded-xl overflow-hidden border border-zinc-800 z-0">
                  <MapContainer center={coordinates} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController coords={isLocationSelected ? coordinates : null} />
                    <LocationMarker />
                  </MapContainer>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" value={propertyAddress} onChange={(e)=>setPropertyAddress(e.target.value)} required className="w-full rounded-xl bg-black/40 border border-zinc-800 px-4 py-3 text-sm focus:border-cyan-500 outline-none" placeholder="Property Address" />
                <input type="number" value={area} onChange={(e)=>setArea(e.target.value)} required className="w-full rounded-xl bg-black/40 border border-zinc-800 px-4 py-3 text-sm focus:border-cyan-500 outline-none" placeholder="Area (Sq Ft)" />
              </div>

              {/* UPLOAD SECTION (Stacked on mobile) */}
              <div className="grid grid-cols-2 gap-3">
                 <div onClick={()=>document.getElementById('img-up').click()} className="border border-dashed border-zinc-700 rounded-xl p-4 text-center hover:border-cyan-500 transition cursor-pointer">
                    <input id="img-up" type="file" multiple hidden onChange={(e)=>setImages(Array.from(e.target.files).slice(0,3))} />
                    <span className="text-[10px] font-bold text-gray-500">{images.length > 0 ? `✅ ${images.length} IMAGES` : "📸 PHOTOS (3)"}</span>
                 </div>
                 <div onClick={()=>document.getElementById('doc-up').click()} className="border border-dashed border-zinc-700 rounded-xl p-4 text-center hover:border-cyan-500 transition cursor-pointer">
                    <input id="doc-up" type="file" hidden onChange={(e)=>setDocuments([e.target.files[0]])} />
                    <span className="text-[10px] font-bold text-gray-500">{documents.length > 0 ? "✅ DOC READY" : "📄 PDF DOC"}</span>
                 </div>
              </div>

              <button type="submit" disabled={isSubmitting || !isWalletConnected} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[11px] rounded-xl tracking-tighter transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                SUBMIT FOR VERIFICATION (0.001 ETH)
              </button>

              {status && !isSubmitting && (
                <div className="text-[10px] font-bold text-center text-cyan-400 animate-pulse">{status}</div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Blockchain;