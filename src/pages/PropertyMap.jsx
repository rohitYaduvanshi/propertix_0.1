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

// --- 1. LEAFLET ICON FIX (Pukka Solution) ---
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

  const { walletAddress } = useAuth();

  const fetchProperties = async () => {
    if (!window.ethereum) return;
    try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
        const requests = await contract.getAllRequests();

        const mapped = await Promise.all(requests.map(async (req) => {
            let meta = { name: "Plot Record", attributes: [] };
            
            // Fix IPFS URL
            const metadataUrl = req.ipfsMetadata.startsWith('ipfs://') 
                ? req.ipfsMetadata.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : req.ipfsMetadata;

            if (metadataUrl && metadataUrl.startsWith("http")) {
                try {
                    const res = await fetch(metadataUrl);
                    if (res.ok) meta = await res.json();
                } catch (e) { console.warn("Meta skip ID:", req.id); }
            }

            const findVal = (key) => {
                const fromAttr = meta.attributes?.find(a => a.trait_type?.toLowerCase() === key.toLowerCase())?.value;
                return fromAttr || meta[key] || meta[key.toLowerCase()] || meta.location?.[key];
            };

            const lat = parseFloat(findVal("Latitude") || findVal("lat"));
            const lng = parseFloat(findVal("Longitude") || findVal("lng"));
            
            // Check if property is Approved (Status 2)
            if (isNaN(lat) || isNaN(lng) || Number(req.status) !== 2) return null;

            let uiStatus = 'private';
            if (findVal("Purpose") === 'Government') uiStatus = 'government';
            else if (Number(req.saleStatus) === 1) uiStatus = 'sale';
            else if (Number(req.saleStatus) === 2) uiStatus = 'lease';
            
            return {
                id: req.id.toString(),
                lat, lng, status: uiStatus,
                type: findVal("Type") || "Residential",
                price: formatEther(req.price || 0), 
                leasePrice: formatEther(req.leasePrice || 0), 
                area: findVal("Area") || "N/A",
                owner: req.requester, 
                ownerName: meta.name || "Verified Owner", 
                address: findVal("Address") || req.propertyAddress || "Verified Site",
                image: meta.image?.replace('ipfs://', 'https://ipfs.io/ipfs/'),
                boundary: generateMockBoundary(lat, lng) 
            };
        }));
        setProperties(mapped.filter(p => p !== null));
    } catch (err) { 
        console.error("Fetch Error:", err); 
    } finally { 
        setLoading(false); 
    }
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

  const processTransaction = async (e) => {
    e.preventDefault();
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
        alert("🎉 Success!");
        setActionModal({ show: false, type: null });
        setSelectedProperty(null);
        fetchProperties();
    } catch (error) { 
        alert("Failed: " + (error.reason || error.message)); 
    } finally { 
        setTransactionLoading(false); 
    }
  };

  return (
    <div className="flex w-full bg-black h-screen overflow-hidden relative">
      
      {/* 🟢 SIDEBAR - Fixed height and scroll */}
      <div className={`bg-zinc-950 border-r border-white/5 z-[1001] flex flex-col w-full md:w-[400px] absolute md:relative h-full transition-transform duration-300 ${isMobileListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
           <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
               <h1 className="text-xl font-black text-white uppercase mb-6 tracking-tighter">Market Ledger</h1>
               
               {/* Filters */}
               <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                   {['all', 'sale', 'lease', 'government'].map(s => (
                       <button key={s} onClick={() => setFilters({...filters, status: s})} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all ${filters.status === s ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-zinc-900 text-zinc-500'}`}>{s}</button>
                   ))}
               </div>

               <input type="text" placeholder="Search property..." className="w-full py-3 px-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm outline-none focus:border-cyan-500 mb-6 transition-all" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
               
               {loading ? (
                   <div className="text-zinc-600 text-xs animate-pulse">Syncing blockchain records...</div>
               ) : (
                <div className="space-y-3 pb-20">
                    {filteredProperties.length === 0 && <p className="text-zinc-600 text-xs">No records found on this ledger.</p>}
                    {filteredProperties.map(prop => (
                        <div key={prop.id} onClick={() => { setSelectedProperty(prop); setIsMobileListOpen(false); }} className={`bg-zinc-900/40 hover:bg-zinc-800/60 border-l-4 p-4 rounded-r-2xl cursor-pointer transition-all group ${prop.status === 'sale' ? 'border-red-600' : prop.status === 'lease' ? 'border-purple-600' : prop.status === 'government' ? 'border-amber-600' : 'border-emerald-600'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${themeColors[prop.status].badge}`}>{prop.status}</span>
                                <span className="text-xs font-bold text-cyan-400">{prop.status === 'sale' ? `${prop.price} ETH` : prop.status === 'lease' ? `${prop.leasePrice} ETH/mo` : 'Private'}</span>
                            </div>
                            <h4 className="text-white font-bold text-sm truncate group-hover:text-cyan-400">{prop.address}</h4>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">ID: #{prop.id} • {prop.ownerName}</p>
                        </div>
                    ))}
                </div>
               )}
           </div>
      </div>

      {/* 🔵 MAP AREA - Guaranteed Visibility */}
      <div className="flex-1 relative h-full bg-zinc-900">
        
        {/* Mobile Toggle */}
        <button onClick={() => setIsMobileListOpen(!isMobileListOpen)} className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-[1002] bg-cyan-500 text-black px-8 py-3.5 rounded-full font-black shadow-2xl text-xs uppercase tracking-widest active:scale-95 transition-all">
          {isMobileListOpen ? "✕ Close List" : "📋 View Market"}
        </button>

        <MapContainer 
            center={[20.59, 78.96]} 
            zoom={5} 
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite View">
                <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Maps" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Street View">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {filteredProperties.map((prop) => (
            <div key={prop.id}>
                <Marker position={[prop.lat, prop.lng]} icon={createCustomIcon(prop.status)} eventHandlers={{ click: () => setSelectedProperty(prop) }}>
                   <Popup className="custom-leaflet-popup">
                       <div className="p-1 min-w-[120px]">
                           <h4 className="font-black text-[9px] text-zinc-400 uppercase tracking-widest mb-1">Owner</h4>
                           <p className="font-bold text-sm text-zinc-800 mb-2">{prop.ownerName}</p>
                           <div className={`text-[9px] font-black py-1 px-2 rounded text-center uppercase ${themeColors[prop.status].badge}`}>
                               {prop.status}
                           </div>
                       </div>
                   </Popup>
                   <Tooltip direction="top" offset={[0, -20]}><div className="font-bold text-[10px] uppercase">{prop.ownerName}</div></Tooltip>
                </Marker>
                <Polygon 
                    positions={prop.boundary} 
                    pathOptions={{ color: themeColors[prop.status].hex, fillColor: themeColors[prop.status].hex, fillOpacity: 0.3, weight: 2 }} 
                />
            </div>
          ))}
        </MapContainer>
      </div>

      {/* 🟡 DETAIL MODAL */}
      {selectedProperty && !actionModal.show && (
            <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in">
              <div className="bg-zinc-950 border border-white/10 rounded-t-[40px] md:rounded-[32px] w-full md:max-w-md overflow-hidden relative shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                  <button onClick={() => setSelectedProperty(null)} className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all">✕</button>
                  
                  {selectedProperty.image ? (
                    <img src={selectedProperty.image} className="w-full h-52 object-cover opacity-90" alt="" />
                  ) : (
                    <div className="w-full h-52 bg-zinc-900 flex items-center justify-center text-zinc-700 font-black italic">IMAGE_NOT_SYNCED</div>
                  )}

                  <div className="p-8">
                      <div className="flex gap-3 mb-4">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${themeColors[selectedProperty.status].badge}`}>{selectedProperty.status}</span>
                          <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg">VERIFIED BY NEON</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">{selectedProperty.type} <span className="text-zinc-600 text-sm">#{selectedProperty.id}</span></h2>
                      <p className="text-zinc-400 text-xs mb-8">📍 {selectedProperty.address}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="p-4 rounded-2xl text-center bg-zinc-900/50 border border-white/5">
                             <span className="text-[8px] text-zinc-500 font-black uppercase block mb-1">Price</span>
                             <p className={`text-lg font-black ${themeColors[selectedProperty.status].text}`}>{selectedProperty.status === 'sale' ? `${selectedProperty.price} ETH` : selectedProperty.status === 'lease' ? `${selectedProperty.leasePrice} ETH/mo` : 'Private'}</p>
                          </div>
                          <div className="bg-zinc-900/50 p-4 rounded-2xl text-center border border-white/5"><span className="text-[8px] text-zinc-500 font-black uppercase block mb-1">Area</span><p className="text-lg font-black text-white">{selectedProperty.area} <span className="text-[10px] opacity-40">SQFT</span></p></div>
                      </div>

                      {walletAddress?.toLowerCase() === selectedProperty.owner.toLowerCase() ? (
                          <button className="w-full font-black py-5 rounded-2xl bg-zinc-900 text-zinc-600 uppercase text-[11px] border border-white/5 cursor-not-allowed">You Own This Asset</button>
                      ) : (
                          selectedProperty.status === 'sale' ? <button onClick={() => setActionModal({show:true, type:'SALE'})} className="w-full font-black py-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white uppercase text-[11px] shadow-[0_10px_20px_rgba(220,38,38,0.3)] transition-all">Buy Ownership</button> :
                          selectedProperty.status === 'lease' ? <button onClick={() => setActionModal({show:true, type:'LEASE'})} className="w-full font-black py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white uppercase text-[11px] shadow-[0_10px_20px_rgba(147,51,234,0.3)] transition-all">Lease Property</button> :
                          <button className="w-full font-black py-5 rounded-2xl bg-zinc-900 text-zinc-600 uppercase text-[11px] border border-white/5">Government Asset</button>
                      )}
                  </div>
              </div>
            </div>
      )}

      {/* ACTION MODAL (Buy/Lease) */}
      {actionModal.show && (
          <div className="fixed inset-0 z-[10002] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-white/10 rounded-[40px] w-full max-w-sm p-10 shadow-3xl text-center">
                  <h3 className="text-2xl font-black text-white mb-2">{actionModal.type === 'SALE' ? "Purchase" : "Lease"}</h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-8">Executing Smart Contract...</p>
                  
                  <form onSubmit={processTransaction} className="space-y-6">
                      <div className="text-left">
                        <label className="text-[9px] font-black text-zinc-500 uppercase ml-2">Legal Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-cyan-500 outline-none mt-1" required placeholder="Enter Full Name" />
                      </div>
                      
                      <button disabled={transactionLoading} type="submit" className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all ${transactionLoading ? 'bg-zinc-800 opacity-50 cursor-wait' : (actionModal.type === 'SALE' ? 'bg-red-600 hover:bg-red-500' : 'bg-purple-600 hover:bg-purple-500')}`}>
                        {transactionLoading ? "Processing..." : "Confirm Payment"}
                      </button>
                      
                      <button type="button" onClick={() => setActionModal({ show: false, type: null })} className="w-full text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default PropertyMap;