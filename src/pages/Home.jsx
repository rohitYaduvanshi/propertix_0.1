import { useState, useEffect, useRef } from "react";
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
    const cardRef = useRef(null);

    // --- 3D TILT EFFECT LOGIC ---
    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (centerY - y) / 10;
        const rotateY = (x - centerX) / 10;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    // Animation Effect (Original)
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
            if (!window.ethereum) { setResult("no-wallet"); return; }
            const provider = new BrowserProvider(window.ethereum);

            if (searchKey.startsWith("0x") && searchKey.length > 42) {
                const tx = await provider.getTransaction(searchKey);
                setResult(tx ? "verified-only" : "not-found");
                setIsSearching(false);
                return;
            }

            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            const allRequests = await contract.getAllRequests();
            const found = allRequests.find((req) => req.ipfsMetadata && req.ipfsMetadata.includes(searchKey));

            if (found) {
                let meta = { name: "Unknown", description: "No description", image: null, attributes: [] };
                if (found.ipfsMetadata.startsWith("http")) {
                    try {
                        const response = await fetch(found.ipfsMetadata);
                        const json = await response.json();
                        meta = { ...meta, ...json };
                    } catch (err) { console.warn("IPFS error", err); }
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
            } else { setResult("not-found"); }
        } catch (err) { setResult("error"); } finally { setIsSearching(false); }
    };

    const getStatusLabel = (status) => ["⏳ Pending Survey", "📝 Surveyed", "✅ Verified", "❌ Rejected"][status] || "Unknown";

    return (
        <div className="relative min-h-screen bg-[#000] overflow-x-hidden">
            
            {/* 💡 WEB3 HANGING BULB DESIGN (Unique Background) */}
            <div className="absolute inset-0 pointer-events-none z-0">
                {/* Wire */}
                <div className="absolute top-0 left-1/2 w-[2px] h-[150px] bg-gradient-to-b from-zinc-800 to-yellow-500/50 -translate-x-1/2"></div>
                {/* Bulb Container */}
                <div className="absolute top-[150px] left-1/2 -translate-x-1/2">
                    {/* Glow Effect (This colors the whole page) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-yellow-500/20 blur-[120px] rounded-full animate-pulse-slow"></div>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-cyan-500/10 blur-[150px] rounded-full"></div>
                    
                    {/* Physical Bulb Hook */}
                    <div className="w-8 h-10 bg-zinc-700 rounded-t-lg mx-auto border-b border-zinc-900 shadow-xl"></div>
                    {/* Bulb Glass with Web3 Icon inside */}
                    <div className="w-16 h-20 bg-gradient-to-b from-yellow-400/80 to-transparent rounded-full border-2 border-yellow-200/30 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                        <span className="text-xl font-black text-yellow-100">W3</span>
                    </div>
                </div>
                {/* Original Moving Grid (Visible only where light hits) */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(circle_at_50%_30%,#000_30%,transparent_70%)] animate-grid-move opacity-40"></div>
            </div>

            <section className="relative z-10 flex flex-col items-center justify-center px-8 pt-24 pb-16 min-h-screen">
                <div className="relative max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">

                    {/* LEFT SIDE: (ORIGINAL CONTENT UNCHANGED) */}
                    <div className="order-1"> {/* order-1 ensures it stays first on mobile */}
                        <div className={`mb-6 rounded-xl border px-4 py-3 text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-2 transition-all duration-300 ${isWalletConnected ? "border-green-500/40 bg-green-500/10 text-green-100" : "border-amber-500/40 bg-amber-500/10 text-amber-100"}`}>
                            {isWalletConnected ? (
                                <div className="flex items-center gap-2"><span>🎉</span><span>Nice! You have connected your wallet.</span></div>
                            ) : (
                                <span>Connect wallet to verify on-chain records.</span>
                            )}
                            {!isWalletConnected && (
                                <button onClick={connectWallet} className="px-3 py-1.5 rounded-full bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all">Connect Wallet</button>
                            )}
                        </div>

                        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400 mb-3 uppercase">BLOCKCHAIN POWERED REAL ESTATE</p>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Property Management <span className="block text-cyan-400">using Blockchain</span></h1>
                        <p className="text-gray-300 text-sm md:text-base mb-6 font-medium">Verify ownership and track property records instantly.</p>

                        {/* SEARCH BOX (ORIGINAL DESIGN) */}
                        <div className="bg-black/70 border border-white/10 rounded-2xl p-5 shadow-xl shadow-amber-900/30 backdrop-blur-sm">
                            <label className="block text-xs font-medium text-gray-300 mb-2 uppercase">Search Property by IPFS URL or TX Hash</label>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input type="text" value={hash} onChange={(e) => setHash(e.target.value)} placeholder="Paste IPFS Link (to view) or Tx Hash (to verify)..."
                                    className="flex-1 rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all" />
                                <button onClick={handleSearch} disabled={isSearching}
                                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold shadow-lg shadow-cyan-500/40 transition-all">
                                    {isSearching ? "Searching..." : "Search"}
                                </button>
                            </div>

                            {/* RESULTS (ORIGINAL) */}
                            {result === "found" && (
                                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
                                    <div><p className="text-sm text-emerald-400 font-bold">✅ Property Found!</p></div>
                                    <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition shadow-lg">View Full Details</button>
                                </div>
                            )}
                            {result === "not-found" && <p className="mt-4 text-sm text-red-400 font-bold">❌ Record Not Found</p>}
                        </div>
                    </div>

                    {/* RIGHT SIDE: (3D DIGITAL DEED - Mobile order-2) */}
                    <div className="order-2 flex justify-center items-center perspective-1000">
                        <div 
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="relative w-80 bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden group cursor-pointer transition-all duration-200"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Scanning Light (Original Effect) */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-20 animate-[scan_3s_ease-in-out_infinite]" />
                            
                            <div className="relative z-10" style={{ transform: "translateZ(40px)" }}>
                                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400">📜</div>
                                        <div><p className="text-white text-sm font-semibold">Digital Deed</p><p className="text-[10px] text-gray-500 uppercase font-black">On-Chain Asset</p></div>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                </div>

                                <div className="space-y-4 font-mono">
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 mb-1">PROPERTY HASH</p><p className="text-cyan-400 text-[11px] truncate">{scannedHash}</p></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 mb-1 font-bold">OWNER</p><p className="text-gray-300 text-xs font-bold uppercase">Rohit Kumar</p></div>
                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5"><p className="text-[10px] text-gray-500 mb-1 font-bold">LOCATION</p><p className="text-gray-300 text-xs font-bold uppercase">Patna, IN</p></div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-3 border-t border-white/5 flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                    <span>Status: <span className="text-green-400 tracking-widest">Verified</span></span>
                                    <span>Block: #8921..</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MODAL (UNCHANGED) */}
            {showModal && searchedProperty && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-zinc-800 rounded-[40px] overflow-hidden flex flex-col md:flex-row h-auto max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 z-20 p-2 bg-black/60 text-white rounded-full">✕</button>
                        <div className="w-full md:w-1/2 min-h-[300px] bg-zinc-900">
                            <img src={searchedProperty.imageUrl} alt="Property" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-full md:w-1/2 p-8 flex flex-col">
                            <h2 className="text-3xl font-black text-white mb-2">{searchedProperty.name}</h2>
                            <p className="text-cyan-400 font-bold text-sm mb-6 uppercase">📍 {searchedProperty.address}</p>
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5"><p className="text-[9px] text-gray-500 uppercase">Area</p><p className="text-xl font-bold">{searchedProperty.area} SQFT</p></div>
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5"><p className="text-[9px] text-gray-500 uppercase">Status</p><p className="text-xl font-bold text-cyan-400">Verified</p></div>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed bg-zinc-900/50 p-4 rounded-2xl">{searchedProperty.description}</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scan { 0%, 100% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
                @keyframes pulse-slow { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.1); } }
                @keyframes grid-move { 0% { transform: translateY(0); } 100% { transform: translateY(54px); } }
                .animate-pulse-slow { animation: pulse-slow 5s ease-in-out infinite; }
                .animate-grid-move { animation: grid-move 3s linear infinite; }
                .perspective-1000 { perspective: 1000px; }
            `}</style>
        </div>
    );
};

export default Home;