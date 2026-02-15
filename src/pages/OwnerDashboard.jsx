import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { Link } from "react-router-dom"; 
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig"; 
import { useAuth } from "../context/AuthContext";
import * as htmlToImage from "html-to-image"; 
import nftTemplate from "../assets/NFT_Ownership_certificate.png";

// 🔥 LEASE TIMER COMPONENT
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
        <div className={`mt-4 p-3 rounded-xl border flex flex-col gap-1 ${
            isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/50' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50'
        }`}>
            <div className="flex items-center gap-2 font-bold text-[10px]">
                <span>{isOverdue ? '⚠️' : '⏳'} {timeLeft}</span>
            </div>
            {userRole === "OWNER" && <span className="text-[9px] opacity-60 truncate">Tenant: {tenant}</span>}
        </div>
    );
};

const OwnerDashboard = () => {
    const [myProperties, setMyProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal States
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
                let meta = { name: "Record", image: null, attributes: [] };
                if (item.ipfsMetadata && item.ipfsMetadata.startsWith("http")) {
                    try {
                        const response = await fetch(item.ipfsMetadata);
                        if (response.ok) meta = await response.json();
                    } catch (err) { console.warn("Meta error ID:", item.id); }
                }

                const getAttr = (key) => meta.attributes?.find(a => a.trait_type === key)?.value || "N/A";
                const isOwner = item.requester.toLowerCase() === walletAddress.toLowerCase();

                return {
                    id: Number(item.id),
                    name: item.ownerName || meta.name, 
                    address: getAttr("Address") !== "N/A" ? getAttr("Address") : item.propertyAddress,
                    area: getAttr("Area"),
                    status: Number(item.status),
                    saleStatus: Number(item.saleStatus),
                    salePrice: item.price ? formatEther(item.price) : "0",
                    leasePrice: item.leasePrice ? formatEther(item.leasePrice) : "0",
                    leaseEnd: Number(item.leaseEndTime) * 1000,
                    tenant: item.tenant,
                    ipfsLink: item.ipfsMetadata,
                    identityHash: item.identityHash, 
                    displayImage: meta.image,
                    date: new Date(Number(item.requestTime) * 1000).toLocaleDateString('en-IN'),
                    userRole: isOwner ? "OWNER" : "TENANT" 
                };
            }));

            setMyProperties(formatted.reverse());
            setLoading(false);
        } catch (error) {
            console.error("Dashboard Sync Error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isWalletConnected) loadMyProperties();
    }, [isWalletConnected, walletAddress]);

    // --- ACTIONS ---
    const openActionModal = (id, type) => {
        if (type === "PRIVATE") {
            if (window.confirm("Make this property private?")) executeAction(id, "PRIVATE");
            return;
        }
        setSelectedPropertyId(id);
        setModalType(type);
        setInputPrice("");
        setLeaseTimeVal("");
        setShowModal(true);
    };

    const executeAction = async (id = selectedPropertyId, type = modalType) => {
        try {
            setActionLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

            let tx;
            if (type === "SALE") tx = await contract.listPropertyForSale(id, parseEther(inputPrice));
            else if (type === "LEASE") {
                let duration = leaseTimeUnit === "days" ? parseInt(leaseTimeVal) * 86400 : parseInt(leaseTimeVal) * 2592000;
                tx = await contract.listPropertyForLease(id, parseEther(inputPrice), duration);
            } else if (type === "PRIVATE") tx = await contract.makePropertyPrivate(id);

            await tx.wait();
            setShowModal(false);
            loadMyProperties();
        } catch (error) { alert("Blockchain Error: " + error.message); }
        setActionLoading(false);
    };

    const downloadNFTCard = async (elementId, propertyName) => {
        try {
            const input = document.getElementById(elementId);
            const dataUrl = await htmlToImage.toPng(input, { quality: 1, pixelRatio: 2 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `${propertyName}_Deed.png`;
            link.click();
        } catch (error) { console.error(error); }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-500 font-black animate-pulse">SYNCING VAULT...</div>;

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-cyan-400 uppercase tracking-tighter">My Property Vault</h1>
                        <p className="text-gray-500 text-xs mt-1">Blockchain Land Ledger & Verification System.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myProperties.map((prop) => (
                        <div key={prop.id} className="bg-zinc-900/40 border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl transition-all hover:border-cyan-500/20">
                            
                            {/* Property Preview Header */}
                            <div className="h-44 bg-zinc-800 relative">
                                {prop.displayImage ? (
                                    <img src={prop.displayImage} className="w-full h-full object-cover opacity-50" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏡</div>
                                )}
                                <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full text-[10px] font-bold text-cyan-400 border border-white/10">ID: #{prop.id}</div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold mb-1 truncate">{prop.name}</h3>
                                <p className="text-gray-500 text-[10px] mb-5 uppercase tracking-widest font-black truncate">📍 {prop.address}</p>

                                {/* 🔍 REGISTRY PROOFS SECTION (Trunacted) */}
                                <div className="mb-6 space-y-2 p-3 bg-black/40 rounded-2xl border border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-zinc-500 font-black uppercase mb-1">IPFS Digital Certificate</span>
                                        <a href={prop.ipfsLink} target="_blank" rel="noreferrer" className="text-[9px] text-emerald-400 truncate hover:underline font-mono">{prop.ipfsLink}</a>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[7px] text-zinc-500 font-black uppercase mb-1">Blockchain Identity Hash</span>
                                        <span className="text-[9px] text-zinc-400 font-mono truncate">{prop.identityHash}</span>
                                    </div>
                                </div>

                                {prop.status === 2 ? (
                                    <div className="flex-1">
                                        {/* 📜 NFT CERTIFICATE OVERLAY */}
                                        <div id={`nft-card-${prop.id}`} className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-yellow-500/20 scale-95 origin-top">
                                            <img src={nftTemplate} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 z-10 p-4">
                                                <div className="absolute top-[28.5%] left-[22%] text-[10px] md:text-xs font-bold text-white truncate w-[50%]">{prop.name}</div>
                                                <div className="absolute top-[32%] right-[12%] text-[9px] font-black tracking-widest text-black w-[20%] text-center">{prop.id}</div>
                                                <div className="absolute top-[38.5%] left-[10%] text-[8px] md:text-[9px] text-white w-[70%] leading-tight">{prop.address}</div>
                                                <div className="absolute top-[47%] left-[32%] text-[9px] text-white">{prop.area} sq.ft</div>
                                                <div className="absolute top-[60%] left-[8%] text-[7px] font-mono text-cyan-400 break-all w-[84%] bg-black/50 p-1 rounded leading-tight">{walletAddress}</div>
                                                <div className="absolute bottom-[4%] left-[8%] text-[8px] font-bold text-white bg-red-600 px-2 rounded tracking-widest uppercase">ISSUED: {prop.date}</div>
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => downloadNFTCard(`nft-card-${prop.id}`, prop.name)} className="w-full mt-2 py-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl text-[10px] font-black text-yellow-500 transition-all uppercase tracking-widest">
                                            ⬇ Download Official NFT Deed
                                        </button>

                                        {/* ⏳ LEASE TIMER */}
                                        {prop.saleStatus === 3 && <LeaseTimer leaseEnd={prop.leaseEnd} tenant={prop.tenant} userRole={prop.userRole} />}

                                        {/* 🛠️ OWNER CONTROLS */}
                                        {prop.userRole === "OWNER" && (
                                            <div className="mt-5 flex gap-2 border-t border-white/5 pt-5">
                                                {prop.saleStatus === 0 ? (
                                                    <>
                                                        <button onClick={() => openActionModal(prop.id, "SALE")} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] rounded-xl transition-all shadow-lg">SELL</button>
                                                        <button onClick={() => openActionModal(prop.id, "LEASE")} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] rounded-xl transition-all shadow-lg">LEASE</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => openActionModal(prop.id, "PRIVATE")} className="w-full py-3 bg-zinc-800 text-red-500 font-black text-[10px] border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all">
                                                        {prop.saleStatus === 3 ? "🔒 EVICT & RECLAIM" : "🔒 MAKE PRIVATE / UNLIST"}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center bg-zinc-800/10 rounded-3xl border border-dashed border-zinc-800/50">
                                        <div className="text-3xl mb-3">🛡️</div>
                                        <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Official Verification Pending</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🛠️ ACTION MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-[40px] w-full max-w-sm p-8 shadow-3xl">
                        <h3 className="text-2xl font-black text-white mb-2">{modalType === "SALE" ? "List for Sale 🏷️" : "List for Lease 📝"}</h3>
                        <p className="text-gray-500 text-xs mb-6">Enter your terms to update the blockchain ledger.</p>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Price / Rent (ETH)</label>
                                <input type="number" value={inputPrice} onChange={(e) => setInputPrice(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm outline-none focus:border-cyan-500 transition-all" placeholder="e.g. 0.05" />
                            </div>
                            {modalType === "LEASE" && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">Duration</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={leaseTimeVal} onChange={(e) => setLeaseTimeVal(e.target.value)} className="w-2/3 bg-black border border-zinc-800 rounded-2xl p-4 text-sm outline-none" placeholder="e.g. 6" />
                                        <select value={leaseTimeUnit} onChange={(e) => setLeaseTimeUnit(e.target.value)} className="w-1/3 bg-zinc-800 border border-zinc-800 rounded-2xl p-2 text-[10px] font-black outline-none cursor-pointer">
                                            <option value="months">Months</option>
                                            <option value="days">Days</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-10">
                            <button onClick={() => setShowModal(false)} className="py-4 rounded-2xl bg-zinc-800 text-white font-bold text-[11px] uppercase tracking-widest transition-all">Cancel</button>
                            <button onClick={() => executeAction()} disabled={actionLoading} className="py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[11px] uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all">
                                {actionLoading ? "SYNCING..." : "CONFIRM"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;