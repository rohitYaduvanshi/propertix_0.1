import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useAuth } from "../context/AuthContext.jsx";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";

const Home = () => {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [scannedHash, setScannedHash] = useState("0x71C...9A21");

  const [searchedProperty, setSearchedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { isWalletConnected, connectWallet } = useAuth();

  // Animation Effect
  useEffect(() => {
    const interval = setInterval(() => {
      const chars = "0123456789ABCDEF";
      let newHash = "0x";
      for (let i = 0; i < 4; i++) newHash += chars[Math.floor(Math.random() * 16)];
      newHash += "...";
      for (let i = 0; i < 4; i++) newHash += chars[Math.floor(Math.random() * 16)];
      setScannedHash(newHash);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    setResult(null);
    setSearchedProperty(null);

    if (!hash.trim()) return;
    const searchKey = hash.trim();

    try {
      setIsSearching(true);

      if (!window.ethereum) {
        setResult("no-wallet");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);

      // LOGIC 1: TX HASH
      if (searchKey.startsWith("0x") && searchKey.length > 42) {
        const tx = await provider.getTransaction(searchKey);
        if (tx) {
          setResult("verified-only");
        } else {
          setResult("not-found");
        }
        setIsSearching(false);
        return;
      }

      // LOGIC 2: IPFS/CONTRACT
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
      const allRequests = await contract.getAllRequests();

      const found = allRequests.find(
        (req) => req.ipfsMetadata && req.ipfsMetadata.includes(searchKey)
      );

      if (found) {
        let meta = { name: "Unknown", description: "No description", image: null, attributes: [] };

        if (found.ipfsMetadata.startsWith("http")) {
          try {
            const response = await fetch(found.ipfsMetadata);
            const json = await response.json();
            meta = { ...meta, ...json };
          } catch (err) {
            console.warn("Could not fetch IPFS metadata", err);
          }
        }

        const getAttr = (key) => meta.attributes?.find(a => a.trait_type === key)?.value || "N/A";

        setSearchedProperty({
          id: found.id.toString(),
          name: meta.name,
          address: getAttr("Address"),
          owner: found.requester,
          price: "Not Listed",
          status: Number(found.status),
          area: getAttr("Area"),
          ipfsHash: found.ipfsMetadata,
          imageUrl: meta.image,
          description: meta.description
        });

        setResult("found");
      } else {
        setResult("not-found");
      }

    } catch (err) {
      console.error("Search Error:", err);
      setResult("error");
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusLabel = (status) =>
    ["⏳ Pending Survey", "📝 Surveyed", "✅ Verified", "❌ Rejected"][status] || "Unknown";

  return (
    <>
      {/* 🌌 HERO SECTION: Updated Background to match your original 'Shocking' look */}
      <section className="relative flex flex-col items-center justify-center px-4 sm:px-8 pt-24 pb-16 min-h-[95vh] bg-[#000000] overflow-hidden">

        {/* 🔥 DYNAMIC GRID BACKGROUND (Exactly like the first picture) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] animate-grid-move"></div>
          
          {/* Aurora Glows */}
          <div className="absolute top-[-10%] left-[20%] w-[60%] h-[500px] bg-gradient-to-b from-purple-900 via-fuchsia-900 to-transparent opacity-30 blur-[120px] rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-900 opacity-20 blur-[100px] rounded-full"></div>
        </div>

        <div className="relative max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center z-10">

          {/* LEFT SIDE: Content & Search */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className={`inline-flex mb-6 rounded-2xl border px-5 py-2 text-[10px] sm:text-xs items-center gap-3 transition-all ${isWalletConnected ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-amber-500/30 bg-amber-500/5 text-amber-400"}`}>
              {isWalletConnected ? (
                <><span className="flex h-2 w-2 rounded-full bg-green-500 animate-ping"></span> Connected to Ledger</>
              ) : (
                <button onClick={connectWallet} className="font-bold hover:text-white transition-colors">⚠️ DISCONNECTED - CLICK TO LINK WALLET</button>
              )}
            </div>

            <p className="text-[10px] sm:text-xs font-black tracking-[0.3em] text-cyan-500 mb-4 uppercase">Blockchain Real Estate Ecosystem</p>
            <h1 className="text-4xl sm:text-5xl xl:text-7xl font-black mb-6 text-white leading-[1.1] tracking-tighter">
              The Smartest Way to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Verify & Own Land</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Skip the complex paperwork. Manage your property records on a secure,
              tamper-proof digital ledger with 100% transparency.
            </p>

            {/* SEARCH BOX */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-2 sm:p-3 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto lg:mx-0">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Tx Hash or IPFS URL..."
                  className="flex-1 rounded-2xl bg-black/40 border border-white/5 px-6 py-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-zinc-600 font-mono"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-8 py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSearching ? "SCANNING..." : "VERIFY"}
                </button>
              </div>

              {/* DYNAMIC RESULTS */}
              {result === "found" && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center group">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Property Authenticated</p>
                  <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-white text-black text-[10px] font-black rounded-xl hover:bg-emerald-400 transition-all">VIEW DEED</button>
                </div>
              )}
              {result === "not-found" && <p className="mt-4 text-center text-xs text-rose-500 font-bold uppercase">No records detected in this block.</p>}
              {result === "verified-only" && <p className="mt-4 text-center text-xs text-blue-400 font-bold uppercase">⛓️ Transaction Verified on Chain</p>}
            </div>
          </div>

          {/* RIGHT SIDE: Animated Card (Digital Deed) */}
          <div className="order-1 lg:order-2 flex justify-center items-center perspective-1000">
            <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-[3/4] bg-zinc-900/20 border border-white/10 rounded-[48px] p-8 backdrop-blur-3xl shadow-[0_0_100px_rgba(34,211,238,0.1)] overflow-hidden group">
              {/* Scan Line Effect */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_rgba(34,211,238,0.8)] z-20 animate-scan" />

              <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Ledger</p>
                  <h3 className="text-white text-lg font-bold">Secure Asset V.2</h3>
                </div>
                <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
              </div>

              <div className="space-y-4 font-mono">
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-zinc-600 uppercase mb-2">Block Hash Address</p>
                  <p className="text-cyan-400 text-xs font-mono truncate">{scannedHash}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">OWNER</p>
                    <p className="text-zinc-200 text-[10px] font-bold">Rohit Kumar</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">LOCATION</p>
                    <p className="text-zinc-200 text-[10px] font-bold">Bihar, IN</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-8 left-8 right-8 flex justify-between text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                <span>Status: <span className="text-green-400">Verified</span></span>
                <span>Block: #8921..</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ PROPERTY DETAILS MODAL (Original Logic) */}
      {showModal && searchedProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl bg-zinc-950 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 z-20 p-2 bg-black/60 text-white rounded-full hover:bg-zinc-800 transition backdrop-blur-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>

            {/* Modal Left: Image */}
            <div className="w-full md:w-1/2 min-h-[300px] bg-zinc-900 relative">
              {searchedProperty.imageUrl ? (
                <img src={searchedProperty.imageUrl} alt="Property" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                  <span className="text-6xl mb-2">🏠</span>
                  <span className="text-sm">No Image Available</span>
                </div>
              )}
              <div className="absolute bottom-6 left-6">
                <span className={`px-4 py-2 text-xs font-bold text-white rounded-full shadow-lg backdrop-blur-md ${searchedProperty.status === 2 ? "bg-emerald-500/80" : "bg-blue-500/80"}`}>
                  {getStatusLabel(searchedProperty.status)}
                </span>
              </div>
            </div>

            {/* Modal Right: Details */}
            <div className="w-full md:w-1/2 p-8 sm:p-12 overflow-y-auto flex flex-col">
              <div className="mb-6">
                <h2 className="text-3xl font-black text-white mb-2">{searchedProperty.name}</h2>
                <p className="text-cyan-400 font-bold text-sm">📍 {searchedProperty.address}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Area</p>
                  <p className="text-xl text-white font-medium">{searchedProperty.area} <span className="text-xs text-gray-400">Sq Ft</span></p>
                </div>
                <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Status</p>
                  <p className="text-xl text-cyan-400 font-medium">{searchedProperty.status === 2 ? "Verified" : "Pending"}</p>
                </div>
              </div>

              <div className="mb-10">
                <p className="text-[9px] text-gray-500 font-bold uppercase mb-2">Description</p>
                <p className="text-sm text-gray-300 leading-relaxed bg-zinc-900/50 p-4 rounded-xl">
                  {searchedProperty.description}
                </p>
              </div>

              <div className="mt-auto">
                <p className="text-[9px] text-gray-500 font-bold uppercase mb-2 tracking-widest">Ownership Token</p>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                    {searchedProperty.owner ? searchedProperty.owner.slice(2, 4).toUpperCase() : "??"}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono truncate">{searchedProperty.owner}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CSS (Only for Background Animation) */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes grid-move {
            0% { transform: translateY(0); }
            100% { transform: translateY(54px); }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-grid-move { animation: grid-move 3s linear infinite; }
        .animate-scan { animation: scan 4s ease-in-out infinite; }
        .perspective-1000 { perspective: 1000px; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #18181b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 3px; }
      `}</style>
    </>
  );
};

export default Home;