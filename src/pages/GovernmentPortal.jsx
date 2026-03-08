import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useSmartAccount } from "../context/SmartAccountContext"; // ✅ Smart Account Integrated
import { 
    ShieldCheck, UserCheck, AlertCircle, 
    Loader2, Eye, ExternalLink, Layers, 
    Image as ImageIcon, FileText, X, Fingerprint
} from "lucide-react";

const GovernmentPortal = () => {
    const { smartAccount, smartAccountAddress, isLocalhost } = useSmartAccount(); // ✅ Discussed Context
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const getIPFSLink = (url) => {
        if (!url || typeof url !== 'string') return null;
        const cid = url.startsWith('ipfs://') ? url.split('ipfs://')[1] : url;
        return `https://gateway.pinata.cloud/ipfs/${cid}`;
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            // Handling Localhost vs Amoy [cite: 2026-03-01]
            const provider = isLocalhost 
                ? new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545")
                : new ethers.providers.Web3Provider(window.ethereum);

            const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            
            const data = await contract.getAllRequests();
            const pending = data.filter(req => Number(req.status) === 0);

            const detailed = await Promise.all(pending.map(async (req) => {
                try {
                    const aadhaarHash = await contract.walletToIdentity(req.requester);
                    const metaResponse = await fetch(getIPFSLink(req.ipfsMetadata));
                    const metaData = await metaResponse.json();
                    
                    return {
                        ...req,
                        requestId: req.id.toString(),
                        originalId: req.id,
                        displayAadhaar: aadhaarHash,
                        allImages: metaData.images ? metaData.images.map(img => getIPFSLink(img)) : [],
                        realDoc: getIPFSLink(metaData.document),
                        landArea: req.landArea?.toString() || "0",
                        khasraNo: req.khasraNumber || "N/A"
                    };
                } catch (err) {
                    return { ...req, requestId: req.id.toString(), originalId: req.id };
                }
            }));
            setPendingRequests(detailed);
        } catch (error) {
            console.error("Ledger Access Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (smartAccountAddress) fetchRequests();
    }, [smartAccountAddress]);

    const handleVerify = async (originalId) => {
        try {
            setActionLoading(originalId.toString());
            
            // Using smartAccount (Biconomy or Hardhat Signer) [cite: 2026-03-01]
            const contract = new ethers.Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, smartAccount);
            
            const tx = await contract.verifyByGovt(originalId);
            await tx.wait();
            
            alert("✅ Phase 1 Verification Success: Identity Bonded to Property.");
            fetchRequests();
        } catch (error) {
            alert("Protocol Rejection: " + (error.reason || "Unauthorized Access"));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <div className="relative">
                <div className="w-24 h-24 border-2 border-blue-500/20 rounded-full animate-ping"></div>
                <Fingerprint className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" size={40} />
            </div>
            <p className="mt-8 text-blue-500 font-black tracking-[0.5em] uppercase text-[10px] animate-pulse">Decrypting Ledger Node...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-24 pb-20 px-6 font-sans selection:bg-blue-500/30">
            {/* --- IMMERSIVE DOCUMENT PREVIEW --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
                    <div className="bg-zinc-950 border border-white/10 w-full max-w-6xl h-[85vh] rounded-[40px] relative flex flex-col shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Evidence_Record_v4.0</h3>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all group">
                                <X size={20} className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                        <div className="flex-1 p-6 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 to-transparent">
                            {selectedDoc.toLowerCase().includes('.pdf') ? (
                                <iframe src={selectedDoc} className="w-full h-full rounded-3xl border-none bg-white" />
                            ) : (
                                <img src={selectedDoc} alt="Evidence" className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <header className="mb-20 relative">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full"></div>
                    <p className="text-blue-500 font-black text-[10px] tracking-[0.5em] uppercase mb-4 italic">Authority_Access_Level_02</p>
                    <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
                        Verification <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Hub</span>
                    </h1>
                </header>

                {pendingRequests.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-zinc-900 rounded-[80px] bg-zinc-950/50">
                        <ShieldCheck className="mx-auto text-zinc-800 mb-8" size={80} />
                        <h2 className="text-2xl font-black uppercase text-zinc-700 tracking-[0.4em]">Clear Ledger</h2>
                        <p className="text-zinc-800 text-[10px] mt-4 font-bold uppercase">No pending validation requests found in this node.</p>
                    </div>
                ) : (
                    <div className="grid gap-16">
                        {pendingRequests.map((req) => (
                            <div key={req.requestId} className="group relative bg-zinc-950/50 border border-white/5 hover:border-blue-500/30 rounded-[64px] p-12 md:p-16 transition-all duration-700 hover:shadow-[0_0_80px_rgba(59,130,246,0.05)] overflow-hidden">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
                                
                                <div className="relative z-10 flex flex-col xl:flex-row gap-20">
                                    <div className="flex-1 space-y-12">
                                        <div className="flex items-center gap-6">
                                            <span className="bg-blue-600 text-white text-[12px] font-black px-8 py-3 rounded-full uppercase italic tracking-widest shadow-lg shadow-blue-600/20">Task ID: {req.requestId}</span>
                                            <div className="h-px flex-1 bg-white/5"></div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="p-8 bg-zinc-900/80 rounded-[40px] border border-white/5 group-hover:border-blue-500/20 transition-colors">
                                                <p className="text-[10px] font-black text-blue-500 uppercase mb-6 tracking-widest italic flex items-center gap-2">
                                                    <Fingerprint size={14}/> Identity Hash
                                                </p>
                                                <p className="text-sm font-mono text-zinc-400 break-all leading-relaxed bg-black/40 p-4 rounded-2xl">{req.displayAadhaar}</p>
                                            </div>
                                            <div className="p-8 bg-blue-600/5 rounded-[40px] border-2 border-blue-600/20 group-hover:border-blue-500/50 transition-all text-center lg:text-left">
                                                <p className="text-[10px] font-black text-blue-400 uppercase mb-6 tracking-widest italic">Khasra_Index</p>
                                                <span className="text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl">{req.khasraNo}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-12 pt-12 border-t border-white/5">
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-600 uppercase mb-2">Claimant Name</p>
                                                <p className="text-lg font-black italic uppercase text-white tracking-tight">{req.ownerName}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-600 uppercase mb-2">Total Surface Area</p>
                                                <p className="text-lg font-black italic uppercase text-white tracking-tight">{req.landArea} <span className="text-blue-500 font-medium">SQFT</span></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full xl:w-96 space-y-8">
                                        <div className="grid grid-cols-3 gap-4">
                                            {req.allImages?.slice(0, 3).map((img, i) => (
                                                <div key={i} onClick={() => setSelectedDoc(img)} className="aspect-square bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-blue-500 hover:scale-105 transition-all shadow-xl">
                                                    <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="Asset" />
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setSelectedDoc(req.realDoc)} className="w-full bg-zinc-900/50 hover:bg-blue-600/10 border border-white/10 hover:border-blue-500/50 p-6 rounded-[32px] flex items-center justify-between transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                                                <div className="text-left">
                                                    <p className="text-[11px] font-black uppercase text-white">Property_Deed.pdf</p>
                                                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Verified IPFS Storage</p>
                                                </div>
                                            </div>
                                            <ExternalLink size={18} className="text-zinc-600 group-hover:text-blue-500" />
                                        </button>

                                        <button 
                                            onClick={() => handleVerify(req.originalId)} 
                                            disabled={actionLoading === req.requestId}
                                            className="w-full group/btn relative overflow-hidden bg-white hover:bg-blue-500 text-black hover:text-white font-black text-[14px] py-8 rounded-[40px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl active:scale-95 disabled:opacity-50"
                                        >
                                            <span className="relative z-10">{actionLoading === req.requestId ? "Authorizing..." : "Execute Bond"}</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GovernmentPortal;