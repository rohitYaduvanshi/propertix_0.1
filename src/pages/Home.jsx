import { useState, useEffect, useRef } from "react";
import { BrowserProvider, Contract } from "ethers";
import Matter from "matter-js"; // Run: npm install matter-js matter-attractors matter-wrap
import "matter-attractors";
import "matter-wrap";
import { useAuth } from "../context/AuthContext.jsx";
import {
    PROPERTY_REGISTRY_ADDRESS,
    PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";

const Home = () => {
    // --- States ---
    const [hash, setHash] = useState("");
    const [result, setResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [scannedHash, setScannedHash] = useState("0x71C...9A21");
    const [searchedProperty, setSearchedProperty] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const { isWalletConnected, connectWallet } = useAuth();

    // --- Refs ---
    const cardRef = useRef(null);
    const sceneCanvas = useRef(null);

    // --- Matter.js Physics Background Logic ---
    useEffect(() => {
        const { Engine, Render, Runner, World, Bodies, Body, Mouse, Events, Common } = Matter;

        const engine = Engine.create();
        engine.world.gravity.y = 0;

        const render = Render.create({
            canvas: sceneCanvas.current,
            engine: engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: "transparent",
            },
        });

        // Invisible Attractor Body that follows mouse
        const attractiveBody = Bodies.circle(
            window.innerWidth / 2,
            window.innerHeight / 2,
            0,
            {
                isStatic: true,
                render: { fillStyle: "transparent" },
                plugin: {
                    attractors: [
                        (bodyA, bodyB) => ({
                            x: (bodyA.position.x - bodyB.position.x) * 1e-6,
                            y: (bodyA.position.y - bodyB.position.y) * 1e-6,
                        }),
                    ],
                },
            }
        );

        World.add(engine.world, attractiveBody);

        // Add 60 random physical bodies (polygons and circles)
        for (let i = 0; i < 60; i++) {
            let x = Common.random(0, window.innerWidth);
            let y = Common.random(0, window.innerHeight);
            let s = Common.random() > 0.6 ? Common.random(10, 40) : Common.random(4, 25);
            let sides = Math.floor(Common.random(3, 6));

            const body = Bodies.polygon(x, y, sides, s, {
                mass: s / 20,
                frictionAir: 0.02,
                render: {
                    fillStyle: i % 3 === 0 ? "#111827" : "#0f172a",
                    strokeStyle: "#1e293b",
                    lineWidth: 1,
                },
            });
            World.add(engine.world, body);
        }

        const mouse = Mouse.create(render.canvas);
        Events.on(engine, "afterUpdate", () => {
            if (!mouse.position.x) return;
            Body.translate(attractiveBody, {
                x: (mouse.position.x - attractiveBody.position.x) * 0.12,
                y: (mouse.position.y - attractiveBody.position.y) * 0.12,
            });
        });

        Render.run(render);
        const runner = Runner.create();
        Runner.run(runner, engine);

        const handleResize = () => {
            render.canvas.width = window.innerWidth;
            render.canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        return () => {
            Render.stop(render);
            World.clear(engine.world);
            Engine.clear(engine);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // --- Dynamic Hash Animation ---
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
        try {
            setIsSearching(true);
            if (!window.ethereum) { setResult("no-wallet"); return; }
            const provider = new BrowserProvider(window.ethereum);
            if (hash.startsWith("0x") && hash.length > 42) {
                const tx = await provider.getTransaction(hash);
                setResult(tx ? "verified-only" : "not-found");
                setIsSearching(false);
                return;
            }
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            const allRequests = await contract.getAllRequests();
            const found = allRequests.find(req => req.ipfsMetadata?.includes(hash));
            if (found) { setResult("found"); } else { setResult("not-found"); }
        } catch (err) { setResult("error"); }
        finally { setIsSearching(false); }
    };

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const rotateX = (rect.height / 2 - (e.clientY - rect.top)) / 15;
        const rotateY = ((e.clientX - rect.left) - rect.width / 2) / 15;
        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    return (
        <main className="relative bg-[#020203] min-h-screen overflow-hidden text-white selection:bg-cyan-500/30">
            
            {/* 🏗️ MATTER.JS BACKGROUND (Replacing Grid/Mesh) */}
            <canvas 
                ref={sceneCanvas} 
                className="absolute inset-0 z-0 pointer-events-none opacity-50"
            />

            {/* Overlay for depth and focus */}
            <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#020203_90%)]" />

            <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-24 pb-20 min-h-screen flex items-center">
                <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
                    
                    {/* LEFT SIDE: Content */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="space-y-4">
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest ${isWalletConnected ? 'text-green-400' : 'text-amber-400'}`}>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                                </span>
                                {isWalletConnected ? "System Integrated" : "Wallet Connection Required"}
                            </div>
                            
                            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                                Decentralized <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                                    Land Registry.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-lg max-w-lg leading-relaxed">
                                Verify and secure property deeds on the Ethereum blockchain. Immutable, transparent, and fraud-proof.
                            </p>
                        </div>

                        {/* Search Box */}
                        <div className="p-[1px] rounded-3xl bg-gradient-to-b from-white/20 to-transparent shadow-2xl">
                            <div className="bg-[#0c0c0c]/80 backdrop-blur-xl rounded-[23px] p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={hash}
                                        onChange={(e) => setHash(e.target.value)}
                                        placeholder="Enter TX Hash or IPFS URL..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-cyan-400 transition-all active:scale-95"
                                    >
                                        {isSearching ? "..." : "Verify"}
                                    </button>
                                </div>
                                {result === "found" && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                                        <span>✓ Record Authenticated</span>
                                        <button onClick={() => setShowModal(true)} className="bg-emerald-500 text-black px-3 py-1 rounded-lg">View</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {!isWalletConnected && (
                            <button onClick={connectWallet} className="flex items-center gap-3 text-sm font-bold text-zinc-400 hover:text-white transition-colors">
                                <span className="text-xl">🦊</span> Connect MetaMask to Proceed
                            </button>
                        )}
                    </div>

                    {/* RIGHT SIDE: 3D Card */}
                    <div className="flex justify-center lg:justify-end perspective-1000">
                        <div
                            ref={cardRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => cardRef.current.style.transform = "rotateX(0) rotateY(0)"}
                            className="relative w-full max-w-[350px] aspect-[3/4] bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[2.5rem] p-8 shadow-3xl overflow-hidden group transition-transform duration-200"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan z-20" />
                            
                            <div className="h-full flex flex-col justify-between relative z-10" style={{ transform: "translateZ(50px)" }}>
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" /></svg>
                                    </div>
                                    <span className="text-[8px] font-bold text-green-500 border border-green-500/30 px-2 py-0.5 rounded-full animate-pulse">ON-CHAIN</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Asset Hash</p>
                                        <p className="text-cyan-400 text-xs font-mono truncate">{scannedHash}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] text-zinc-500 font-bold mb-1">OWNER</p>
                                            <p className="text-xs font-bold truncate">ROHIT K.</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[9px] text-zinc-500 font-bold mb-1">LOC</p>
                                            <p className="text-xs font-bold truncate">PATNA, IN</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-[10px] text-zinc-600 font-mono text-center tracking-widest uppercase italic">Tamper Proof Digital Deed</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style>{`
                @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
                .animate-scan { animation: scan 4s linear infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            `}</style>
        </main>
    );
};

export default Home;