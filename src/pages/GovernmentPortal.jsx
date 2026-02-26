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
                // ✅ Safe BigInt to String conversion for keys and IDs
                const safeIdStr = req.id.toString(); 
                
                try {
                    const aadhaarHash = await contract.walletToIdentity(req.requester);
                    const metaURL = getIPFSLink(req.ipfsMetadata);
                    const metaResponse = await fetch(metaURL);
                    const metaData = await metaResponse.json();
                    
                    return {
                        ...req,
                        requestId: safeIdStr, // Store as string for UI
                        originalId: req.id,   // Keep BigInt for contract calls
                        displayAadhaar: aadhaarHash,
                        allImages: metaData.images ? metaData.images.map(img => getIPFSLink(img)) : [],
                        realDoc: getIPFSLink(metaData.document || null),
                        ownerName: req.ownerName || "Citizen",
                        landArea: req.landArea ? req.landArea.toString() : "0",
                        khasraNo: req.khasraNumber || "N/A"
                    };
                } catch (err) {
                    return { ...req, requestId: safeIdStr, originalId: req.id, khasraNo: req.khasraNumber };
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

    const handleVerify = async (originalId) => {
        if (!originalId) return;
        try {
            // ✅ FIX: originalId (BigInt) को सीधे इस्तेमाल करें
            setActionLoading(originalId.toString());
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);
            
            const tx = await contract.verifyByGovt(originalId);
            await tx.wait();
            
            alert("✅ Identity Bonded Successfully!");
            fetchPendingRequests();
        } catch (error) {
            // ✅ Fix for toString() error in alert
            const msg = error.reason || error.message || "Unknown error";
            alert("Verification Failed: " + msg);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={50}/>
            <p className="text-blue-500 font-black tracking-widest uppercase text-[10px]">Accessing Ledger...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020202] text-white pt-24 pb-20 px-6 font-sans">
            
            {/* --- MODAL --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl">
                    <div className="bg-zinc-950 border border-white/10 w-full max-w-6xl h-[90vh] rounded-[40px] relative flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Official Record Preview</h3>
                            <button onClick={() => setSelectedDoc(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-zinc-400 hover:white"><X size={24} /></button>
                        </div>
                        <div className="flex-1 bg-black p-4 flex items-center justify-center overflow-hidden">
                            {selectedDoc.toLowerCase().includes('.pdf') ? (
                                <iframe src={selectedDoc} className="w-full h-full rounded-2xl bg-white" title="PDF Viewer" />
                            ) : (
                                <img src={selectedDoc} alt="Evidence" className="max-h-full max-w-full object-contain rounded-xl shadow-2xl" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <header className="mb-16">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter">Identity <span className="text-blue-500">Desk</span></h1>
                </header>

                {pendingRequests.length === 0 ? (
                    <div className="py-40 text-center border border-dashed border-zinc-800 rounded-[60px] bg-zinc-900/5">
                        <ShieldCheck className="mx-auto text-zinc-800 mb-6" size={64} />
                        <h2 className="text-xl font-black uppercase text-zinc-700 tracking-[0.3em]">No Pending Requests</h2>
                    </div>
                ) : (
                    <div className="grid gap-12">
                        {pendingRequests.map((req) => (
                            <div key={req.requestId} className="bg-zinc-950 border border-white/5 rounded-[56px] p-10 md:p-14 shadow-2xl">
                                <div className="flex flex-col xl:flex-row gap-16">
                                    <div className="flex-1 space-y-10">
                                        <span className="bg-blue-600 text-white text-[11px] font-black px-6 py-2 rounded-full uppercase italic">Request: {req.requestId}</span>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-7 bg-zinc-900 rounded-[32px] border border-blue-500/20">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-4 italic">Aadhaar Hash</p>
                                                <p className="text-[11px] font-mono text-white break-all leading-relaxed">{req.displayAadhaar}</p>
                                            </div>
                                            <div className="p-7 bg-blue-600/10 rounded-[32px] border-2 border-blue-500">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase mb-4 italic">Khasra Number</p>
                                                <span className="text-5xl font-black text-white italic tracking-tighter">{req.khasraNo}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-12 border-t border-white/5 pt-10 text-zinc-400 uppercase font-black text-[10px]">
                                            <p>Owner: <span className="text-white">{req.ownerName}</span></p>
                                            <p>Area: <span className="text-white">{req.landArea} SQFT</span></p>
                                        </div>
                                    </div>

                                    <div className="w-full xl:w-80 flex flex-col gap-6">
                                        <div className="grid grid-cols-3 gap-3">
                                            {req.allImages?.map((img, i) => (
                                                <div key={i} onClick={() => setSelectedDoc(img)} className="aspect-square bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-blue-500 transition-all">
                                                    <img src={img} className="w-full h-full object-cover" alt="Property" />
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setSelectedDoc(req.realDoc)} disabled={!req.realDoc} className="w-full bg-zinc-900 hover:bg-blue-600/20 border border-blue-500/30 p-5 rounded-[24px] flex items-center justify-between transition-all">
                                            <div className="flex items-center gap-4">
                                                <FileText className="text-blue-500" size={24} />
                                                <span className="text-[11px] font-black uppercase text-blue-200">Legal Deed PDF</span>
                                            </div>
                                            <ExternalLink size={18} className="text-blue-500" />
                                        </button>
                                    </div>

                                    <div className="w-full xl:w-64 flex flex-col justify-center border-t xl:border-t-0 xl:border-l border-white/10 pt-10 xl:pt-0 xl:pl-10">
                                        <button 
                                            onClick={() => handleVerify(req.originalId)} // ✅ Using BigInt here
                                            disabled={actionLoading === req.requestId}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[12px] py-7 rounded-[32px] uppercase shadow-2xl active:scale-95 disabled:opacity-50"
                                        >
                                            {actionLoading === req.requestId ? "Bonding..." : "Verify & Bond"}
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