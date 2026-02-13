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

// 🌟 CLEAN & PROFESSIONAL ICONS
const createCustomIcon = (type) => {
  const styles = {
      sale: { bg: "bg-blue-500", icon: "💰" },
      lease: { bg: "bg-purple-500", icon: "🔑" },
      government: { bg: "bg-amber-500", icon: "🏛️" },
      private: { bg: "bg-emerald-500", icon: "🏠" }
  };
  
  const current = styles[type] || { bg: "bg-gray-500", icon: "📍" };

  const iconHtml = `
    <div class="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.3)] ${current.bg} text-white text-lg transition-transform hover:scale-110">
        ${current.icon}
    </div>`;

  return new L.DivIcon({
    className: "bg-transparent border-none",
    html: iconHtml,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const generateMockBoundary = (lat, lng) => {
    const offset = 0.001; 
    return [
        [lat + offset, lng - offset],
        [lat + offset, lng + offset],
        [lat - offset, lng + offset],
        [lat - offset, lng - offset]
    ];
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
  const [formData, setFormData] = useState({
      name: "",
      aadhaarFront: null,
      aadhaarBack: null
  });

  const { walletAddress } = useAuth();

  // --- FETCH DATA ---
  const fetchProperties = async () => {
    if (!window.ethereum) return;
    try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
        const requests = await contract.getAllRequests();

        const mapped = await Promise.all(requests.map(async (req) => {
            let meta = { name: "Loading...", type: "Unknown", attributes: [] };
            if (req.ipfsMetadata && req.ipfsMetadata.startsWith("http")) {
                try {
                    const res = await fetch(req.ipfsMetadata);
                    const json = await res.json();
                    meta = { ...meta, ...json };
                } catch (e) { console.warn("IPFS Fetch Error", e); }
            }
            const getAttr = (k) => meta.attributes?.find(a => a.trait_type === k)?.value;
            const lat = parseFloat(getAttr("Latitude"));
            const lng = parseFloat(getAttr("Longitude"));
            const purpose = getAttr("Purpose");

            if (!lat || !lng) return null;

            const saleStatus = Number(req.saleStatus); 
            const isApproved = Number(req.status) === 2; 
            
            let uiStatus = 'private';
            if (purpose === 'Government') uiStatus = 'government';
            else if (isApproved) {
                if (saleStatus === 1) uiStatus = 'sale';
                else if (saleStatus === 2) uiStatus = 'lease';
                else uiStatus = 'private';
            }
            
            return {
                id: req.id.toString(),
                lat, lng, status: uiStatus,
                type: getAttr("Type") || "Plot",
                price: req.price ? formatEther(req.price) : "0", 
                leasePrice: req.leasePrice ? formatEther(req.leasePrice) : "0", 
                area: getAttr("Area") || 0,
                owner: req.requester, 
                ownerName: req.ownerName || meta.name, 
                address: getAttr("Address") || "Location",
                isVerified: isApproved, 
                boundary: generateMockBoundary(lat, lng) 
            };
        }));
        setProperties(mapped.filter(p => p !== null));
    } catch (err) { console.error("Blockchain Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProperties(); }, []);

  useEffect(() => {
    const filtered = properties.filter((prop) => {
      const statusMatch = filters.status === "all" || prop.status === filters.status;
      const searchMatch = prop.address.toLowerCase().includes(filters.search.toLowerCase()) || 
                          prop.owner.toLowerCase().includes(filters.search.toLowerCase()) ||
                          (prop.ownerName && prop.ownerName.toLowerCase().includes(filters.search.toLowerCase()));
      return statusMatch && searchMatch;
    });
    setFilteredProperties(filtered);
  }, [properties, filters]);


  // --- HANDLERS ---
  const initiateTransaction = (type) => {
      setActionModal({ show: true, type: type });
      setFormData({ name: "", aadhaarFront: null, aadhaarBack: null });
  };

  const handleFileChange = (e, field) => {
      if (e.target.files && e.target.files[0]) {
          setFormData(prev => ({ ...prev, [field]: e.target.files[0] }));
      }
  };

  const processTransaction = async (e) => {
    e.preventDefault();
    if (!window.ethereum) return alert("MetaMask not found!");
    
    if (!formData.name) return alert("Please enter the Name.");
    if (actionModal.type === 'LEASE' && (!formData.aadhaarFront || !formData.aadhaarBack)) {
        return alert("Both Aadhaar Card photos are required for Leasing.");
    }

    const amountToPay = actionModal.type === 'SALE' ? selectedProperty.price : selectedProperty.leasePrice;

    const confirm = window.confirm(`Confirm Transaction for ${amountToPay} ETH?`);
    if (!confirm) return;

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

        let tx;
        if (actionModal.type === 'SALE') {
            tx = await contract.buyProperty(selectedProperty.id, formData.name, { value: parseEther(amountToPay) });
        } else {
            tx = await contract.rentProperty(selectedProperty.id, { value: parseEther(amountToPay) });
        }

        await tx.wait();
        alert(`🎉 Transaction Successful!`);
        setSelectedProperty(null);
        fetchProperties();

    } catch (error) {
        console.error(error);
        alert("Transaction Failed: " + (error.reason || error.message));
        setActionModal({ show: true, type: actionModal.type });
    } finally {
        setTransactionLoading(false);
    }
  };

  const getPriceDisplay = (prop) => {
    if (prop.status === "sale") return `${prop.price} ETH`;
    if (prop.status === "lease") return `${prop.leasePrice} ETH /mo`; 
    return "Private";
  };

  // 🎨 Clean Solid Colors for UI
  const themeColors = {
      sale: { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", hex: "#3b82f6", badge: "bg-blue-500 text-white" },
      lease: { text: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", hex: "#a855f7", badge: "bg-purple-500 text-white" },
      private: { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hex: "#10b981", badge: "bg-emerald-500 text-white" },
      government: { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", hex: "#f59e0b", badge: "bg-amber-500 text-white" },
  };

  return (
    // 🟢 FIXED HEIGHT & LAYOUT (No more top black space)
    <div className="flex-1 w-full flex flex-col-reverse md:flex-row relative z-0 bg-black min-h-[calc(100vh-76px)]">
      
      {/* LOADING OVERLAY */}
      {(loading || transactionLoading) && (
        <div className="absolute inset-0 z-[2000] bg-black/80 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-medium">{transactionLoading ? "Processing Transaction..." : "Loading Map Data..."}</p>
        </div>
      )}

      {/* MOBILE LIST TOGGLE BUTTON */}
      <button 
        onClick={() => setIsMobileListOpen(!isMobileListOpen)}
        className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1002] bg-zinc-800 text-white border border-zinc-700 px-6 py-3 rounded-full font-bold shadow-2xl text-sm"
      >
        {isMobileListOpen ? "🗺️ View Map" : "📋 View List"}
      </button>

      {/* 🟢 SLEEK SIDEBAR */}
      <div className={`bg-zinc-950 border-r border-white/5 z-[1001] md:z-20 shadow-2xl flex flex-col w-full md:w-[400px] absolute md:relative h-full transition-transform duration-300 ${isMobileListOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
           <div className="p-6 overflow-y-auto flex-1 pb-24 md:pb-6 custom-scrollbar">
               
               <div className="mb-6 flex justify-between items-center">
                   <h1 className="text-xl font-bold text-white tracking-wide">Property Market</h1>
                   <button onClick={() => setIsMobileListOpen(false)} className="md:hidden text-gray-500 hover:text-white">✕</button>
               </div>

               {/* Clean Search Input */}
               <div className="relative mb-6">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                   <input 
                      type="text" 
                      placeholder="Search address or owner..." 
                      className="w-full py-3 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-gray-600" 
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
                   />
               </div>
               
               {/* Clean Cards */}
               <div className="space-y-3">
                  {filteredProperties.map(prop => {
                      const theme = themeColors[prop.status];
                      return (
                          <div key={prop.id} onClick={() => { setSelectedProperty(prop); setIsMobileListOpen(false); }} className="group bg-zinc-900 hover:bg-zinc-800 p-4 rounded-xl border border-zinc-800 cursor-pointer transition-colors duration-200">
                              <div className="flex justify-between items-start mb-2">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${theme.badge}`}>
                                      {prop.status}
                                  </span>
                                  <span className="text-sm font-bold text-gray-200">{getPriceDisplay(prop)}</span>
                              </div>
                              <h4 className="text-gray-100 font-semibold text-sm truncate">{prop.address}</h4>
                              <p className="text-xs text-gray-500 mt-1 truncate">Owner: {prop.ownerName || "Unknown"}</p>
                          </div>
                      );
                  })}
                  {filteredProperties.length === 0 && (
                      <div className="text-center py-10 text-gray-500 text-sm">No properties found.</div>
                  )}
               </div>
           </div>
      </div>

      {/* 🟢 MAP AREA */}
      <div className="flex-1 relative h-full w-full z-0">
        
        {/* Simple Map Legend */}
        <div className="absolute top-4 right-4 z-[1000] bg-white text-black p-3 rounded-xl shadow-lg border border-gray-200">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase mb-2 border-b pb-1">Map Legend</h4>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-medium"><span className="w-3 h-3 rounded-full bg-blue-500"></span> For Sale</div>
                <div className="flex items-center gap-2 text-xs font-medium"><span className="w-3 h-3 rounded-full bg-purple-500"></span> For Lease</div>
                <div className="flex items-center gap-2 text-xs font-medium"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Private</div>
                <div className="flex items-center gap-2 text-xs font-medium"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Government</div>
            </div>
        </div>

        <MapContainer center={[20.59, 78.96]} zoom={5} style={{ height: "100%", width: "100%", zIndex: 0 }}>
          <LayersControl position="bottomright">
            <LayersControl.BaseLayer name="Standard Map">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer checked name="Satellite View">
                <TileLayer url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {filteredProperties.map((prop) => (
            <div key={prop.id}>
                <Marker position={[prop.lat, prop.lng]} icon={createCustomIcon(prop.status)} eventHandlers={{ click: () => setSelectedProperty(prop) }}>
                   <Tooltip direction="top" offset={[0, -20]} className="border-none shadow-lg rounded-lg">
                       <div className="text-center p-1">
                           <p className="font-bold text-sm text-gray-800">{prop.type}</p>
                           <p className={`text-[10px] font-bold uppercase mt-1 ${themeColors[prop.status].text}`}>{prop.status}</p>
                       </div>
                   </Tooltip>
                </Marker>
                {prop.boundary && <Polygon positions={prop.boundary} pathOptions={{ color: themeColors[prop.status].hex, fillColor: themeColors[prop.status].hex, fillOpacity: 0.2, weight: 2 }} eventHandlers={{ click: () => setSelectedProperty(prop) }} />}
            </div>
          ))}
        </MapContainer>
      </div>

      {/* 🟢 PROFESSIONAL DETAIL MODAL */}
      {selectedProperty && !actionModal.show && (() => {
        const theme = themeColors[selectedProperty.status];
        return (
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
              <div className="bg-zinc-950 border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md overflow-hidden relative">
                  
                  {/* Clean Header */}
                  <div className="flex justify-between items-center p-5 border-b border-white/5 bg-zinc-900">
                      <div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${theme.badge}`}>
                              {selectedProperty.status}
                          </span>
                      </div>
                      <button onClick={() => setSelectedProperty(null)} className="text-gray-400 hover:text-white bg-zinc-800 w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
                  </div>
                  
                  <div className="p-6">
                      <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                          {selectedProperty.type} 
                          {selectedProperty.isVerified && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full uppercase border border-green-500/20">Verified</span>}
                      </h2>
                      <p className="text-gray-400 text-sm mb-6">{selectedProperty.address}</p>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Price</span>
                              <p className={`text-lg font-bold mt-1 ${selectedProperty.status === 'private' || selectedProperty.status === 'government' ? 'text-gray-300' : theme.text}`}>
                                  {getPriceDisplay(selectedProperty)}
                              </p>
                          </div>
                          <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Area</span>
                              <p className="text-lg font-bold text-white mt-1">{selectedProperty.area} <span className="text-xs text-gray-500">sq.ft</span></p>
                          </div>
                      </div>

                      <div className="mb-8 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Current Owner</span>
                          <p className="text-sm font-semibold text-gray-200">{selectedProperty.ownerName}</p>
                          <p className="text-xs text-gray-500 font-mono mt-1 truncate">{selectedProperty.owner}</p>
                      </div>

                      {/* Professional Solid Buttons */}
                      {walletAddress?.toLowerCase() === selectedProperty.owner.toLowerCase() ? (
                          <button className="w-full font-bold py-3.5 rounded-xl bg-zinc-800 text-gray-500 cursor-not-allowed text-sm">
                              You Own This Property
                          </button>
                      ) : (
                          selectedProperty.status === 'sale' ? (
                              <button onClick={() => initiateTransaction('SALE')} className="w-full font-bold py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm">
                                  Proceed to Buy
                              </button>
                          ) : selectedProperty.status === 'lease' ? (
                              <button onClick={() => initiateTransaction('LEASE')} className="w-full font-bold py-3.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors text-sm">
                                  Apply for Lease
                              </button>
                          ) : (
                              <button className="w-full font-bold py-3.5 rounded-xl bg-zinc-800 text-gray-500 cursor-not-allowed text-sm">
                                  Not Available for Market
                              </button>
                          )
                      )}
                  </div>
              </div>
            </div>
        );
      })()}

      {/* 🟢 PROFESSIONAL ACTION MODAL */}
      {actionModal.show && (
          <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                  <button onClick={() => setActionModal({ show: false, type: null })} className="absolute top-5 right-5 text-gray-500 hover:text-white bg-zinc-800 w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>

                  <h3 className="text-xl font-bold text-white mb-1">
                      {actionModal.type === 'SALE' ? "Ownership Transfer" : "Lease Application"}
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                      Amount: <span className={`${actionModal.type === 'SALE' ? 'text-blue-400' : 'text-purple-400'} font-bold`}>{actionModal.type === 'SALE' ? selectedProperty.price : selectedProperty.leasePrice} ETH</span>
                  </p>

                  <form onSubmit={processTransaction} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                              {actionModal.type === 'SALE' ? "New Owner Legal Name" : "Tenant Legal Name"}
                          </label>
                          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition text-sm" required placeholder="e.g. John Doe" />
                      </div>

                      {actionModal.type === 'LEASE' && (
                          <div className="space-y-3 pt-3 border-t border-white/5">
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">KYC Documents</p>
                              
                              <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                  <label className="block text-xs text-gray-400 mb-2">Aadhaar (Front)</label>
                                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhaarFront')} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" required />
                              </div>
                              
                              <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                  <label className="block text-xs text-gray-400 mb-2">Aadhaar (Back)</label>
                                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhaarBack')} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" required />
                              </div>
                          </div>
                      )}

                      <div className="pt-4 mt-4">
                          <button type="submit" className={`w-full py-3.5 rounded-xl font-bold text-white transition-colors text-sm ${actionModal.type === 'SALE' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'}`}>
                              Pay & {actionModal.type === 'SALE' ? 'Transfer' : 'Confirm'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default PropertyMap;