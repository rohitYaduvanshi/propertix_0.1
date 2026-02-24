import { useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, UserCheck, FileSearch, AlertCircle, Loader2 } from "lucide-react";

const GovernmentPortal = () => {
    const { walletAddress, isWalletConnected } = useAuth();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchPendingRequests = async () => {
        try {
            if (!window.ethereum) return;
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            
            const allRequests = await contract.getAllRequests();
            // Filter: Sirf wo dikhao jo Status 0 (Pending) hain
            const pending = allRequests.filter(req => Number(req.status) === 0);
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

            // Blockchain call to verify identity and khasra
            const tx = await contract.verifyByGovt(requestId);
            await tx.wait();

            alert("✅ Identity & Khasra Linked Successfully on Blockchain!");
            fetchPendingRequests(); // Refresh list
        } catch (error) {
            alert("Verification Failed: " + (error.reason || error.message));
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40}/></div>;

    return (
        <div className="min-h-screen bg-[#000000] text-white pt-24 pb-12 px-6 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex justify-between items-end border-b border-blue-500/20 pb-8">
                    <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-2 italic">Official_Govt_Node_v3</p>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Identity Verification Desk</h1>
                    </div>
                    <div className="bg-blue-900/10 border border-blue-500/30 px-6 py-3 rounded-2xl">
                        <p className="text-[9px] font-bold text-blue-400 uppercase">Officer Wallet</p>
                        <p className="font-mono text-xs text-white">{walletAddress.slice(0, 15)}...</p>
                    </div>
                </header>

                {pendingRequests.length === 0 ? (
                    <div className="py-32 text-center border-2 border-dashed border-zinc-800 rounded-[40px] bg-zinc-900/10">
                        <ShieldCheck className="mx-auto text-zinc-800 mb-4" size={50} />
                        <h2 className="text-xl font-black uppercase text-zinc-600 tracking-widest">No Pending Identities to Link</h2>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="bg-zinc-950 border border-white/5 p-8 rounded-[35px] flex flex-col md:flex-row justify-between items-center hover:border-blue-500/30 transition-all group">
                                <div className="space-y-4 w-full md:w-2/3">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase italic">Request #{req.id.toString()}</span>
                                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Awaiting Identity Bond</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Citizen Aadhaar / PAN Hash</p>
                                            <p className="text-xs font-mono text-white break-all">{req.identityRefId}</p>
                                        </div>
                                        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Official Khasra Number</p>
                                            <p className="text-sm font-black text-white italic tracking-widest">{req.khasraNumber}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase">
                                        <span className="flex items-center gap-1"><UserCheck size={12}/> Owner: {req.ownerName}</span>
                                        <span className="flex items-center gap-1"><FileSearch size={12}/> Area: {req.landArea} SQFT</span>
                                    </div>
                                </div>

                                <div className="mt-6 md:mt-0 flex gap-4">
                                    <button className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 transition-all">Reject</button>
                                    <button 
                                        onClick={() => handleVerify(req.id)}
                                        disabled={actionLoading === req.id}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-10 py-5 rounded-2xl uppercase tracking-[0.2em] shadow-2xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {actionLoading === req.id ? "Processing..." : "Verify & Link Identity"}
                                    </button>
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