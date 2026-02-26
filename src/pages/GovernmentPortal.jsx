import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import { 
    ShieldCheck, UserCheck, FileSearch, AlertCircle, 
    Loader2, Eye, ExternalLink, MapPin, Layers, 
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
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-6 font-sans">
            
            {/* --- 🖼️ FIXED PREVIEW MODAL --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
                    <div className="bg-zinc-950 border border-white/10 w-full max-w-6xl h-[90vh] rounded-[40px] relative flex flex-col overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.1)]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Evidence Control Center</h3>
                                <p className="text-[9px] text-zinc-500 mt-1 uppercase">Official Blockchain Record Preview</p>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* ✅ IMAGE & PDF PREVIEW FIX */}
                        <div className="flex-1 bg-black p-4 flex items-center justify-center relative overflow-hidden">
                            {selectedDoc.toLowerCase().includes('.pdf') ? (
                                <iframe 
                                    src={`${selectedDoc}#toolbar=0`} 
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
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] italic">Authority_Portal_v4.5</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">Identity <span className="text-blue-500">Desk</span></h1>
                </header>

                {pendingRequests.length === 0 ? (
                    <div className="py-40 text-center border border-dashed border-white/10 rounded-[60px] bg-zinc-950/10">
                        <ShieldCheck className="mx-auto text-zinc-800 mb-6" size={64} />
                        <h2 className="text-xl font-black uppercase text-zinc-700 tracking-[0.3em]">No Pending Identity Bonds</h2>
                    </div>
                ) : (
                    <div className="grid gap-10">
                        {pendingRequests.map((req, idx) => (
                            <div key={req.requestId || idx} className="bg-zinc-950 border border-white/5 rounded-[56px] overflow-hidden hover:border-blue-500/30 transition-all duration-700">
                                <div className="p-10 md:p-14 flex flex-col xl:flex-row gap-16">
                                    <div className="flex-1 space-y-10">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-blue-600 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase italic tracking-widest">Ticket #{req.requestId}</span>
                                            <div className="h-px flex-1 bg-white/5"></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-7 bg-black/40 rounded-[32px] border border-white/5">
                                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-4 italic">Aadhaar Hash</p>
                                                <p className="text-xs font-mono text-zinc-500 break-all">{req.identityRefId}</p>
                                            </div>
                                            <div className="p-7 bg-blue-500/5 rounded-[32px] border border-blue-500/10">
                                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-4 italic">Khasra Number</p>
                                                <p className="text-4xl font-black text-white italic tracking-tighter">{req.khasraNumber}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-12 border-t border-white/5 pt-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500"><UserCheck size={20}/></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase">Claimant</p>
                                                    <p className="text-sm font-black uppercase text-zinc-300">{req.ownerName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500"><Layers size={20}/></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-zinc-600 uppercase">Area</p>
                                                    <p className="text-sm font-black uppercase text-zinc-300">{req.landArea} SQFT</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full xl:w-80 flex flex-col gap-4">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2 text-center">Visual & Legal Assets</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {req.allImages && req.allImages.map((img, i) => (
                                                <div key={i} onClick={() => setSelectedDoc(img)} className="aspect-square bg-zinc-900 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-blue-500 transition-all group">
                                                    <img src={img} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" />
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => setSelectedDoc(req.realDoc)} 
                                            disabled={!req.realDoc}
                                            className="w-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 p-5 rounded-2xl flex items-center justify-between transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <FileText className="text-blue-500" size={20} />
                                                <span className="text-[10px] font-black uppercase text-blue-200">Deed PDF</span>
                                            </div>
                                            <ExternalLink size={16} className="text-blue-500" />
                                        </button>
                                    </div>

                                    <div className="w-full xl:w-64 flex flex-col justify-center border-t xl:border-t-0 xl:border-l border-white/5 pt-10 xl:pt-0 xl:pl-10">
                                        <div className="flex flex-col gap-4">
                                            <button className="w-full py-4 rounded-2xl text-[10px] font-black uppercase text-red-500/40 hover:text-red-500 transition-all">Reject Claim</button>
                                            <button 
                                                onClick={() => handleVerify(req.id)}
                                                disabled={actionLoading === req.requestId}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[12px] py-6 rounded-[30px] uppercase shadow-2xl active:scale-95 disabled:opacity-50 transition-all"
                                            >
                                                {actionLoading === req.requestId ? "Binding..." : "Authorize Bond"}
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