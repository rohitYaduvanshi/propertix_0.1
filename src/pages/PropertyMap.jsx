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
import { ShieldCheck, Map as MapIcon, Layers, Info, CreditCard } from "lucide-react";

// --- 1. LEAFLET ICON FIX ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const themeColors = {
    sale: { text: "text-red-500", bg: "bg-red-600", hex: "#dc2626", badge: "bg-red-600 text-white", icon: "💰" },
    lease: { text: "text-purple-500", bg: "bg-purple-600", hex: "#9333ea", badge: "bg-purple-600 text-white", icon: "🔑" },
    private: { text: "text-emerald-500", bg: "bg-emerald-600", hex: "#059669", badge: "bg-emerald-600 text-white", icon: "🏠" },
    government: { text: "text-amber-500", bg: "bg-amber-600", hex: "#d97706", badge: "bg-amber-600 text-white", icon: "🏛️" }
};

const createCustomIcon = (type) => {
  const current = themeColors[type] || { bg: "bg-gray-500", icon: "📍" };
  return new L.DivIcon({
    className: "bg-transparent",
    html: `<div class="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white shadow-xl ${current.bg} text-white text-lg hover:scale-110 transition-all">${current.icon}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
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
                khasra: req.khasraNumber, // ✅ New Khasra Field
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

        // Identity Check is performed by the smart contract automatically
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
    <div className="flex w-full bg-black h-screen overflow-hidden relative font-sans">
      
      {/* SIDEBAR */}
      <div className={`bg-zinc-950 border-r border-white/5 z-[1001] flex flex-col w-full md:w-[420px] absolute md:relative h-full transition-transform duration-300 ${isMobileListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
           <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
               <div className="mb-8">
                   <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-2 italic">Registry_Explorer_v3</p>
                   <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Market Ledger</h1>
               </div>
               
               {/* Filters */}
               <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                   {['all', 'sale', 'lease', 'government'].map(s => (
                       <button key={s} onClick={() => setFilters({...filters, status: s})} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filters.status === s ? 'bg-white text-black shadow-2xl' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}>{s}</button>
                   ))}
               </div>

               <div className="relative mb-8">
                    <input type="text" placeholder="SEARCH BY ADDRESS OR KHASRA..." className="w-full py-4 px-6 bg-zinc-900 border border-white/5 rounded-2xl text-white text-[10px] font-bold outline-none focus:border-cyan-500 transition-all placeholder:text-zinc-700 tracking-widest" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
               </div>
               
               {loading ? (
                   <div className="flex items-center gap-3 text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse"><div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div> Syncing Neural Nodes...</div>
               ) : (
                <div className="space-y-4 pb-20">
                    {filteredProperties.length === 0 && <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest text-center py-20">No verified assets found.</p>}
                    {filteredProperties.map(prop => (
                        <div key={prop.id} onClick={() => { setSelectedProperty(prop); setIsMobileListOpen(false); }} className={`bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 p-5 rounded-[24px] cursor-pointer transition-all group hover:scale-[1.02] ${selectedProperty?.id === prop.id ? 'border-cyan-500/50 bg-zinc-900' : ''}`}>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${themeColors[prop.status].badge}`}>{prop.status}</span>
                                <span className="text-[10px] font-black text-cyan-400 font-mono tracking-tighter">{prop.status === 'sale' ? `${prop.price} ETH` : prop.status === 'lease' ? `${prop.leasePrice} ETH/mo` : 'VERIFIED'}</span>
                            </div>
                            <h4 className="text-white font-black text-sm italic uppercase tracking-tight group-hover:text-cyan-400 transition-colors truncate">{prop.address}</h4>
                            <div className="flex items-center gap-3 mt-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span>KHASRA: <span className="text-zinc-300">#{prop.khasra}</span></span>
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
        <button onClick={() => setIsMobileListOpen(!isMobileListOpen)} className="md:hidden absolute bottom-10 left-1/2 -translate-x-1/2 z-[1002] bg-white text-black px-10 py-4 rounded-2xl font-black shadow-2xl text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all">
          {isMobileListOpen ? "✕ CLOSE LEDGER" : "📋 VIEW MARKET"}
        </button>

        <MapContainer center={[20.59, 78.96]} zoom={5} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite Ops">
                <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Satellite" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain Mode">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {filteredProperties.map((prop) => (
            <div key={prop.id}>
                <Marker position={[prop.lat, prop.lng]} icon={createCustomIcon(prop.status)} eventHandlers={{ click: () => setSelectedProperty(prop) }}>
                    <Popup className="custom-popup">
                        <div className="p-2 text-center">
                            <p className="text-[8px] font-black text-zinc-400 uppercase mb-1">Owner Identity</p>
                            <p className="text-xs font-bold text-zinc-900 uppercase italic">{prop.ownerName}</p>
                        </div>
                    </Popup>
                    <Tooltip direction="top" offset={[0, -20]}><div className="font-black text-[9px] uppercase tracking-widest">{prop.type} #{prop.id}</div></Tooltip>
                </Marker>
                <Polygon positions={prop.boundary} pathOptions={{ color: themeColors[prop.status].hex, fillColor: themeColors[prop.status].hex, fillOpacity: 0.2, weight: 1, dashArray: '5, 5' }} />
            </div>
          ))}
        </MapContainer>
      </div>

      {/*ASSET DETAIL PANEL */}
      {selectedProperty && !actionModal.show && (
            <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-end md:items-center justify-center p-0 md:p-8 animate-in slide-in-from-bottom-10 duration-500">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-t-[50px] md:rounded-[40px] w-full md:max-w-xl overflow-hidden relative shadow-[0_0_100px_rgba(34,211,238,0.1)]">
                  <button onClick={() => setSelectedProperty(null)} className="absolute top-8 right-8 text-zinc-400 hover:text-white bg-white/5 w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all">✕</button>
                  
                  <div className="grid md:grid-cols-2">
                    <div className="h-64 md:h-auto bg-zinc-900 overflow-hidden">
                        {selectedProperty.image ? (
                            <img src={selectedProperty.image} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" alt="" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-800 text-4xl">🏘️</div>
                        )}
                    </div>

                    <div className="p-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full ${themeColors[selectedProperty.status].badge}`}>{selectedProperty.status}</span>
                            <div className="flex items-center gap-1 text-[8px] font-black text-cyan-500 uppercase tracking-widest"><ShieldCheck size={10}/> On-Chain Verified</div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">{selectedProperty.type} <span className="text-zinc-800">#{selectedProperty.id}</span></h2>
                            <p className="text-zinc-500 text-[10px] font-bold mt-2 flex items-center gap-2 uppercase tracking-widest"><MapIcon size={12}/> {selectedProperty.address}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-3xl bg-zinc-900 border border-white/5">
                                <span className="text-[8px] text-zinc-600 font-black uppercase block mb-1">KHASRA NO.</span>
                                <p className="text-sm font-black text-cyan-500 font-mono italic">#{selectedProperty.khasra}</p>
                            </div>
                            <div className="p-4 rounded-3xl bg-zinc-900 border border-white/5">
                                <span className="text-[8px] text-zinc-600 font-black uppercase block mb-1">TOTAL AREA</span>
                                <p className="text-sm font-black text-white italic">{selectedProperty.area} SQFT</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            {walletAddress?.toLowerCase() === selectedProperty.owner.toLowerCase() ? (
                                <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ownership Detected</p>
                                </div>
                            ) : (
                                selectedProperty.status === 'sale' ? (
                                    <button onClick={() => setActionModal({show:true, type:'SALE'})} className="w-full font-black py-5 rounded-2xl bg-white text-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 active:scale-95">
                                        <CreditCard size={14}/> Purchase Asset ({selectedProperty.price} ETH)
                                    </button>
                                ) : selectedProperty.status === 'lease' ? (
                                    <button onClick={() => setActionModal({show:true, type:'LEASE'})} className="w-full font-black py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95">
                                        Initiate Lease Contract
                                    </button>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Restricted Asset</p>
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
          <div className="fixed inset-0 z-[10002] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
              <div className="bg-[#0a0a0a] border border-white/10 rounded-[50px] w-full max-w-sm p-12 shadow-3xl text-center relative overflow-hidden">
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">{actionModal.type === 'SALE' ? "Purchase" : "Lease"}</h3>
                  <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mb-10 italic">Executing Smart Contract Protocol</p>
                  
                  <form onSubmit={processTransaction} className="space-y-6">
                      <div className="text-left space-y-2">
                        <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">New Deed Owner Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-5 text-xs text-white font-bold outline-none focus:border-cyan-500 transition-all italic" required placeholder="LEGAL FULL NAME" />
                      </div>
                      
                      <div className="pt-6 space-y-4">
                        <button disabled={transactionLoading} type="submit" className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl transition-all ${transactionLoading ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : (actionModal.type === 'SALE' ? 'bg-white text-black hover:bg-red-500 hover:text-white' : 'bg-purple-600 hover:bg-purple-500 text-white')}`}>
                            {transactionLoading ? "MINING TRANSACTION..." : "AUTHORIZE PAYMENT"}
                        </button>
                        
                        <button type="button" onClick={() => setActionModal({ show: false, type: null })} className="text-[9px] font-black text-zinc-700 uppercase tracking-widest hover:text-white transition-colors">Cancel Protocol</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default PropertyMap;