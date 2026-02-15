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

// Professional Custom Icons
const createCustomIcon = (type) => {
  const styles = {
      sale: { bg: "bg-blue-600", icon: "💰" },
      lease: { bg: "bg-purple-600", icon: "🔑" },
      government: { bg: "bg-amber-500", icon: "🏛️" },
      private: { bg: "bg-emerald-500", icon: "🏠" }
  };
  const current = styles[type] || { bg: "bg-gray-500", icon: "📍" };
  const iconHtml = `
    <div class="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white shadow-xl ${current.bg} text-white text-lg transition-all hover:scale-110">
        ${current.icon}
    </div>`;
  return new L.DivIcon({
    className: "bg-transparent border-none",
    html: iconHtml,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
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
  const [formData, setFormData] = useState({ name: "", aadhaarFront: null, aadhaarBack: null });

  const { walletAddress } = useAuth();

  // --- CORE FUNCTION: FETCH PROPERTIES (Unchanged Logic) ---
  const fetchProperties = async () => {
    if (!window.ethereum) return;
    try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
        const requests = await contract.getAllRequests();

        const mapped = await Promise.all(requests.map(async (req) => {
            let meta = { name: "Plot Record", type: "Land", attributes: [] };
            if (req.ipfsMetadata && req.ipfsMetadata.startsWith("http")) {
                try {
                    const res = await fetch(req.ipfsMetadata, { timeout: 5000 });
                    if (res.ok) meta = await res.json();
                } catch (e) { console.warn("IPFS Timeout for ID:", req.id); }
            }
            
            // Helper to get coords from deep attributes or top level
            const getAttr = (k) => meta.attributes?.find(a => a.trait_type === k)?.value || meta[k.toLowerCase()] || meta.location?.[k.toLowerCase()];
            
            const lat = parseFloat(getAttr("Latitude"));
            const lng = parseFloat(getAttr("Longitude"));
            if (isNaN(lat) || isNaN(lng)) return null;

            const isApproved = Number(req.status) === 2;
            if (!isApproved) return null; // Map only shows verified properties

            const saleStatus = Number(req.saleStatus);
            let uiStatus = 'private';
            if (getAttr("Purpose") === 'Government') uiStatus = 'government';
            else if (saleStatus === 1) uiStatus = 'sale';
            else if (saleStatus === 2) uiStatus = 'lease';
            
            return {
                id: req.id.toString(),
                lat, lng, status: uiStatus,
                type: getAttr("Type") || "Residential",
                price: req.price ? formatEther(req.price) : "0", 
                leasePrice: req.leasePrice ? formatEther(req.leasePrice) : "0", 
                area: getAttr("Area") || "N/A",
                owner: req.requester, 
                ownerName: req.ownerName || meta.name || "Verified Owner", 
                address: getAttr("Address") || "Verified Site",
                isVerified: true,
                image: meta.image,
                boundary: generateMockBoundary(lat, lng) 
            };
        }));
        setProperties(mapped.filter(p => p !== null));
    } catch (err) { console.error("Sync Error:", err); } finally { setLoading(false); }
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

  // --- HANDLERS (Same logic as yours) ---
  const initiateTransaction = (type) => {
      setActionModal({ show: true, type: type });
      setFormData({ name: "", aadhaarFront: null, aadhaarBack: null });
  };

  const processTransaction = async (e) => {
    e.preventDefault();
    try {
        setTransactionLoading(true);
        setActionModal({ show: false, type: null }); 

        if (actionModal.type === 'LEASE') {
             await uploadFileToIPFS(formData.aadhaarFront);
             await uploadFileToIPFS(formData.aadhaarBack);
        }

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

        const amount = actionModal.type === 'SALE' ? selectedProperty.price : selectedProperty.leasePrice;
        let tx;
        if (actionModal.type === 'SALE') {
            tx = await contract.buyProperty(selectedProperty.id, formData.name, { value: parseEther(amount) });
        } else {
            tx = await contract.rentProperty(selectedProperty.id, { value: parseEther(amount) });
        }

        await tx.wait();
        alert(`🎉 Transaction Successful!`);
        setSelectedProperty(null);
        fetchProperties();
    } catch (error) {
        alert("Transaction Failed: " + (error.reason || error.message));
    } finally { setTransactionLoading(false); }
  };

  const themeColors = {
      sale: { text: "text-blue-500", bg: "bg-blue-600", hex: "#2563eb", badge: "bg-blue-600 text-white" },
      lease: { text: "text-purple-500", bg: "bg-purple-600", hex: "#9333ea", badge: "bg-purple-600 text-white" },
      private: { text: "text-emerald-500", bg: "bg-emerald-600", hex: "#059669", badge: "bg-emerald-600 text-white" },
      government: { text: "text-amber-500", bg: "bg-amber-600", hex: "#d97706", badge: "bg-amber-600 text-white" },
  };

  return (
    <div className="flex-1 w-full flex flex-col-reverse md:flex-row relative z-0 bg-black min-h-[calc(100vh-70px)] overflow-hidden">
      
      {/* PROFESSIONAL SIDEBAR */}
      <div className={`bg-zinc-950 border-r border-white/5 z-[1001] md:z-20 flex flex-col w-full md:w-[400px] absolute md:relative h-full transition-transform duration-300 ${isMobileListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
           <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
               <h1 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Market Ledger</h1>
               
               <div className="relative mb-6">
                   <input type="text" placeholder="Search address or owner..." className="w-full py-3.5 pl-11 pr-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-white text-sm focus:border-cyan-500 transition-all outline-none" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
               </div>
               
               <div className="space-y-3">
                  {filteredProperties.map(prop => (
                      <div key={prop.id} onClick={() => { setSelectedProperty(prop); setIsMobileListOpen(false); }} className="group bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 p-4 rounded-2xl cursor-pointer transition-all">
                          <div className="flex justify-between items-start mb-3">
                              <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${themeColors[prop.status].badge}`}>{prop.status}</span>
                              <span className="text-xs font-bold text-cyan-400">{prop.status === 'sale' ? `${prop.price} ETH` : `${prop.leasePrice} ETH/mo`}</span>
                          </div>
                          <h4 className="text-white font-bold text-sm truncate">{prop.address}</h4>
                          <p className="text-[10px] text-gray-500 mt-1">Owner: {prop.ownerName}</p>
                      </div>
                  ))}
               </div>
           </div>
      </div>

      {/* MAP AREA */}
      <div className="flex-1 relative h-full w-full z-0">
        <button onClick={() => setIsMobileListOpen(!isMobileListOpen)} className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-[1002] bg-white text-black px-8 py-3.5 rounded-full font-black shadow-2xl text-xs uppercase tracking-widest transition-transform active:scale-95">
          {isMobileListOpen ? "✕ Close List" : "📋 Property List"}
        </button>

        <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: "100%", width: "100%" }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Satellite View">
                <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Standard Map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {filteredProperties.map((prop) => (
            <div key={prop.id}>
                <Marker position={[prop.lat, prop.lng]} icon={createCustomIcon(prop.status)} eventHandlers={{ click: () => setSelectedProperty(prop) }}>
                   <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                       <div className="text-center font-bold text-[10px] p-1 uppercase">{prop.ownerName}</div>
                   </Tooltip>
                </Marker>
                <Polygon positions={prop.boundary} pathOptions={{ color: themeColors[prop.status].hex, fillOpacity: 0.2, weight: 2 }} eventHandlers={{ click: () => setSelectedProperty(prop) }} />
            </div>
          ))}
        </MapContainer>
      </div>

      {/* DETAIL MODAL (Unchanged functionality, updated UI) */}
      {selectedProperty && !actionModal.show && (
            <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in slide-in-from-bottom-10">
              <div className="bg-zinc-900 border border-white/10 rounded-t-[40px] md:rounded-[32px] w-full md:max-w-md overflow-hidden relative shadow-3xl">
                  <button onClick={() => setSelectedProperty(null)} className="absolute top-6 right-6 text-white bg-white/10 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-10">✕</button>
                  
                  {selectedProperty.image && <img src={selectedProperty.image} className="w-full h-48 object-cover opacity-80" alt="" />}
                  
                  <div className="p-8">
                      <div className="flex items-center gap-3 mb-4">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${themeColors[selectedProperty.status].badge}`}>{selectedProperty.status}</span>
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">VERIFIED ASSET</span>
                      </div>
                      <h2 className="text-2xl font-black text-white mb-2">{selectedProperty.type} <span className="text-zinc-600 text-sm">#{selectedProperty.id}</span></h2>
                      <p className="text-gray-400 text-sm mb-8 leading-relaxed">📍 {selectedProperty.address}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                              <span className="text-[8px] text-zinc-500 font-black uppercase block mb-1">Market Price</span>
                              <p className="text-lg font-black text-white">{selectedProperty.status === 'sale' ? `${selectedProperty.price} ETH` : selectedProperty.status === 'lease' ? `${selectedProperty.leasePrice} ETH/mo` : 'Private'}</p>
                          </div>
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-center">
                              <span className="text-[8px] text-zinc-500 font-black uppercase block mb-1">Total Area</span>
                              <p className="text-lg font-black text-white">{selectedProperty.area} <span className="text-[10px] opacity-40 uppercase">Sq.Ft</span></p>
                          </div>
                      </div>

                      {walletAddress?.toLowerCase() === selectedProperty.owner.toLowerCase() ? (
                          <button className="w-full font-black py-5 rounded-2xl bg-zinc-800 text-zinc-500 uppercase tracking-widest text-[11px] cursor-not-allowed">You Own This Property</button>
                      ) : (
                          selectedProperty.status === 'sale' ? (
                              <button onClick={() => initiateTransaction('SALE')} className="w-full font-black py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white uppercase tracking-widest text-[11px] shadow-2xl transition-all">Buy Ownership</button>
                          ) : selectedProperty.status === 'lease' ? (
                              <button onClick={() => initiateTransaction('LEASE')} className="w-full font-black py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white uppercase tracking-widest text-[11px] shadow-2xl transition-all">Start Lease</button>
                          ) : (
                              <button className="w-full font-black py-5 rounded-2xl bg-zinc-800 text-zinc-500 uppercase tracking-widest text-[11px] cursor-not-allowed">Property Private</button>
                          )
                      )}
                  </div>
              </div>
            </div>
      )}

      {/* ACTION MODAL (Aadhaar Upload functionality remains same) */}
      {actionModal.show && (
          <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-white/10 rounded-[32px] w-full max-w-sm p-8 relative shadow-3xl">
                  <h3 className="text-2xl font-black text-white mb-2">{actionModal.type === 'SALE' ? "Buy Land" : "Lease Land"}</h3>
                  <p className="text-zinc-500 text-xs mb-8 uppercase tracking-widest font-bold">Secure Verification Required</p>

                  <form onSubmit={processTransaction} className="space-y-6">
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-cyan-500 outline-none transition-all" required placeholder="Enter Your Full Name" />

                      {actionModal.type === 'LEASE' && (
                          <div className="space-y-4">
                              <div className="p-4 bg-black rounded-xl border border-zinc-800 text-center">
                                  <label className="text-[10px] font-black text-zinc-500 uppercase block mb-3 tracking-widest">Aadhaar Front Side</label>
                                  <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, aadhaarFront: e.target.files[0]})} className="text-[10px] text-zinc-600 file:bg-zinc-800 file:border-0 file:text-white file:rounded-lg file:px-3 file:py-2" required />
                              </div>
                              <div className="p-4 bg-black rounded-xl border border-zinc-800 text-center">
                                  <label className="text-[10px] font-black text-zinc-500 uppercase block mb-3 tracking-widest">Aadhaar Back Side</label>
                                  <input type="file" accept="image/*" onChange={(e) => setFormData({...formData, aadhaarBack: e.target.files[0]})} className="text-[10px] text-zinc-600 file:bg-zinc-800 file:border-0 file:text-white file:rounded-lg file:px-3 file:py-2" required />
                              </div>
                          </div>
                      )}

                      <button type="submit" className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl ${actionModal.type === 'SALE' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>Confirm & Pay</button>
                      <button type="button" onClick={() => setActionModal({ show: false, type: null })} className="w-full text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-all">Cancel</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default PropertyMap;