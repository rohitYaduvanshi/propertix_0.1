import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import { 
    ShieldCheck, UserCheck, AlertCircle, 
    Loader2, Eye, ExternalLink, Layers, 
    Image as ImageIcon, FileText, X 
} from "lucide-react";

const GovernmentPortal = () => {
    const { walletAddress, isWalletConnected } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const getIPFSLink = (url) => {
        if (!url || typeof url !== 'string') return null;
        if (url.startsWith('ipfs://')) {
            return `https://gateway.pinata.cloud/ipfs/${url.split('ipfs://')[1]}`;
        }
        return url;
    };

    const fetchPendingRequests = async () => {
        try {
            setLoading(true);
            if (!window.ethereum) return;
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            
            const data = await contract.getAllRequests();
            const allRequests = Array.from(data);
            const pending = allRequests.filter(req => req && Number(req.status) === 0);

            const detailedPending = await Promise.all(pending.map(async (req) => {
                const safeId = req.id ? req.id.toString() : Math.random().toString();
                try {
                    const metaURL = getIPFSLink(req.ipfsMetadata);
                    const metaResponse = await fetch(metaURL);
                    const metaData = await metaResponse.json();
                    
                    return {
                        ...req,
                        requestId: safeId,
                        allImages: metaData.images ? metaData.images.map(img => getIPFSLink(img)) : [],
                        realDoc: getIPFSLink(metaData.document || null),
                        ownerName: req.ownerName || "Unknown Owner",
                        landArea: req.landArea ? req.landArea.toString() : "0"
                    };
                } catch (err) {
                    return { ...req, requestId: safeId, allImages: [], landArea: req.landArea?.toString() || "0" };
                }
            }));
            setPendingRequests(detailedPending);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isWalletConnected) fetchPendingRequests();
    }, [isWalletConnected]);

    const handleVerify = async (requestId) => {
        try {
            setActionLoading(requestId.toString());
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);
            const tx = await contract.verifyByGovt(requestId);
            await tx.wait();
            alert("✅ Identity Linked & Verified!");
            fetchPendingRequests();
        } catch (error) {
            alert("Error: " + (error.reason || error.message));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={50}/>
            <p className="text-blue-500 font-black tracking-widest uppercase text-[10px]">Syncing Govt Records...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-24 pb-20 px-6 font-sans">
            
            {/* --- PREVIEW MODAL --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl">
                    <div className="bg-zinc-950 border border-white/10 w-full max-w-6xl h-[90vh] rounded-[40px] relative flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Document Evidence Preview</h3>
                            <button onClick={() => setSelectedDoc(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 bg-black p-4 flex items-center justify-center relative overflow-hidden">
                            {selectedDoc.toLowerCase().includes('.pdf') ? (
                                <iframe 
                                    src={selectedDoc} 
                                    className="w-full h-full rounded-2xl bg-white" 
                                    title="PDF Viewer"
                                />
                            ) : (
                                <img 
                                    src={selectedDoc} 
                                    alt="Evidence" 
                                    className="max-h-full max-w-full object-contain rounded-xl shadow-2xl" 
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] italic">Authority_Portal_v5.0</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">Identity <span className="text-blue-500 underline decoration-blue-500/20">Desk</span></h1>
                </header>

                {pendingRequests.length === 0 ? (
                    <div className="py-40 text-center border border-dashed border-zinc-800 rounded-[60px] bg-zinc-900/5">
                        <ShieldCheck className="mx-auto text-zinc-800 mb-6" size={64} />
                        <h2 className="text-xl font-black uppercase text-zinc-700 tracking-[0.3em]">No Pending Identity Bonds</h2>
                    </div>
                ) : (
                    <div className="grid gap-12">
                        {pendingRequests.map((req, idx) => (
                            <div key={req.requestId || idx} className="bg-zinc-950/50 border border-white/5 rounded-[56px] overflow-hidden hover:border-blue-500/40 transition-all duration-700 shadow-2xl">
                                <div className="p-10 md:p-14 flex flex-col xl:flex-row gap-16">
                                    <div className="flex-1 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-blue-600 text-white text-[11px] font-black px-6 py-2 rounded-full uppercase italic tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)]">Request ID: {req.requestId}</span>
                                            <div className="h-px flex-1 bg-white/5"></div>
                                        </div>

                                        {/* --- 🚨 CRITICAL DATA BOXES (HIGH VISIBILITY) --- */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-7 bg-zinc-900/80 rounded-[32px] border border-blue-500/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <AlertCircle className="text-blue-400 w-4 h-4" />
                                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest italic">Aadhaar Hash (Verification ID)</p>
                                                </div>
                                                <p className="text-sm font-mono text-white break-all bg-black/50 p-4 rounded-xl border border-white/10 select-all">
                                                    {req.identityRefId}
                                                </p>
                                            </div>
                                            
                                            <div className="p-7 bg-blue-600/10 rounded-[32px] border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 italic">Khasra / Plot Number</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{req.khasraNumber}</span>
                                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">(Records Sync)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-12 border-t border-white/5 pt-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-blue-500 border border-white/5"><UserCheck size={24}/></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Claimant Name</p>
                                                    <p className="text-lg font-black uppercase text-white">{req.ownerName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-blue-500 border border-white/5"><Layers size={24}/></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Land Area</p>
                                                    <p className="text-lg font-black uppercase text-white">{req.landArea} SQFT</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- 🖼️ VISUAL ASSETS --- */}
                                    <div className="w-full xl:w-80 flex flex-col gap-6">
                                        <div>
                                            <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 text-center italic">Property Evidence</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {req.allImages && req.allImages.map((img, i) => (
                                                    <div key={i} onClick={() => setSelectedDoc(img)} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-blue-500 hover:scale-105 transition-all shadow-lg">
                                                        <img src={img} className="w-full h-full object-cover" alt="Property" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setSelectedDoc(req.realDoc)} 
                                            disabled={!req.realDoc}
                                            className="w-full bg-zinc-900 hover:bg-blue-600/20 border border-blue-500/30 p-5 rounded-[24px] flex items-center justify-between transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <FileText className="text-blue-500 group-hover:scale-110 transition-transform" size={24} />
                                                <span className="text-[11px] font-black uppercase text-blue-200">Legal Deed PDF</span>
                                            </div>
                                            <ExternalLink size={18} className="text-blue-500" />
                                        </button>
                                    </div>

                                    {/* Action Desk */}
                                    <div className="w-full xl:w-64 flex flex-col justify-center border-t xl:border-t-0 xl:border-l border-white/10 pt-10 xl:pt-0 xl:pl-10">
                                        <div className="flex flex-col gap-5">
                                            <button className="w-full py-4 rounded-2xl text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10">Reject Request</button>
                                            <button 
                                                onClick={() => handleVerify(req.id)}
                                                disabled={actionLoading === req.requestId}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[12px] py-7 rounded-[32px] uppercase shadow-[0_15px_30px_rgba(37,99,235,0.3)] active:scale-95 disabled:opacity-50 transition-all"
                                            >
                                                {actionLoading === req.requestId ? "Bonding Ledger..." : "Authorize Bond"}
                                            </button>
                                        </div>
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