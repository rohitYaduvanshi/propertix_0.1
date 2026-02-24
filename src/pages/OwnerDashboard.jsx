import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { Link } from "react-router-dom";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import * as htmlToImage from "html-to-image";
import nftTemplate from "../assets/NFT_Ownership_certificate.png";
import { ShieldCheck, Clock, CheckCircle2, XCircle, Download, MapPin, Tag, Key, Loader2 } from "lucide-react";

// --- LEASE TIMER COMPONENT ---
const LeaseTimer = ({ leaseEnd, tenant, userRole }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = Date.now();
            if (now > leaseEnd) {
                setIsOverdue(true);
                const daysLate = Math.ceil((now - leaseEnd) / (1000 * 60 * 60 * 24));
                setTimeLeft(`Overstayed by ${daysLate} Day(s)`);
            } else {
                setIsOverdue(false);
                const diff = leaseEnd - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                setTimeLeft(`${days}d ${hours}h remaining`);
            }
        };
        calculateTime();
        const interval = setInterval(calculateTime, 60000);
        return () => clearInterval(interval);
    }, [leaseEnd]);

    return (
        <div className="mt-4 p-4 rounded-2xl border bg-black/40 backdrop-blur-md relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${isOverdue ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2">Lease Intelligence</p>
            <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold ${isOverdue ? 'text-red-400' : 'text-cyan-400'}`}>{timeLeft}</span>
                {isOverdue && <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">PENALTY ACTIVE</span>}
            </div>
        </div>
    );
};

const OwnerDashboard = () => {
    const [myProperties, setMyProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [inputPrice, setInputPrice] = useState("");
    const [leaseTimeVal, setLeaseTimeVal] = useState("");
    const [leaseTimeUnit, setLeaseTimeUnit] = useState("months");
    const { walletAddress, isWalletConnected } = useAuth();

    const loadMyProperties = async () => {
        try {
            if (!isWalletConnected || !walletAddress) return;
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            const data = await contract.getAllRequests();
            const currentTimestamp = Math.floor(Date.now() / 1000);

            const filtered = data.filter((item) => {
                const isOwner = item.requester.toLowerCase() === walletAddress.toLowerCase();
                const isTenant = item.tenant.toLowerCase() === walletAddress.toLowerCase() && Number(item.leaseEndTime) > currentTimestamp;
                return isOwner || isTenant;
            });

            const formatted = await Promise.all(filtered.map(async (item) => {
                let meta = { attributes: [] };
                try {
                    const response = await fetch(item.ipfsMetadata);
                    meta = await response.json();
                } catch (err) { console.warn("IPFS Fetch Failed"); }

                return {
                    id: Number(item.id),
                    name: item.ownerName,
                    address: item.landLocation,
                    khasra: item.khasraNumber, 
                    status: Number(item.status), // 0:Pending, 1:Govt, 2:Surveyed, 3:Approved
                    saleStatus: Number(item.saleStatus),
                    salePrice: formatEther(item.price || 0),
                    leasePrice: formatEther(item.leasePrice || 0),
                    leaseEnd: Number(item.leaseEndTime) * 1000,
                    tenant: item.tenant,
                    area: item.landArea,
                    displayImage: meta.image,
                    date: new Date(Number(item.requestTime) * 1000).toLocaleDateString('en-IN'),
                    userRole: item.requester.toLowerCase() === walletAddress.toLowerCase() ? "OWNER" : "TENANT"
                };
            }));
            setMyProperties(formatted.reverse());
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (isWalletConnected) loadMyProperties(); }, [isWalletConnected, walletAddress]);

    const executeAction = async (id = selectedPropertyId, type = modalType) => {
        try {
            setActionLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);
            
            let tx;
            if (type === "SALE") tx = await contract.listPropertyForSale(id, parseEther(inputPrice));
            else if (type === "LEASE") {
                let dur = leaseTimeUnit === "days" ? parseInt(leaseTimeVal)*86400 : parseInt(leaseTimeVal)*2592000;
                tx = await contract.listPropertyForLease(id, parseEther(inputPrice), dur);
            }
            else if (type === "PRIVATE") tx = await contract.makePropertyPrivate(id);

            await tx.wait();
            alert("Protocol Updated!");
            setShowModal(false);
            loadMyProperties();
        } catch (error) { alert("Failed: " + (error.reason || error.message)); }
        finally { setActionLoading(false); }
    };

    const downloadNFTCard = async (elementId, propertyName) => {
        const input = document.getElementById(elementId);
        if(!input) return;
        const dataUrl = await htmlToImage.toPng(input, { pixelRatio: 2 });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${propertyName}_Deed.png`;
        link.click();
    };

    const getStatusInfo = (status) => {
        const mapping = [
            { label: "Phase 1: Govt Review", color: "text-amber-500", bg: "bg-amber-500/10", icon: <Clock size={12}/> },
            { label: "Phase 2: Surveyor Assigned", color: "text-blue-400", bg: "bg-blue-500/10", icon: <ShieldCheck size={12}/> },
            { label: "Phase 3: Final Minting", color: "text-purple-400", bg: "bg-purple-500/10", icon: <MapPin size={12}/> },
            { label: "On-Chain Verified", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle2 size={12}/> },
            { label: "Rejected", color: "text-red-500", bg: "bg-red-500/10", icon: <XCircle size={12}/> }
        ];
        return mapping[status] || mapping[0];
    };

    const openActionModal = (id, type) => {
        if (type === "PRIVATE") {
            if (window.confirm("Unlist this property from market?")) executeAction(id, type);
            return;
        }
        setSelectedPropertyId(id);
        setModalType(type);
        setInputPrice("");
        setLeaseTimeVal("");
        setShowModal(true);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" size={40}/></div>;

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-16 flex justify-between items-end border-b border-white/5 pb-10">
                    <div>
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.5em] italic mb-2">Authenticated_Ledger_v3</p>
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter">My Assets</h1>
                    </div>
                    <div className="bg-zinc-900 border border-white/10 px-6 py-3 rounded-2xl font-mono text-xs text-zinc-500 tracking-widest">
                        SIGNER: {walletAddress.slice(0, 12)}...
                    </div>
                </header>

                {myProperties.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-zinc-800 rounded-[50px] bg-zinc-900/10">
                        <h2 className="text-xl font-black uppercase text-zinc-600 tracking-widest">No Digital Deeds Detected</h2>
                        <Link to="/register-asset" className="mt-6 inline-block bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 transition-all">Register New Land</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {myProperties.map((prop) => {
                            const statusInfo = getStatusInfo(prop.status);
                            return (
                                <div key={prop.id} className={`group bg-[#0a0a0a] border ${prop.status === 3 ? 'border-white/10' : 'border-cyan-500/20'} rounded-[40px] p-2 transition-all hover:translate-y-[-5px]`}>
                                    <div className="relative h-64 rounded-[35px] overflow-hidden mb-6">
                                        <img src={prop.displayImage || "https://images.unsplash.com/photo-1500382017468-9049fed747ef"} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="property" />
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md ${statusInfo.bg} ${statusInfo.color}`}>
                                                {statusInfo.icon} {statusInfo.label}
                                            </span>
                                            {prop.saleStatus === 1 && <span className="bg-emerald-500 text-black px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest italic shadow-xl">Selling @ {prop.salePrice} ETH</span>}
                                        </div>
                                    </div>

                                    <div className="px-6 pb-8 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white truncate">{prop.name}</h3>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase mt-1 flex items-center gap-1 truncate"><MapPin size={10}/> {prop.address}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-zinc-900/50 p-3 rounded-2xl border border-white/5 text-center">
                                                <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Khasra</p>
                                                <p className="text-xs font-mono font-bold text-cyan-500">{prop.khasra}</p>
                                            </div>
                                            <div className="bg-zinc-900/50 p-3 rounded-2xl border border-white/5 text-center">
                                                <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">Area</p>
                                                <p className="text-xs font-bold text-white">{prop.area} SQFT</p>
                                            </div>
                                        </div>

                                        {prop.status !== 3 ? (
                                            <div className="py-4 px-6 bg-zinc-900/50 border border-white/5 rounded-3xl text-center">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verification in Progress</p>
                                                <div className="mt-2 flex justify-center gap-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${prop.status >= 0 ? 'bg-amber-500' : 'bg-zinc-800'}`}></div>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${prop.status >= 1 ? 'bg-blue-400' : 'bg-zinc-800'}`}></div>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${prop.status >= 2 ? 'bg-purple-400' : 'bg-zinc-800'}`}></div>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${prop.status >= 3 ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Hidden Deed for HTML-to-Image */}
                                                <div className="hidden">
                                                    <div id={`nft-card-${prop.id}`} className="relative w-[600px] h-[750px] bg-black">
                                                        <img src={nftTemplate} className="w-full h-full" alt="template" />
                                                        <div className="absolute top-[28%] left-[22%] text-2xl text-white font-bold">{prop.name}</div>
                                                        <div className="absolute top-[32%] right-[14%] text-xl text-black font-black">{prop.id}</div>
                                                        <div className="absolute top-[38%] left-[10%] text-lg text-white">{prop.address}</div>
                                                        <div className="absolute top-[47%] left-[32%] text-lg text-white">{prop.area} sq.ft</div>
                                                        <div className="absolute top-[61%] left-[8%] text-[12px] text-cyan-400 font-mono break-all w-[80%]">{walletAddress}</div>
                                                        <div className="absolute bottom-[4%] left-[8%] text-sm text-white font-bold tracking-widest uppercase bg-red-600 px-3 py-1">ISSUED_ON: {prop.date}</div>
                                                    </div>
                                                </div>

                                                <button onClick={() => downloadNFTCard(`nft-card-${prop.id}`, prop.name)} className="w-full py-4 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl flex items-center justify-center gap-3 group hover:bg-emerald-500 transition-all">
                                                    <Download size={14} className="text-emerald-500 group-hover:text-black"/>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:text-black">Download Verified Deed</span>
                                                </button>

                                                <div className="flex gap-3">
                                                    {prop.saleStatus === 0 ? (
                                                        <>
                                                            <button onClick={() => openActionModal(prop.id, "SALE")} className="flex-1 py-4 bg-white text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all">List Sale</button>
                                                            <button onClick={() => openActionModal(prop.id, "LEASE")} className="flex-1 py-4 bg-zinc-900 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-cyan-500 transition-all">List Lease</button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => openActionModal(prop.id, "PRIVATE")} className="w-full py-4 bg-red-900/10 border border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">🔒 Unlist from Market</button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {prop.saleStatus === 3 && <LeaseTimer leaseEnd={prop.leaseEnd} tenant={prop.tenant} userRole={prop.userRole}/>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Logic */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[50px] w-full max-w-md p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{modalType === "SALE" ? "Market Setup" : "Lease Terms"}</h3>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-10">Sign on the blockchain to authorize</p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Pricing (ETH)</label>
                                <input type="number" value={inputPrice} onChange={(e) => setInputPrice(e.target.value)} className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none font-bold" placeholder="0.05" />
                            </div>
                            {modalType === "LEASE" && (
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Duration</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={leaseTimeVal} onChange={(e) => setLeaseTimeVal(e.target.value)} className="w-2/3 bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 text-white focus:border-cyan-500 outline-none font-bold" placeholder="6" />
                                        <select value={leaseTimeUnit} onChange={(e) => setLeaseTimeUnit(e.target.value)} className="w-1/3 bg-zinc-900 border border-white/5 rounded-2xl px-4 text-[10px] font-black uppercase text-zinc-400 outline-none">
                                            <option value="months">Months</option>
                                            <option value="days">Days</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-12">
                            <button onClick={() => setShowModal(false)} className="py-4 rounded-2xl bg-zinc-800 text-[9px] font-black uppercase tracking-widest">Cancel</button>
                            <button onClick={() => executeAction()} disabled={actionLoading} className="py-4 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500 shadow-xl disabled:opacity-30">
                                {actionLoading ? "Signing..." : "Confirm Protocol"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;