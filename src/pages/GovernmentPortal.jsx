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

    // ✅ IPFS URL Fix: converts ipfs:// to https gateway
    const getIPFSLink = (url) => {
        if (!url) return null;
        if (typeof url !== 'string') return null;
        if (url.startsWith('ipfs://')) {
            return `https://gateway.pinata.cloud/ipfs/${url.split('ipfs://')[1]}`;
        }
        return url;
    };

    const fetchPendingRequests = async () => {
        try {
            if (!window.ethereum) return;
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            
            const allRequests = await contract.getAllRequests();
            const pending = allRequests.filter(req => Number(req.status) === 0);

            const detailedPending = await Promise.all(pending.map(async (req) => {
                try {
                    const metaURL = getIPFSLink(req.ipfsMetadata);
                    if (!metaURL) return req;

                    const metaResponse = await fetch(metaURL);
                    const metaData = await metaResponse.json();
                    
                    return {
                        ...req,
                        // ✅ Convert BigInt ID to string safely
                        requestId: req.id.toString(),
                        realImage: getIPFSLink(metaData.images ? metaData.images[0] : null),
                        realDoc: getIPFSLink(metaData.document || null),
                        description: metaData.description || "No description provided."
                    };
                } catch (err) {
                    return { ...req, requestId: req.id.toString() };
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

            alert("✅ Identity & Khasra Verified!");
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
            <p className="text-blue-500 font-black tracking-widest uppercase text-[10px]">Syncing Govt Ledger...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-6 font-sans">
            
            {/* --- PREVIEW MODAL --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
                    <div className="bg-zinc-950 border border-white/10 w-full max-w-5xl h-[85vh] rounded-[40px] relative flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 italic">Evidence Preview</h3>
                            <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 bg-black/40 p-4 flex items-center justify-center overflow-auto">
                            {selectedDoc.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={selectedDoc} className="w-full h-full rounded-2xl border-none" />
                            ) : (
                                <img src={selectedDoc} alt="Evidence" className="max-h-full max-w-full object-contain rounded-xl" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-2 italic">Official_Govt_Node_v4</p>
                        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">Identity <span className="text-blue-500">Desk</span></h1>
                    </div>
                    <div className="bg-zinc-950 border border-white/5 p-6 rounded-[32px] shadow-2xl backdrop-blur-md">
                        <p className="text-[9px] font-black text-zinc-500 uppercase mb-2 tracking-widest text-center">Officer Identity</p>
                        <code className="text-[11px] text-blue-200 font-mono bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 block">
                            {walletAddress?.substring(0, 24)}...
                        </code>
                    </div>
                </header>

                {pendingRequests.length === 0 ? (
                    <div className="py-40 text-center border border-dashed border-white/10 rounded-[60px] bg-zinc-950/10">
                        <ShieldCheck className="mx-auto text-zinc-800 mb-6" size={60} />
                        <h2 className="text-xl font-black uppercase text-zinc-700 tracking-[0.3em]">Queue Empty</h2>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {/* ✅ FIXED: Corrected Index to index and added null checks */}
                        {pendingRequests.map((req, index) => (
                            <div key={req?.requestId || index} className="bg-zinc-950 border border-white/5 rounded-[50px] overflow-hidden hover:border-blue-500/30 transition-all duration-500 shadow-3xl">
                                <div className="p-8 md:p-12 flex flex-col xl:flex-row gap-12">
                                    
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-blue-600 text-white text-[10px] font-black px-5 py-1.5 rounded-full uppercase italic">Request #{req.requestId}</span>
                                            <div className="h-px flex-1 bg-white/5"></div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="p-6 bg-black/40 rounded-[30px] border border-white/5">
                                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-3 italic">Identity Hash</p>
                                                <p className="text-xs font-mono text-zinc-400 break-all">{req.identityRefId}</p>
                                            </div>
                                            <div className="p-6 bg-blue-500/5 rounded-[30px] border border-blue-500/10">
                                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-3 italic">Plot Number (Khasra)</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter">{req.khasraNumber}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-10 border-t border-white/5 pt-8">
                                            <div className="flex items-center gap-3">
                                                <UserCheck className="text-blue-500" size={18}/>
                                                <div>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Citizen Name</p>
                                                    <p className="text-xs font-black uppercase italic">{req.ownerName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Layers className="text-blue-500" size={18}/>
                                                <div>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Claimed Area</p>
                                                    <p className="text-xs font-black uppercase italic">{req.landArea.toString()} SQFT</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full xl:w-72 flex flex-col gap-3 justify-center">
                                        <button 
                                            onClick={() => setSelectedDoc(req.realImage)} 
                                            disabled={!req.realImage}
                                            className="w-full bg-zinc-900/40 hover:bg-blue-600/10 border border-white/5 p-5 rounded-3xl flex items-center justify-between group transition-all disabled:opacity-20"
                                        >
                                            <div className="flex items-center gap-4">
                                                <ImageIcon className="text-blue-500" size={20} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white">Plot Photo</span>
                                            </div>
                                            <Eye size={14} className="text-zinc-700 group-hover:text-blue-500" />
                                        </button>

                                        <button 
                                            onClick={() => setSelectedDoc(req.realDoc)} 
                                            disabled={!req.realDoc}
                                            className="w-full bg-zinc-900/40 hover:bg-blue-600/10 border border-white/5 p-5 rounded-3xl flex items-center justify-between group transition-all disabled:opacity-20"
                                        >
                                            <div className="flex items-center gap-4">
                                                <FileText className="text-blue-500" size={20} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-white">Deed Paper</span>
                                            </div>
                                            <ExternalLink size={14} className="text-zinc-700 group-hover:text-blue-500" />
                                        </button>
                                    </div>

                                    <div className="w-full xl:w-64 flex flex-col justify-center gap-4 border-t xl:border-t-0 xl:border-l border-white/5 pt-8 xl:pt-0 xl:pl-10">
                                        <button 
                                            onClick={() => handleVerify(req.id)}
                                            disabled={actionLoading === req.id.toString()}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] py-6 rounded-[24px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 disabled:opacity-50 transition-all"
                                        >
                                            {actionLoading === req.id.toString() ? "Authorizing..." : "Bond Identity"}
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