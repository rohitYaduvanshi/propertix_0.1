import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  LayersControl,
  Polygon,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import { uploadFileToIPFS } from "../utils/ipfs"; 

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 🌟 CLEAN ICONS
const createCustomIcon = (type) => {
  const styles = {
      sale: { bg: "bg-blue-600", icon: "💰" },
      lease: { bg: "bg-purple-600", icon: "🔑" },
      government: { bg: "bg-amber-500", icon: "🏛️" },
      private: { bg: "bg-emerald-500", icon: "🏠" }
  };
  const current = styles[type] || { bg: "bg-gray-500", icon: "📍" };
  const iconHtml = `<div class="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white shadow-xl ${current.bg} text-white text-lg hover:scale-110 transition-transform">${current.icon}</div>`;
  return new L.DivIcon({ className: "bg-transparent border-none", html: iconHtml, iconSize: [40, 40], iconAnchor: [20, 40], popupAnchor: [0, -40] });
};

const generateMockBoundary = (lat, lng) => {
    const offset = 0.0008; 
    return [[lat + offset, lng - offset], [lat + offset, lng + offset], [lat - offset, lng + offset], [lat - offset, lng - offset]];
};

const PropertyMap = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "all", search: "" });
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, type: null }); 
  const [formData, setFormData] = useState({ name: "", aadhaarFront: null, aadhaarBack: null });

  const { walletAddress } = useAuth();

  // --- 🛠️ CRITICAL FIX: DATA FETCHING LOGIC ---
  const fetchProperties = async () => {
    if (!window.ethereum) return;
    try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
        const requests = await contract.getAllRequests();

        const mapped = await Promise.all(requests.map(async (req) => {
            let meta = { name: "Plot Record", attributes: [] };
            if (req.ipfsMetadata && req.ipfsMetadata.startsWith("http")) {
                try {
                    const res = await fetch(req.ipfsMetadata, { timeout: 5000 });
                    if (res.ok) meta = await res.json();
                } catch (e) { console.warn("Metadata skip ID:", req.id); }
            }

            // ✨ FLEXIBLE ATTRIBUTE HELPER (Fixes hidden properties)
            const findVal = (key) => {
                const fromAttr = meta.attributes?.find(a => a.trait_type?.toLowerCase() === key.toLowerCase())?.value;
                return fromAttr || meta[key] || meta[key.toLowerCase()] || meta.location?.[key] || meta.location?.[key.toLowerCase()];
            };

            const lat = parseFloat(findVal("Latitude") || findVal("lat"));
            const lng = parseFloat(findVal("Longitude") || findVal("lng"));

            // अगर Latitude/Longitude नहीं मिला, तो मैप पर नहीं दिखाएगा
            if (isNaN(lat) || isNaN(lng)) return null;

            const isApproved = Number(req.status) === 2;
            const saleStatus = Number(req.saleStatus);
            
            // Map logic: Verified (Status 2) properties are always visible
            if (!isApproved) return null;

            let uiStatus = 'private';
            if (findVal("Purpose") === 'Government') uiStatus = 'government';
            else if (saleStatus === 1) uiStatus = 'sale';
            else if (saleStatus === 2) uiStatus = 'lease';
            
            return {
                id: req.id.toString(),
                lat, lng, status: uiStatus,
                type: findVal("Type") || "Residential",
                price: req.price ? formatEther(req.price) : "0", 
                leasePrice: req.leasePrice ? formatEther(req.leasePrice) : "0", 
                area: findVal("Area") || "N/A",
                owner: req.requester, 
                ownerName: req.ownerName || meta.name || "Owner", 
                address: findVal("Address") || req.propertyAddress || "Verified Site",
                image: meta.image,
                isVerified: true,
                boundary: generateMockBoundary(lat, lng) 
            };
        }));
        setProperties(mapped.filter(p => p !== null));
    } catch (err) { console.error("Blockchain Fetch Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProperties(); }, []);

  useEffect(() => {
    const filtered = properties.filter((prop) => {
      const statusMatch = filters.status === "all" || prop.status === filters.status;
      const searchMatch = prop.address.toLowerCase().includes(filters.search.toLowerCase()) || 
                          prop.ownerName.toLowerCase().includes(filters.search.toLowerCase());
      return statusMatch && searchMatch;
    });
    setFilteredProperties(filtered);
  }, [properties, filters]);

  // --- TRANSACTIONS ---
  const processTransaction = async (e) => {
    e.preventDefault();
    try {
        setTransactionLoading(true);
        const amount = actionModal.type === 'SALE' ? selectedProperty.price : selectedProperty.leasePrice;
        const confirm = window.confirm(`Confirm payment of ${amount} ETH?`);
        if (!confirm) return setTransactionLoading(false);

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

        let tx;
        if (actionModal.type === 'SALE') {
            tx = await contract.buyProperty(selectedProperty.id, formData.name, { value: parseEther(amount) });
        } else {
            tx = await contract.rentProperty(selectedProperty.id, { value: parseEther(amount) });
        }

        await tx.wait();
        alert("🎉 Success!");
        setActionModal({ show: false, type: null });
        setSelectedProperty(null);
        fetchProperties();
    } catch (error) { alert("Failed: " + (error.reason || error.message)); }
    finally { setTransactionLoading(false); }
  };

  const themeColors = {
    sale: { bg: "bg-blue-600", text: "text-blue-500", badge: "bg-blue-600 text-white", hex: "#2563eb" },
    lease: { bg: "bg-purple-600", text: "text-purple-500", badge: "bg-purple-600 text-white", hex: "#9333ea" },
    private: { bg: "bg-emerald-600", text: "text-emerald-500", badge: "bg-emerald-600 text-white", hex: "#059669" },
    government: { bg: "bg-amber-500", text: "text-amber-500", badge: "bg-amber-500 text-white", hex: "#d97706" }
  };

  return (
    <div className="flex-1 w-full flex flex-col-reverse md:flex-row relative z-0 bg-black h-screen overflow-hidden">
      
      {/* SIDEBAR */}
      <div className={`bg-zinc-950 border-r border-white/5 z-[1001] md:z-20 flex flex-col w-full md:w-[400px] absolute md:relative h-full transition-transform ${isMobileListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
           <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
               <h1 className="text-xl font-black text-white uppercase mb-6 tracking-tighter">Market Ledger</h1>
               <input type="text" placeholder="Search location or owner..." className="w-full py-3.5 px-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white text-sm outline-none focus:border-cyan-500 mb-6" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
               
               <div className="space-y-3">
                  {filteredProperties.map(prop => (
                      <div key={prop.id} onClick={() => { setSelectedProperty(prop); setIsMobileListOpen(false); }} className="bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 p-4 rounded-2xl cursor-pointer transition-all">
                          <div className="flex justify-between items-start mb-2">
                              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${themeColors[prop.status].badge}`}>{prop.status}</span>
                              <span className="text-xs font-bold text-cyan-400">{prop.status === 'sale' ? `${prop.price} ETH` : `${prop.leasePrice} ETH/mo`}</span>
                          </div>
                          <h4 className="text-white font-bold text-sm truncate">{prop.address}</h4>
                      </div>
                  ))}
               </div>
           </div>
      </div>

      {/* MAP */}
      <div className="flex-1 relative h-full w-full z-0">
        <button onClick={() => setIsMobileListOpen(!isMobileListOpen)} className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-[1002] bg-white text-black px-8 py-3.5 rounded-full font-black shadow-2xl text-xs uppercase tracking-widest transition-transform active:scale-95">
          {isMobileListOpen ? "✕ Close List" : "📋 View List"}
        </button>

        <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite View"><TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" /></LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Standard Map"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
          </LayersControl>

          {filteredProperties.map((prop) => (
            <div key={prop.id}>
                <Marker position={[prop.lat, prop.lng]} icon={createCustomIcon(prop.status)} eventHandlers={{ click: () => setSelectedProperty(prop) }}>
                   <Tooltip direction="top" offset={[0, -20]}><div className="font-bold text-[10px] uppercase">{prop.ownerName}</div></Tooltip>
                </Marker>
                <Polygon positions={prop.boundary} pathOptions={{ color: themeColors[prop.status].hex, fillOpacity: 0.2, weight: 2 }} eventHandlers={{ click: () => setSelectedProperty(prop) }} />
            </div>
          ))}
        </MapContainer>
      </div>

      {/* DETAIL MODAL */}
      {selectedProperty && !actionModal.show && (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in slide-in-from-bottom-10">
              <div className="bg-zinc-900 border border-white/10 rounded-t-[40px] md:rounded-[32px] w-full md:max-w-md overflow-hidden relative">
                  <button onClick={() => setSelectedProperty(null)} className="absolute top-6 right-6 text-white bg-white/10 w-10 h-10 rounded-full flex items-center justify-center z-10">✕</button>
                  {selectedProperty.image && <img src={selectedProperty.image} className="w-full h-48 object-cover opacity-80" alt="" />}
                  <div className="p-8">
                      <div className="flex gap-3 mb-4">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${themeColors[selectedProperty.status].badge}`}>{selectedProperty.status}</span>
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">VERIFIED</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">{selectedProperty.type} <span className="text-zinc-600 text-sm">#{selectedProperty.id}</span></h2>
                      <p className="text-gray-400 text-sm mb-8 truncate">📍 {selectedProperty.address}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-black/40 p-4 rounded-2xl text-center"><span className="text-[8px] text-zinc-500 font-black uppercase block">Market Price</span><p className="text-lg font-black text-white">{selectedProperty.status === 'sale' ? `${selectedProperty.price} ETH` : selectedProperty.status === 'lease' ? `${selectedProperty.leasePrice} ETH/mo` : 'Private'}</p></div>
                          <div className="bg-black/40 p-4 rounded-2xl text-center"><span className="text-[8px] text-zinc-500 font-black uppercase block">Total Area</span><p className="text-lg font-black text-white">{selectedProperty.area} <span className="text-[10px] opacity-40">Sq.Ft</span></p></div>
                      </div>

                      {walletAddress?.toLowerCase() === selectedProperty.owner.toLowerCase() ? (
                          <button className="w-full font-black py-5 rounded-2xl bg-zinc-800 text-zinc-500 uppercase text-[11px] cursor-not-allowed">You Own This Property</button>
                      ) : (
                          selectedProperty.status === 'sale' ? <button onClick={() => setActionModal({show:true, type:'SALE'})} className="w-full font-black py-5 rounded-2xl bg-blue-600 text-white uppercase text-[11px]">Buy Ownership</button> :
                          selectedProperty.status === 'lease' ? <button onClick={() => setActionModal({show:true, type:'LEASE'})} className="w-full font-black py-5 rounded-2xl bg-purple-600 text-white uppercase text-[11px]">Start Lease</button> :
                          <button className="w-full font-black py-5 rounded-2xl bg-zinc-800 text-zinc-500 uppercase text-[11px] cursor-not-allowed">Private</button>
                      )}
                  </div>
              </div>
            </div>
      )}

      {/* ACTION MODAL (Same as your logic) */}
      {actionModal.show && (
          <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-white/10 rounded-[32px] w-full max-w-sm p-8 shadow-3xl">
                  <h3 className="text-2xl font-black text-white mb-2">{actionModal.type === 'SALE' ? "Buy Land" : "Lease Land"}</h3>
                  <form onSubmit={processTransaction} className="space-y-6">
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white outline-none" required placeholder="Enter Full Name" />
                      <button type="submit" className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest ${actionModal.type === 'SALE' ? 'bg-blue-600' : 'bg-purple-600'}`}>Confirm & Pay</button>
                      <button type="button" onClick={() => setActionModal({ show: false, type: null })} className="w-full text-[10px] font-black text-zinc-600 uppercase">Cancel</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default PropertyMap;