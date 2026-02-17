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

            if (searchKey.startsWith("0x") && searchKey.length > 42) {
                const tx = await provider.getTransaction(searchKey);
                setResult(tx ? "verified-only" : "not-found");
                setIsSearching(false);
                return;
            }

            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            const allRequests = await contract.getAllRequests();
            const found = allRequests.find(req => req.ipfsMetadata && req.ipfsMetadata.includes(searchKey));

            if (found) {
                let meta = { name: "Unknown", description: "No description", image: null, attributes: [] };
                if (found.ipfsMetadata.startsWith("http")) {
                    try {
                        const response = await fetch(found.ipfsMetadata);
                        meta = { ...meta, ...(await response.json()) };
                    } catch (err) { console.warn("IPFS fetch failed", err); }
                }
                const getAttr = (k) => meta.attributes?.find(a => a.trait_type === k)?.value || "N/A";

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
            setResult("error");
        } finally {
            setIsSearching(false);
        }
    };

    const getStatusLabel = (status) =>
        ["⏳ Pending Survey", "📝 Surveyed", "✅ Verified", "❌ Rejected"][status] || "Unknown";

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-x-hidden">
            
            {/* --- Background Elements --- */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/15 blur-[100px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
                {/* --- Top Badge --- */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWalletConnected ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isWalletConnected ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                            {isWalletConnected ? "System Online" : "Action Required: Connect Wallet"}
                        </span>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    
                    {/* --- Left Column: Hero Content --- */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                                Decentralized <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                                    Property Registry.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
                                Experience the future of real estate. Secure, immutable, and 100% transparent property verification powered by Ethereum.
                            </p>
                        </div>

                        {/* Search Module */}
                        <div className="p-[1px] rounded-3xl bg-gradient-to-b from-white/20 to-transparent shadow-2xl">
                            <div className="bg-[#0c0c0c] rounded-[23px] p-6 space-y-4">
                                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Asset Verification</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1 group">
                                        <input
                                            type="text"
                                            value={hash}
                                            onChange={(e) => setHash(e.target.value)}
                                            placeholder="Tx Hash or IPFS URL..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-zinc-600 group-hover:bg-white/[0.08]"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-cyan-400 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSearching ? "..." : "Verify"}
                                    </button>
                                </div>

                                {/* Results Area */}
                                {result && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                        {result === "found" && (
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">✓</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-emerald-400">Record Authenticated</p>
                                                        <p className="text-[10px] text-zinc-500 uppercase">On-chain data matches</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setShowModal(true)} className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">Explore</button>
                                            </div>
                                        )}
                                        {result === "not-found" && (
                                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center gap-3 text-red-400">
                                                <span className="text-lg">⚠</span>
                                                <p className="text-sm font-medium">No record found on registry.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Connect (if not connected) */}
                        {!isWalletConnected && (
                            <button 
                                onClick={connectWallet}
                                className="group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                            >
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition">
                                    🦊
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">Connect MetaMask</p>
                                    <p className="text-xs text-zinc-500 font-medium">Unlock full verification features</p>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* --- Right Column: Visualization Card --- */}
                    <div className="relative group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative bg-[#0c0c0c] border border-white/10 rounded-[2rem] p-8 shadow-3xl overflow-hidden transform group-hover:rotate-y-2 transition-transform duration-700">
                            
                            {/* Scanning Animation Line */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(34,211,238,0.1)_50%,transparent_100%)] h-20 w-full animate-scan z-20 pointer-events-none" />

                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-tighter">Deed Fragment</p>
                                    <h3 className="text-xl font-bold">Genesis Asset #01</h3>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                    <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                                    </svg>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Dynamic Hash Index.</p>
                                    <p className="font-mono text-xs text-cyan-400 truncate">{scannedHash}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Assigned To</p>
                                        <p className="text-sm font-semibold">Rohit Y.</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase">Region</p>
                                        <p className="text-sm font-semibold">Bihar, IN</p>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-between border-t border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                        Verified State
                                    </span>
                                    <span>Syncing...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Property Modal (Premium Redesign) --- */}
            {showModal && searchedProperty && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-5xl bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
                        
                        <button 
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 z-30 h-10 w-10 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition backdrop-blur-md"
                        >
                            ✕
                        </button>

                        {/* Image Canvas */}
                        <div className="md:w-1/2 bg-zinc-900 relative">
                            {searchedProperty.imageUrl ? (
                                <img src={searchedProperty.imageUrl} alt="Property" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950">
                                    <span className="text-4xl opacity-50">🏠</span>
                                </div>
                            )}
                            <div className="absolute bottom-6 left-6">
                                <span className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-full">
                                    {getStatusLabel(searchedProperty.status)}
                                </span>
                            </div>
                        </div>

                        {/* Details Panel */}
                        <div className="md:w-1/2 p-10 flex flex-col overflow-y-auto custom-scrollbar">
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold mb-2 tracking-tight">{searchedProperty.name}</h2>
                                <p className="text-zinc-500 flex items-center gap-2 text-sm font-medium">
                                    <span className="text-cyan-500">📍</span> {searchedProperty.address}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Total Surface</p>
                                    <p className="text-xl font-bold">{searchedProperty.area} <span className="text-xs text-zinc-500">SQFT</span></p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Market Valuation</p>
                                    <p className="text-xl font-bold text-cyan-400">{searchedProperty.price} <span className="text-xs">ETH</span></p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-3 tracking-widest">Property Genesis</p>
                                    <p className="text-sm text-zinc-400 leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/5 italic">
                                        "{searchedProperty.description}"
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Current Custodian</p>
                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-black border border-white/5">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-black text-xs">
                                            {searchedProperty.owner?.slice(2, 4).toUpperCase()}
                                        </div>
                                        <p className="text-xs font-mono text-zinc-400 truncate">{searchedProperty.owner}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="mt-10 w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-cyan-400 transition active:scale-[0.98]">
                                Initiate Inquiry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(400%); opacity: 0; }
                }
                .animate-scan { animation: scan 4s linear infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                .perspective-1000 { perspective: 1000px; }
                .rotate-y-2 { transform: rotateY(5deg); }
            `}</style>
        </div>
    );
};

export default Home;