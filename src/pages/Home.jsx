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
            <section className="relative flex flex-col items-center justify-center px-8 pt-5 pb-10 overflow-hidden min-h-screen bg-[#000000]">

                {/* ✨ ULTRA-PREMIUM MESH BACKGROUND START */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#020203]">
                    {/* 🎡 RESPONSIVE "HOW TO START" BUTTON */}
                    {/* 🎡 ULTIMATE NOTION BUTTON FIX */}
                    <a
                        href="https://www.notion.so/Your-Adventure-on-Propertix-Starts-Here-30c04694264a80cfa04ad1119ea2bc0e"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fixed top-18 right-4 lg:top-auto lg:bottom-10 lg:right-10 z-[999] group block cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-18 h-18 lg:w-32 lg:h-32 flex items-center justify-center pointer-events-none">

                            {/* CIRCLE TEXT */}
                            <div className="absolute inset-0 animate-[spin_8s_linear_infinite] pointer-events-none">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <path
                                        id="circlePath"
                                        d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                                        fill="none"
                                    />
                                    <text className="text-[10px] font-black uppercase fill-yellow-500 tracking-[0.25em] group-hover:fill-cyan-400 transition-colors">
                                        <textPath href="#circlePath">
                                            • HOW TO START • GET VERIFIED •
                                        </textPath>
                                    </text>
                                </svg>
                            </div>

                            {/* ----------*/}
                            <div className="relative w-12 h-12 lg:w-16 lg:h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-cyan-500/50 transition-all duration-300 pointer-events-auto shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                                <span className="text-xl lg:text-2xl group-hover:animate-bounce">👆</span>
                            </div>

                            {/* Glow Background */}
                            <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                    </a>


                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-orb-move-1"></div>
                    <div className="absolute bottom-[0%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] animate-orb-move-2"></div>
                    <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse"></div>

                    {/* 2.(Texture) */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

                    {/* 3.(Focus Point) */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020203_80%)]"></div>

                </div>
                {/* ✨ ULTRA-PREMIUM MESH BACKGROUND END */}

                {/* 🟢 MAIN CONTAINER: Everything centered vertically */}
                <div className="relative max-w-4xl w-full flex flex-col items-center text-center z-10 mb-16 px-4">

                    {/* 1. WALLET MESSAGE PORTION (Top) */}
                    <div className={`w-full max-w-2xl mb-8 rounded-xl border px-4 py-3 text-xs flex items-center justify-between gap-2 transition-all duration-300 ${isWalletConnected ? "border-green-500/40 bg-green-500/10 text-green-100" : "border-amber-500/40 bg-amber-500/10 text-amber-100"}`}>
                        {isWalletConnected ? (
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🎉</span>
                                <span>Nice! You have connected your wallet.</span>
                            </div>
                        ) : (
                            <span>Connect wallet to verify on-chain records.</span>
                        )}

                        {!isWalletConnected && (
                            <button onClick={connectWallet} className="px-3 py-1.5 rounded-full bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all">
                                Connect Wallet
                            </button>
                        )}
                    </div>

                    {/* 2. TEXT PORTION (Middle) */}
                    <div className="mb-10">
                        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400 mb-3 uppercase">Securing Tomorrow's Assets Today</p>
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white leading-tight">
                            The Smartest Way to Choose
                            <span className="block text-cyan-400">Verify & Own Land</span>
                        </h1>
                        <p className="text-gray-300 text-sm md:text-lg max-w-3xl mx-auto">
                            Skip the complex paperwork. Manage your property records on a secure,
                            tamper-proof digital ledger with 100% transparency.
                        </p>
                    </div>

                    {/* 3. SEARCH BUTTON PORTION (Center) */}
                    <div className="w-full max-w-2xl bg-black/70 border border-white/10 rounded-2xl p-6 shadow-xl shadow-cyan-900/20 backdrop-blur-sm mb-16">
                        <label className="block text-[10px] font-bold text-gray-400 mb-3 text-left uppercase tracking-widest">SEARCH PROPERTY BY TX HASH URL OR IPFS</label>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="text"
                                value={hash}
                                onChange={(e) => setHash(e.target.value)}
                                placeholder="Paste IPFS Link (to view) or Tx Hash (to verify)..."
                                className="flex-1 rounded-xl bg-zinc-900/80 border border-zinc-700 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="px-8 py-3 rounded-xl bg-white hover:bg-cyan-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold shadow-lg shadow-cyan-500/40 transition-all"
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
                                    <span className="text-gray-500 italic">(To view property photos/details, please search using the IPFS Link) </span>
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

                    {/* 4. DIGITAL DEED (Bottom - Floating & Large) */}
                    <div className="flex justify-center items-center relative perspective-1000 w-full animate-bounce-slow">
                        <div
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="relative w-80 sm:w-[400px] bg-black/90 backdrop-blur-md border border-cyan-500/20 rounded-[40px] p-8 shadow-[0_0_60px_rgba(34,211,238,0.2)] overflow-hidden group transition-all duration-200 ease-out cursor-pointer scale-110"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            {/* --- SCANNING LINE CODE REMAINS SAME --- */}
                            <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-[40px]">
                                <div className="absolute w-full h-[2px]" style={{ background: 'linear-gradient(to right, transparent, #22d3ee, #fff, #22d3ee, transparent)', boxShadow: '0 0 20px #22d3ee', top: '0%', animation: 'finalScan 3s linear infinite' }} />
                                <style>{`@keyframes finalScan { 0% { top: -5%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 105%; opacity: 0; } }`}</style>
                            </div>

                            {/* --- CARD CONTENT (Keeping your exact design) --- */}
                            <div style={{ transform: "translateZ(60px)" }} className="relative z-10">
                                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)]">📜</div>
                                        <div>
                                            <p className="text-white text-sm font-black uppercase tracking-widest">Digital Deed</p>
                                            <p className="text-[10px] text-cyan-500/60 font-mono">SECURE-BLOCK-721</p>
                                        </div>
                                    </div>
                                    <div className="h-3 w-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_15px_#22d3ee]"></div>
                                </div>

                                <div className="space-y-6 font-mono">
                                    <div className="bg-black/60 p-4 rounded-2xl border border-cyan-500/20 shadow-inner group-hover:border-cyan-500/60 transition-colors">
                                        <p className="text-[10px] text-zinc-500 mb-1 flex justify-between"><span>DATA HASH</span><span className="text-cyan-500/40 font-bold">VERIFIED</span></p>
                                        <p className="text-cyan-400 text-xs break-all leading-relaxed">{scannedHash || "0x7c12...3a72cc16"}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-zinc-500 mb-1 font-bold tracking-tighter uppercase">Owner_ID</p>
                                            <p className="text-zinc-300 text-sm font-bold uppercase truncate">Rohit Kumar</p>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-zinc-500 mb-1 font-bold tracking-tighter uppercase">Loc_Coord</p>
                                            <p className="text-zinc-300 text-sm font-bold uppercase truncate">Patna, IN</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                        </span>
                                        Identity Synced
                                    </div>
                                    <div className="text-zinc-400">#8921-X</div>
                                </div>
                            </div>
                            {/* Bottom Glow stays */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
                        </div>
                    </div>

                    {/* 🟢 MR. R'S STORY SECTION (Starts after Digital Deed) */}
                    <div className="relative w-full max-w-5xl mt-32 px-4 flex flex-col items-center">

                        {/* 1. THE TRADITIONAL STRUGGLE (India's Reality) */}
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                                Meet Mr. Gopu Chand: The <span className="text-red-500">Traditional Way</span>
                            </h2>
                            <p className="text-zinc-400 max-w-2xl mx-auto italic">
                                "Gopu Chand has all his documents ready, but he is stuck in a loop of offices, middle-men, and endless waiting."
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-10 items-center bg-zinc-900/30 border border-white/5 p-8 rounded-[40px] backdrop-blur-md mb-20">
                            {/* Visual Map & Mr. R */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <img
                                    src="https://image.pollinations.ai/prompt/Indian%20man%20tired%20holding%20bundle%20of%20papers%20walking%20in%20dusty%20government%20office%20map%20overlay%20with%20red%20zigzag%20lines%20showing%20long%20process?width=500&height=500&seed=42"
                                    className="relative z-10 rounded-3xl border border-white/10 shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700"
                                    alt="Traditional Process"
                                />
                                {/* Moving Red Line (Traditional Path) */}
                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500/50 -rotate-12 animate-pulse"></div>
                            </div>

                            {/* The Pain Points (Timeline) */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-red-400 uppercase tracking-tighter">The 90-Day Marathon</h3>
                                <div className="space-y-4 text-left border-l border-red-500/30 pl-6">
                                    <div className="relative">
                                        <span className="absolute -left-[31px] top-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_red]"></span>
                                        <p className="text-white font-bold text-sm">Day 1-15: Document Gathering</p>
                                        <p className="text-zinc-500 text-[10px]">Registry, Khatauni, No-Objection Certificates...</p>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute -left-[31px] top-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_red]"></span>
                                        <p className="text-white font-bold text-sm">Day 16-45: Verification & Bribes</p>
                                        <p className="text-zinc-500 text-[10px]">Multiple visits to the Sub-Registrar office.</p>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute -left-[31px] top-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_red]"></span>
                                        <p className="text-white font-bold text-sm">Day 46-90: Final Stamp & Mutation</p>
                                        <p className="text-zinc-500 text-[10px]">Still waiting for the official name transfer.</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-200 text-xs font-mono">
                                    RESULT: User is Exhausted & Record is still at risk of forgery.
                                </div>
                            </div>
                        </div>

                        {/* 2. THE TRANSITION (The Hook) */}
                        <div className="text-center my-32 animate-bounce-slow">
                            <h3 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase">
                                Don't do <span className="text-red-600">like this!</span>
                            </h3>
                            <div className="bg-cyan-500 text-black px-6 py-2 inline-block font-black text-xl md:text-3xl rounded-full shadow-[0_0_30px_rgba(34,211,238,0.5)]">
                                Here is the BAAP of Trust!
                            </div>
                            <p className="mt-8 text-cyan-400 font-mono text-sm tracking-widest animate-pulse">
                                QUICK VERIFICATION • BLOCKCHAIN IMMUTABILITY • 100% TRANSPARENT
                            </p>
                        </div>

                        {/* 3. THE PROPERTIX WAY (Professional Step-by-Step) */}
                        <div className="w-full bg-zinc-900/50 border border-cyan-500/20 rounded-[50px] p-8 md:p-16 backdrop-blur-xl relative overflow-hidden mb-32">
                            {/* Professional React Design Background */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[120px] rounded-full"></div>

                            <h3 className="text-2xl md:text-4xl font-bold text-white mb-12 text-center">
                                How Propertix <span className="text-cyan-400">Works</span> (The Digital Journey)
                            </h3>

                            <div className="grid md:grid-cols-3 gap-8 relative z-10">
                                {/* Step 1 */}
                                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-cyan-500/50 transition-all group">
                                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">🦊</div>
                                    <h4 className="text-white font-bold mb-2">Connect Identity</h4>
                                    <p className="text-zinc-500 text-xs leading-relaxed">Securely link your MetaMask wallet as your unique digital signature.</p>
                                </div>
                                {/* Step 2 */}
                                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-cyan-500/50 transition-all group">
                                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">📂</div>
                                    <h4 className="text-white font-bold mb-2">Upload to IPFS</h4>
                                    <p className="text-zinc-500 text-xs leading-relaxed">Property images and PDFs are pinned to decentralized storage forever.</p>
                                </div>
                                {/* Step 3 */}
                                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-cyan-500/50 transition-all group">
                                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">⛓️</div>
                                    <h4 className="text-white font-bold mb-2">Mint on Ledger</h4>
                                    <p className="text-zinc-500 text-xs leading-relaxed">Finalize your deed on the blockchain with a single transaction. Done!</p>
                                </div>
                            </div>

                            {/* Professional Screenshot Placeholder */}
                            <div className="mt-16 relative">
                                <img
                                    src="https://image.pollinations.ai/prompt/Modern%20clean%20SaaS%20dashboard%20UI%20showing%20blockchain%20transaction%20success%20dark%20theme%20cyan%20accents%20professional%20web%20design?width=1000&height=600&seed=99"
                                    className="rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                                    alt="Propertix App Screenshot"
                                />
                                {/* Floating Elements on Screenshot */}
                                <div className="absolute -top-6 -right-6 bg-emerald-500 text-black px-4 py-2 rounded-xl font-black text-[10px] animate-bounce">
                                    SUCCESS: MINTED
                                </div>
                            </div>
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
        </>

    );

};
export default Home;
