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

    // 3D Tilt Effect Logic
    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    };

    // Random Hash Animation
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
        setIsSearching(true);

        try {
            if (!window.ethereum) { setResult("no-wallet"); return; }
            const provider = new BrowserProvider(window.ethereum);
            const searchKey = hash.trim();

            if (searchKey.startsWith("0x") && searchKey.length > 42) {
                const tx = await provider.getTransaction(searchKey);
                setResult(tx ? "verified-only" : "not-found");
                return;
            }

            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            const allRequests = await contract.getAllRequests();
            const found = allRequests.find(req => req.ipfsMetadata && req.ipfsMetadata.includes(searchKey));

            if (found) {
                const response = await fetch(found.ipfsMetadata);
                const meta = await response.json();
                const getAttr = (key) => meta.attributes?.find(a => a.trait_type === key)?.value || "N/A";

                setSearchedProperty({
                    id: found.id.toString(),
                    name: meta.name,
                    address: getAttr("Address"),
                    owner: found.requester,
                    status: Number(found.status),
                    area: getAttr("Area"),
                    imageUrl: meta.image,
                    description: meta.description
                });
                setResult("found");
            } else { setResult("not-found"); }
        } catch (err) { setResult("error"); } finally { setIsSearching(false); }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500 selection:text-black overflow-x-hidden">
            {/* --- PREMIUM AURORA BACKGROUND --- */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/20 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    
                    {/* --- LEFT CONTENT: STARTUP VIBE --- */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">Trusted by 10k+ Citizens</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-white">
                            India's First <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                                Digital Land Ledger
                            </span>
                        </h1>

                        <p className="text-lg text-zinc-400 max-w-lg leading-relaxed font-medium">
                            Skip the paperwork. Verify, track, and manage property ownership on an immutable decentralized network. 
                            <span className="text-white"> Secured by Cryptography.</span>
                        </p>

                        {/* PREMIUM SEARCH BOX */}
                        <div className="relative group max-w-xl">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                            <div className="relative flex flex-col md:flex-row gap-3 bg-black/40 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                                <input 
                                    type="text" 
                                    value={hash}
                                    onChange={(e) => setHash(e.target.value)}
                                    placeholder="Enter IPFS Link or Transaction Hash..."
                                    className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-medium text-white"
                                />
                                <button 
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="bg-white text-black px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-all active:scale-95"
                                >
                                    {isSearching ? "Searching..." : "Verify Now"}
                                </button>
                            </div>
                        </div>

                        {/* QUICK RESULT BADGES */}
                        {result === "found" && (
                            <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-bounce">
                                <div className="p-2 bg-emerald-500 rounded-full text-black">✓</div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-tight">Authenticity Confirmed</p>
                                    <button onClick={() => setShowModal(true)} className="text-xs text-emerald-400 underline font-bold">View Digital Deed</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- RIGHT SIDE: 3D INTERACTIVE CARD --- */}
                    <div className="flex justify-center items-center perspective-1000 order-first lg:order-last">
                        <div 
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="relative w-80 md:w-96 aspect-[3/4] bg-gradient-to-br from-zinc-800/40 to-black border border-white/20 rounded-[40px] p-8 shadow-2xl transition-all duration-200 ease-out cursor-pointer overflow-hidden group"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Glass Shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Card Content */}
                            <div className="relative z-10 h-full flex flex-col justify-between" style={{ transform: "translateZ(50px)" }}>
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🇮🇳</div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Serial No.</p>
                                        <p className="text-xs font-mono text-cyan-400">#PRP-2026-X8</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter mb-1">Asset Identity Hash</p>
                                        <p className="text-[11px] font-mono text-white/80 break-all bg-black/40 p-3 rounded-xl border border-white/5">{scannedHash}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-white">
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Certified Owner</p>
                                            <p className="text-xs font-bold">Rohit Kumar</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">Status</p>
                                            <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SECURED
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white text-black p-4 rounded-3xl flex items-center justify-between shadow-xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Ownership Deed</span>
                                    <span className="text-lg">⚖️</span>
                                </div>
                            </div>

                            {/* Floating Decorative Elements */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/20 blur-2xl rounded-full" />
                        </div>
                    </div>
                </div>
            </main>

            {/* --- SEARCH RESULT MODAL --- */}
            {showModal && searchedProperty && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-white/10 rounded-[40px] max-w-4xl w-full overflow-hidden flex flex-col md:flex-row shadow-3xl">
                        <div className="md:w-1/2 bg-zinc-800 relative h-64 md:h-auto">
                            {searchedProperty.imageUrl ? (
                                <img src={searchedProperty.imageUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl opacity-20 text-white">🏘️</div>
                            )}
                            <button onClick={() => setShowModal(false)} className="absolute top-6 left-6 bg-black/50 p-2 rounded-full md:hidden text-white font-bold">✕</button>
                        </div>
                        <div className="md:w-1/2 p-8 md:p-12 space-y-6 text-white">
                            <button onClick={() => setShowModal(false)} className="hidden md:block float-right text-zinc-500 hover:text-white font-bold">✕ Close</button>
                            <h2 className="text-3xl font-black text-white">{searchedProperty.name}</h2>
                            <p className="text-cyan-400 font-bold tracking-tight uppercase">📍 {searchedProperty.address}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Dimension</p>
                                    <p className="text-lg font-bold text-white">{searchedProperty.area} SqFt</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Registry</p>
                                    <p className="text-lg font-bold text-emerald-400">Verified</p>
                                </div>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed">{searchedProperty.description}</p>
                            <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-black text-black">{searchedProperty.owner?.slice(2,4).toUpperCase()}</div>
                                <p className="text-xs font-mono text-zinc-500 truncate">{searchedProperty.owner}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Home;