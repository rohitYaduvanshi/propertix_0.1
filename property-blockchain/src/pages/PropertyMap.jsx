import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  LayersControl,
  Polygon,
  Popup
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Map as MapIcon, Layers, Info, CreditCard, Search, Globe } from "lucide-react";

// --- 1. LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const themeColors = {
    sale: { text: "text-red-400", bg: "bg-red-950/40 border-red-500/30 text-red-400", hex: "#ef4444", badge: "bg-red-500/10 border border-red-500/20 text-red-400", icon: "💰" },
    lease: { text: "text-purple-400", bg: "bg-purple-950/40 border-purple-500/30 text-purple-400", hex: "#a855f7", badge: "bg-purple-500/10 border border-purple-500/20 text-purple-400", icon: "🔑" },
    private: { text: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-500/30 text-emerald-400", hex: "#10b981", badge: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400", icon: "🏠" },
    government: { text: "text-amber-400", bg: "bg-amber-950/40 border-amber-500/30 text-amber-400", hex: "#f59e0b", badge: "bg-amber-500/10 border border-amber-500/20 text-amber-400", icon: "🏛️" }
};

const createCustomIcon = (type) => {
  const current = themeColors[type] || { bg: "bg-gray-500", icon: "📍" };
  const colorClass = type === 'sale' ? 'bg-red-500' : type === 'lease' ? 'bg-purple-500' : type === 'government' ? 'bg-amber-500' : 'bg-emerald-500';
  return new L.DivIcon({
    className: "bg-transparent",
    html: `<div class="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white/90 shadow-xl ${colorClass} text-white text-base hover:scale-110 transition-all">${current.icon}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
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
  const [formData, setFormData] = useState({ name: "" });

  const { walletAddress, isWalletConnected } = useAuth();

  const fetchProperties = async () => {
    if (!window.ethereum) return;
    try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
        const requests = await contract.getAllRequests();

        const mapped = await Promise.all(requests.map(async (req) => {
            let meta = { attributes: [] };
            
            // Only show properties that are status 3 (Approved & Minted)
            if (Number(req.status) !== 3) return null;

            try {
                const res = await fetch(req.ipfsMetadata);
                if (res.ok) meta = await res.json();
            } catch (e) { console.warn("Meta skip ID:", req.id); }

            const findVal = (key) => meta.attributes?.find(a => a.trait_type?.toLowerCase() === key.toLowerCase())?.value || meta[key] || meta.location?.[key];

            const lat = parseFloat(findVal("Latitude") || meta.location?.lat);
            const lng = parseFloat(findVal("Longitude") || meta.location?.lng);
            
            if (isNaN(lat) || isNaN(lng)) return null;

            let uiStatus = 'private';
            if (meta.purpose === 'Government') uiStatus = 'government';
            else if (Number(req.saleStatus) === 1) uiStatus = 'sale';
            else if (Number(req.saleStatus) === 2) uiStatus = 'lease';
            
            return {
                id: req.id.toString(),
                lat, lng, status: uiStatus,
                type: findVal("Type") || "Plot",
                price: formatEther(req.price || 0), 
                leasePrice: formatEther(req.leasePrice || 0), 
                area: req.landArea || "N/A",
                khasra: req.khasraNumber, 
                owner: req.requester, 
                ownerName: req.ownerName, 
                address: req.landLocation,
                image: meta.images?.[0] || meta.image,
                boundary: generateMockBoundary(lat, lng) 
            };
        }));
        setProperties(mapped.filter(p => p !== null));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProperties(); }, []);

  useEffect(() => {
    const filtered = properties.filter((prop) => {
      const statusMatch = filters.status === "all" || prop.status === filters.status;
      const searchMatch = prop.address.toLowerCase().includes(filters.search.toLowerCase()) || 
                          prop.khasra.toLowerCase().includes(filters.search.toLowerCase());
      return statusMatch && searchMatch;
    });
    setFilteredProperties(filtered);
  }, [properties, filters]);

  const processTransaction = async (e) => {
    e.preventDefault();
    if (!isWalletConnected) return alert("Please connect wallet and link Identity first.");
    
    try {
        setTransactionLoading(true);
        const amount = actionModal.type === 'SALE' ? selectedProperty.price : selectedProperty.leasePrice;
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

        let tx = actionModal.type === 'SALE' 
            ? await contract.buyProperty(selectedProperty.id, formData.name, { value: parseEther(amount) })
            : await contract.rentProperty(selectedProperty.id, { value: parseEther(amount) });

        await tx.wait();
        alert("🎉 Ownership Verified on Blockchain!");
        setActionModal({ show: false, type: null });
        setSelectedProperty(null);
        fetchProperties();
    } catch (error) { 
        alert("Transaction Failed: " + (error.reason || "Make sure your wallet is linked to your Aadhaar.")); 
    } finally { 
        setTransactionLoading(false); 
    }
  };

  return (
    <div className="flex w-full bg-[#030712] h-screen overflow-hidden relative font-sans pt-20">
      
      {/* SIDEBAR */}
      <div className={`bg-zinc-950/60 border-r border-white/5 z-[999] flex flex-col w-full md:w-[400px] absolute md:relative h-full backdrop-blur-xl transition-transform duration-300 ${isMobileListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
           <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
               <div>
                   <p className="text-[10px] font-medium text-cyan-400 uppercase tracking-[0.3em] mb-2 italic">Registry_Explorer_v3</p>
                   <h1 className="text-2xl font-semibold text-white uppercase tracking-wider">Market Ledger</h1>
               </div>
               
               {/* Filters */}
               <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar bg-white/[0.02] border border-white/[0.04] p-1 rounded-full">
                   {['all', 'sale', 'lease', 'government'].map(s => (
                       <button key={s} onClick={() => setFilters({...filters, status: s})} className={`flex-1 px-4 py-2 rounded-full text-[9px] font-medium uppercase tracking-wider transition-all duration-300 ${filters.status === s ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-md' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{s}</button>
                   ))}
               </div>

               <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input type="text" placeholder="Search by Khasra or location..." className="w-full py-3 pl-11 pr-4 bg-zinc-900/40 border border-zinc-800 rounded-xl text-white text-xs font-medium outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-600 tracking-wide" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
               </div>
               
               {loading ? (
                   <div className="flex items-center gap-3 text-zinc-500 text-[10px] font-medium uppercase tracking-widest animate-pulse py-10"><div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></div> Syncing Neural Nodes...</div>
               ) : (
                <div className="space-y-3 pb-20">
                    {filteredProperties.length === 0 && <p className="text-zinc-600 text-[10px] font-medium uppercase tracking-widest text-center py-20">No verified assets found.</p>}
                    {filteredProperties.map(prop => (
                        <div key={prop.id} onClick={() => { setSelectedProperty(prop); setIsMobileListOpen(false); }} className={`bg-zinc-900/10 hover:bg-zinc-900/30 border border-white/5 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] ${selectedProperty?.id === prop.id ? 'border-cyan-500/30 bg-zinc-900/40' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-medium uppercase px-2.5 py-0.5 rounded-full ${themeColors[prop.status].badge}`}>{prop.status}</span>
                                <span className="text-[10px] font-semibold text-cyan-400 font-mono tracking-tight">{prop.status === 'sale' ? `${prop.price} ETH` : prop.status === 'lease' ? `${prop.leasePrice} ETH/mo` : 'VERIFIED'}</span>
                            </div>
                            <h4 className="text-zinc-200 font-semibold text-xs uppercase tracking-wider transition-colors truncate">{prop.address}</h4>
                            <div className="flex items-center gap-2 mt-2 text-[9px] font-medium text-zinc-500 uppercase tracking-widest">
                                <span>KHASRA: <span className="text-zinc-300 font-mono">#{prop.khasra}</span></span>
                                <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
                                <span>{prop.ownerName.split(' ')[0]}</span>
                            </div>
                        </div>
                    ))}
                </div>
               )}
           </div>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative h-full bg-zinc-950">
        <button onClick={() => setIsMobileListOpen(!isMobileListOpen)} className="md:hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-[1002] bg-gradient-to-r from-cyan-600 to-indigo-600 text-white px-8 py-3.5 rounded-full font-medium shadow-2xl text-[9px] uppercase tracking-widest active:scale-95 transition-all">
          {isMobileListOpen ? "✕ CLOSE LEDGER" : "📋 VIEW MARKET"}
        </button>

        <MapContainer center={[20.59, 78.96]} zoom={5} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="🛰️ Satellite View">
                <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🗺️ Standard Map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🏔️ Terrain View">
                <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution="&copy; OpenTopoMap" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {filteredProperties.map((prop) => (
            <div key={prop.id}>
                <Marker position={[prop.lat, prop.lng]} icon={createCustomIcon(prop.status)} eventHandlers={{ click: () => setSelectedProperty(prop) }}>
                    <Popup className="custom-popup">
                        <div className="p-1.5 text-center">
                            <p className="text-[8px] font-medium text-zinc-500 uppercase mb-0.5">Owner Identity</p>
                            <p className="text-xs font-semibold text-zinc-800 uppercase italic">{prop.ownerName}</p>
                        </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -20]}><div className="font-semibold text-[9px] uppercase tracking-widest">{prop.type} #{prop.id}</div></Tooltip>
                </Marker>
                <Polygon positions={prop.boundary} pathOptions={{ color: themeColors[prop.status].hex, fillColor: themeColors[prop.status].hex, fillOpacity: 0.2, weight: 1, dashArray: '5, 5' }} />
            </div>
          ))}
        </MapContainer>
      </div>

      {/* ASSET DETAIL PANEL */}
      {selectedProperty && !actionModal.show && (
            <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-8 animate-in slide-in-from-bottom-10 duration-500">
              <div className="bg-zinc-950 border border-white/5 rounded-t-[36px] md:rounded-3xl w-full md:max-w-xl overflow-hidden relative shadow-[0_0_80px_rgba(6,182,212,0.15)]">
                  <button onClick={() => setSelectedProperty(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-white bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all font-light">✕</button>
                  
                  <div className="grid md:grid-cols-2">
                    <div className="h-56 md:h-auto bg-zinc-900 overflow-hidden relative">
                        {selectedProperty.image ? (
                            <img src={selectedProperty.image} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-4xl">🏘️</div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span className={`text-[8px] font-medium uppercase px-3 py-1 rounded-full ${themeColors[selectedProperty.status].badge}`}>{selectedProperty.status}</span>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-1 text-[8px] font-semibold text-cyan-400 uppercase tracking-widest"><ShieldCheck size={11}/> On-Chain Verified</div>

                        <div>
                            <h2 className="text-2xl font-semibold text-white uppercase tracking-wider">{selectedProperty.type} <span className="text-zinc-600 font-mono">#{selectedProperty.id}</span></h2>
                            <p className="text-zinc-500 text-[10px] font-medium mt-1.5 flex items-center gap-1.5 uppercase tracking-wide"><MapIcon size={12}/> {selectedProperty.address}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                                <span className="text-[8px] text-zinc-500 font-medium uppercase block mb-1">KHASRA NO.</span>
                                <p className="text-xs font-semibold text-cyan-400 font-mono">#{selectedProperty.khasra}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                                <span className="text-[8px] text-zinc-500 font-medium uppercase block mb-1">TOTAL AREA</span>
                                <p className="text-xs font-semibold text-zinc-300">{selectedProperty.area} SQFT</p>
                            </div>
                        </div>

                        <div className="pt-2">
                            {walletAddress?.toLowerCase() === selectedProperty.owner.toLowerCase() ? (
                                <div className="p-3.5 rounded-xl bg-zinc-900/20 border border-zinc-800/60 text-center">
                                    <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest">Ownership Detected</p>
                                </div>
                            ) : (
                                selectedProperty.status === 'sale' ? (
                                    <button onClick={() => setActionModal({show:true, type:'SALE'})} className="w-full font-medium py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white uppercase text-[10px] tracking-wider hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95">
                                        <CreditCard size={13}/> Buy Property ({selectedProperty.price} ETH)
                                    </button>
                                ) : selectedProperty.status === 'lease' ? (
                                    <button onClick={() => setActionModal({show:true, type:'LEASE'})} className="w-full font-medium py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white uppercase text-[10px] tracking-wider hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95">
                                        Initiate Lease Contract
                                    </button>
                                ) : (
                                    <div className="p-3.5 rounded-xl bg-zinc-900/20 border border-zinc-800/60 text-center">
                                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest">Restricted Asset</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                  </div>
              </div>
            </div>
      )}

      {/* ACTION MODAL (Buy/Lease) */}
      {actionModal.show && (
          <div className="fixed inset-0 z-[10002] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-white/5 rounded-3xl w-full max-w-sm p-8 shadow-3xl text-center relative overflow-hidden">
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full"></div>
                  <h3 className="text-2xl font-semibold text-white uppercase tracking-wider mb-1">{actionModal.type === 'SALE' ? "Purchase" : "Lease"}</h3>
                  <p className="text-zinc-500 text-[9px] font-medium uppercase tracking-[0.22em] mb-8 italic">Executing Smart Contract Protocol</p>
                  
                  <form onSubmit={processTransaction} className="space-y-5">
                      <div className="text-left space-y-1.5">
                        <label className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider ml-1">New Deed Owner Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900/45 border border-zinc-800 rounded-xl p-4 text-xs text-white font-medium outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-600" required placeholder="Full Legal Name" />
                      </div>
                      
                      <div className="pt-4 space-y-3">
                        <button disabled={transactionLoading} type="submit" className={`w-full py-4 rounded-xl font-semibold text-[9px] uppercase tracking-widest shadow-lg transition-all ${transactionLoading ? 'bg-zinc-850 text-zinc-650 cursor-not-allowed' : (actionModal.type === 'SALE' ? 'bg-white text-black hover:bg-cyan-500 hover:text-white' : 'bg-purple-600 hover:bg-purple-500 text-white')}`}>
                            {transactionLoading ? "MINING TRANSACTION..." : "AUTHORIZE PAYMENT"}
                        </button>
                        
                        <button type="button" onClick={() => setActionModal({ show: false, type: null })} className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest hover:text-white transition-colors block mx-auto">Cancel Protocol</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default PropertyMap;