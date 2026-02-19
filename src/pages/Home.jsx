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

    const cardRef = useRef(null);

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

    const getStatusLabel = (status) =>
        ["⏳ Pending Survey", "📝 Surveyed", "✅ Verified", "❌ Rejected"][status] || "Unknown";

    return (
        <>
            {/* ✅ HERO SECTION: Background updated to 'Shocking' Grid, but Layout is Original */}
            <section className="relative flex flex-col items-center justify-center px-8 pt-16 pb-10 overflow-hidden min-h-screen bg-[#000000]">

                {/* ✨ ULTRA-PREMIUM MESH BACKGROUND START */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#020203]">
                    {/* 🎡 RESPONSIVE "HOW TO START" BUTTON */}
                    <div className="fixed top-18 right-4 lg:top-auto lg:bottom-10 lg:right-10 z-[60] group cursor-pointer animate-in fade-in duration-1000">
                        <div className="relative w-18 h-18 lg:w-32 lg:h-32 flex items-center justify-center">

                            {/* घूमने वाला टेक्स्ट (Circular Text) */}
                            <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <path
                                        id="circlePath"
                                        d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                                        fill="none"
                                    />
                                    <text className="text-[10px] font-black uppercase fill-cyan-500 tracking-[0.25em] group-hover:fill-white transition-colors">
                                        <textPath href="#circlePath">
                                            • HOW TO START • GET VERIFIED •
                                        </textPath>
                                    </text>
                                </svg>
                            </div>

                            {/* बीच वाला आइकन - Glassmorphism Touch */}
                            <div className="relative w-10 h-10 lg:w-14 lg:h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-cyan-500/50 transition-all duration-300">
                                <span className="text-lg lg:text-xl group-hover:animate-bounce">💡</span>
                            </div>

                            {/* Glowing Effect underneath */}
                            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>


                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-orb-move-1"></div>
                    <div className="absolute bottom-[0%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] animate-orb-move-2"></div>
                    <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse"></div>

                    {/* 2.(Texture) */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

                    {/* 3.(Focus Point) */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020203_80%)]"></div>

                </div>
                {/* ✨ ULTRA-PREMIUM MESH BACKGROUND END */}

                <div className="relative max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center mb-16 z-10">

                    {/* LEFT SIDE (AAPKA ORIGINAL CODE) */}
                    <div>
                        <div className={`mb-6 rounded-xl border px-4 py-3 text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-2 transition-all duration-300 ${isWalletConnected ? "border-green-500/40 bg-green-500/10 text-green-100" : "border-amber-500/40 bg-amber-500/10 text-amber-100"}`}>

                            {isWalletConnected ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🎉</span>
                                    <span>Nice! You have connected your wallet.</span>
                                </div>
                            ) : (
                                <span>Connect wallet to verify on-chain records.</span>
                            )}

                            {!isWalletConnected && (
                                <div className="flex items-center gap-2">
                                    <button onClick={connectWallet} className="px-3 py-1.5 rounded-full bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all">Connect Wallet</button>
                                </div>
                            )}
                        </div>

                        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400 mb-3">Securing Tomorrow's Assets Today</p>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">The Smartest Way to Choose<span className="block text-cyan-400">Verify & Own Land</span></h1>
                        <p className="text-gray-300 text-sm md:text-base mb-6">Skip the complex paperwork. Manage your property records on a secure,
                            tamper-proof digital ledger with 100% transparency.</p>

                        {/* SEARCH BOX (AAPKA ORIGINAL DESIGN) */}
                        <div className="bg-black/70 border border-white/10 rounded-2xl p-5 shadow-xl shadow-amber-900/30 backdrop-blur-sm">
                            <label className="block text-xs font-medium text-gray-300 mb-2">SEARCH PROPERTY BY IPFS URL OR TX HASH</label>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    value={hash}
                                    onChange={(e) => setHash(e.target.value)}
                                    placeholder="Paste IPFS Link (to view) or Tx Hash (to verify)..."
                                    className="flex-1 rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="px-5 py-2 rounded-xl bg-white hover:bg-cyan-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold shadow-lg shadow-cyan-500/40 transition-all"
                                >
                                    {isSearching ? "Searching..." : "Search"}
                                </button>
                            </div>

                            {/* RESULTS (AAPKA ORIGINAL CODE) */}
                            {result === "found" && (
                                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-emerald-400 font-bold flex items-center gap-2">✅ Property Found!</p>
                                            <p className="text-xs text-gray-400 mt-1">Authentic record found on blockchain.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowModal(true)}
                                            className="px-4 py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                                        >
                                            View Full Details
                                        </button>
                                    </div>
                                </div>
                            )}

                            {result === "verified-only" && (
                                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-sm text-blue-400 font-bold flex items-center gap-2">
                                        <span className="text-xl">⛓️</span> Transaction Verified on Blockchain
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">
                                        This transaction exists and is confirmed. <br />
                                        <span className="text-gray-500 italic">(To view property photos/details, please search using the IPFS Link)</span>
                                    </p>
                                </div>
                            )}

                            {result === "not-found" && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-sm text-red-400 font-bold">❌ Record Not Found</p>
                                    <p className="text-xs text-gray-400 mt-1">No property matches this hash.</p>
                                </div>
                            )}
                            {result === "error" && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-sm text-red-400 font-bold">⚠ Search Error</p>
                                    <p className="text-xs text-gray-400 mt-1">Something went wrong. Check console.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE (3D DIGITAL DEED) */}
                    {/* 'flex' ensures it's visible on mobile, 'md:flex' handles desktop centering */}
                    <div className="flex justify-center items-center relative perspective-1000 mt-12 md:mt-0">
                        <div
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="relative w-72 sm:w-80 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden group transition-all duration-200 ease-out cursor-pointer"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* Scanning Light Effect */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-20 animate-[scan_3s_ease-in-out_infinite]" />

                            {/* Inner Content with Z-Translation for Parallax effect */}
                            <div style={{ transform: "translateZ(50px)" }} className="relative z-10">
                                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <div><p className="text-white text-sm font-semibold uppercase tracking-tighter">Digital Deed</p><p className="text-[10px] text-gray-500">ERC-721 Secure</p></div>
                                    </div>
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                                </div>

                                <div className="space-y-4 font-mono">
                                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 shadow-inner">
                                        <p className="text-[10px] text-gray-500 mb-1">PROPERTY HASH</p>
                                        <p className="text-cyan-400 text-[11px] truncate">{scannedHash}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 mb-1 font-bold">OWNER</p>
                                            <p className="text-gray-300 text-xs font-bold uppercase truncate">Rohit Kumar</p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-gray-500 mb-1 font-bold">LOCATION</p>
                                            <p className="text-gray-300 text-xs font-bold uppercase">Patna, IN</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-3 border-t border-white/5 flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    <span>Status: <span className="text-green-400">Verified</span></span>
                                    <span>Block: #8921..</span>
                                </div>
                            </div>

                            {/* Decorative Glowing Circle */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full" />
                        </div>
                    </div>
                </div>

            </section>

            {/* ✅ PROPERTY DETAILS MODAL (AAPKA ORIGINAL) */}
            {showModal && searchedProperty && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">

                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/60 text-white rounded-full hover:bg-zinc-800 transition backdrop-blur-md"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>

                        {/* Left: Image */}
                        <div className="w-full md:w-1/2 min-h-[300px] bg-zinc-900 relative">
                            {searchedProperty.imageUrl ? (
                                <img src={searchedProperty.imageUrl} alt="Property" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                                    <span className="text-6xl mb-2">🏠</span>
                                    <span className="text-sm">No Image Available</span>
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <span className={`px-3 py-1 text-xs font-bold text-white rounded-full shadow-lg backdrop-blur-md ${searchedProperty.status === 2 ? "bg-emerald-500/80" : "bg-blue-500/80"}`}>
                                    {getStatusLabel(searchedProperty.status)}
                                </span>
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="w-full md:w-1/2 p-8 flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white mb-1">{searchedProperty.name}</h2>
                                <p className="text-sm text-cyan-400 flex items-center gap-1">
                                    📍 {searchedProperty.address}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Area</p>
                                    <p className="text-lg text-white font-medium">{searchedProperty.area} <span className="text-xs text-gray-400">Sq Ft</span></p>
                                </div>
                                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">Price</p>
                                    <p className="text-lg text-white font-medium">{searchedProperty.price} <span className="text-xs text-cyan-400">ETH</span></p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Description</p>
                                <p className="text-sm text-gray-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50 max-h-32 overflow-y-auto custom-scrollbar">
                                    {searchedProperty.description}
                                </p>
                            </div>

                            <div className="mt-auto">
                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Owner Wallet</p>
                                <div className="flex items-center gap-2 bg-black p-3 rounded-xl border border-zinc-800">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                                        {searchedProperty.owner ? searchedProperty.owner.slice(2, 4).toUpperCase() : "??"}
                                    </div>
                                    <p className="text-xs text-zinc-300 font-mono truncate">{searchedProperty.owner || "Unknown"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ CSS (Only for Background Animation) */}
        </>
    );
};

export default Home;