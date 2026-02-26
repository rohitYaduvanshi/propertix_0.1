import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import { 
    ShieldCheck, UserCheck, FileSearch, AlertCircle, 
    Loader2, Eye, ExternalLink, MapPin, Layers, 
    Image as ImageIcon, FileText 
} from "lucide-react";

const GovernmentPortal = () => {
    const { walletAddress, isWalletConnected } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedDoc, setSelectedDoc] = useState(null); // For Modal Preview

    const fetchPendingRequests = async () => {
        try {
            if (!window.ethereum) return;
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            
            const allRequests = await contract.getAllRequests();
            // Filter: Only Pending (Status 0)
            const pending = allRequests.filter(req => Number(req.status) === 0);
            
            // ✅ IPFS Metadata fetching logic can be added here if needed, 
            // but assuming contract returns basic data + IPFS link in metadata field.
            setPendingRequests(pending);
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
            setActionLoading(requestId);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

            const tx = await contract.verifyByGovt(requestId);
            await tx.wait();

            alert("✅ Identity Bonded Successfully!");
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
            <p className="text-blue-500 font-black tracking-widest uppercase text-[10px]">Accessing Secure Node...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-6 font-sans selection:bg-blue-500/30">
            
            {/* --- DOCUMENT PREVIEW MODAL --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-zinc-950 border border-white/10 w-full max-w-5xl h-[80vh] rounded-[40px] relative overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 italic">Evidence Preview</h3>
                            <button onClick={() => setSelectedDoc(null)} className="text-zinc-500 hover:text-white font-black uppercase text-[10px] tracking-widest">Close [ESC]</button>
                        </div>
                        <div className="flex-1 bg-black/40 p-4 flex items-center justify-center">
                            {selectedDoc.endsWith('.pdf') ? (
                                <iframe src={selectedDoc} className="w-full h-full rounded-2xl" />
                            ) : (
                                <img src={selectedDoc} alt="Property Evidence" className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <header className="mb-16 relative">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] italic">Department of Revenue • Digital Ledger</p>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">Identity <span className="text-blue-500">Desk</span></h1>
                        </div>
                        <div className="bg-zinc-950 border border-white/5 p-6 rounded-[32px] backdrop-blur-md">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Authenticated Officer</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                                    <ShieldCheck className="text-blue-400" size={20} />
                                </div>
                                <code className="text-[11px] text-blue-200 font-mono bg-blue-500/5 px-3 py-1 rounded-lg border border-blue-500/10">{walletAddress}</code>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                {pendingRequests.length === 0 ? (
                    <div className="py-40 text-center border border-white/5 rounded-[60px] bg-zinc-950/20 backdrop-blur-sm">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="text-zinc-700" size={40} />
                        </div>
                        <h2 className="text-xl font-black uppercase text-zinc-600 tracking-[0.2em]">Queue Empty: No Pending Identities</h2>
                    </div>
                ) : (
                    <div className="grid gap-8">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="bg-zinc-950 border border-white/5 p-1 rounded-[48px] overflow-hidden hover:border-blue-500/40 transition-all duration-500 group shadow-2xl shadow-black">
                                <div className="p-8 flex flex-col xl:flex-row gap-10">
                                    
                                    {/* Left: Metadata & Status */}
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-600 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase italic shadow-lg shadow-blue-900/40">Case ID #{req.id.toString()}</div>
                                            <div className="h-px flex-1 bg-white/5"></div>
                                            <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Stage: Identity Bonding</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-5 bg-black/40 rounded-3xl border border-white/5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <AlertCircle size={14} className="text-blue-500" />
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Identity Hash (Aadhaar/PAN)</p>
                                                </div>
                                                <p className="text-xs font-mono text-blue-100 break-all bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">{req.identityRefId}</p>
                                            </div>
                                            <div className="p-5 bg-black/40 rounded-3xl border border-white/5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Layers size={14} className="text-blue-500" />
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Khasra / Plot Index</p>
                                                </div>
                                                <p className="text-2xl font-black text-white italic tracking-tighter">{req.khasraNumber}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-8 py-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500"><UserCheck size={16}/></div>
                                                <div>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase">Primary Owner</p>
                                                    <p className="text-xs font-bold text-zinc-300">{req.ownerName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500"><MapPin size={16}/></div>
                                                <div>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase">Total Area</p>
                                                    <p className="text-xs font-bold text-zinc-300">{req.landArea} SQFT</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Asset Preview Section */}
                                    <div className="w-full xl:w-80 flex flex-col gap-3">
                                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Evidence Files</p>
                                        
                                        {/* Property Photo Button */}
                                        <button 
                                            onClick={() => setSelectedDoc(req.ipfsMetadata)} // ⚠️ Link your actual photo field here
                                            className="w-full bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 p-4 rounded-2xl flex items-center justify-between group/btn transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <ImageIcon className="text-blue-500" size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Property Photo</span>
                                            </div>
                                            <Eye size={14} className="text-zinc-600 group-hover/btn:text-white" />
                                        </button>

                                        {/* Registry Document Button */}
                                        <button 
                                            onClick={() => setSelectedDoc(req.ipfsMetadata)} // ⚠️ Link your actual doc field here
                                            className="w-full bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 p-4 rounded-2xl flex items-center justify-between group/btn transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-blue-500" size={18} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Registry Deed</span>
                                            </div>
                                            <ExternalLink size={14} className="text-zinc-600 group-hover/btn:text-white" />
                                        </button>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="w-full xl:w-64 flex flex-col justify-between border-t xl:border-t-0 xl:border-l border-white/5 pt-6 xl:pt-0 xl:pl-8">
                                        <div className="mb-6 xl:mb-0">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase mb-4 tracking-tighter italic">Verification_Protocol_v3</p>
                                            <p className="text-[10px] text-zinc-500 leading-relaxed italic">By clicking verify, you confirm that the Aadhaar and Khasra details match the National Land Records.</p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button className="w-full py-4 rounded-2xl text-[10px] font-black uppercase text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10">Reject Request</button>
                                            <button 
                                                onClick={() => handleVerify(req.id)}
                                                disabled={actionLoading === req.id}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] py-5 rounded-3xl uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {actionLoading === req.id ? (
                                                    <span className="flex items-center justify-center gap-2 italic">Linking Ledger...</span>
                                                ) : "Authorize & Bond"}
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