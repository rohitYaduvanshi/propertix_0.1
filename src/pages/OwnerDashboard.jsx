import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { Link } from "react-router-dom"; 
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig"; 
import { useAuth } from "../context/AuthContext";
import * as htmlToImage from "html-to-image"; 
import nftTemplate from "../assets/NFT_Ownership_certificate.png";

// 🔥 LEASE TIMER COMPONENT (Wahi rahega)
const LeaseTimer = ({ leaseEnd, tenant, userRole }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isOverdue, setIsOverdue] = useState(false);
    const [overdueDays, setOverdueDays] = useState(0);

    useEffect(() => {
        const calculateTime = () => {
            const now = Date.now();
            if (now > leaseEnd) {
                setIsOverdue(true);
                const daysLate = Math.ceil((now - leaseEnd) / (1000 * 60 * 60 * 24));
                setOverdueDays(daysLate);
                setTimeLeft(`Overstayed by ${daysLate} Day(s)`);
            } else {
                setIsOverdue(false);
                const diff = leaseEnd - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
                const mins = Math.floor((diff / (1000 * 60)) % 60);
                setTimeLeft(`${days}d ${hours}h ${mins}m remaining`);
            }
        };
        calculateTime();
        const interval = setInterval(calculateTime, 60000); 
        return () => clearInterval(interval);
    }, [leaseEnd]);

    return (
        <div className="mt-4 p-3 rounded-xl border bg-black/40 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1 tracking-wider">
                {userRole === "TENANT" ? "Your Lease Status" : "Tenant Wallet"}
            </p>
            {userRole === "OWNER" && (
                <p className="text-xs text-indigo-400 font-mono mb-3">{tenant.slice(0,8)}...{tenant.slice(-6)}</p>
            )}
            <div className={`px-3 py-2 rounded-lg text-xs font-bold border flex flex-col gap-1 ${
                isOverdue ? 'bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50'
            }`}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{isOverdue ? '⚠️' : '⏳'}</span>
                    <span>{timeLeft}</span>
                </div>
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
                let meta = { name: "Unnamed Property", image: null, attributes: [] };
                if (item.ipfsMetadata && item.ipfsMetadata.startsWith("http")) {
                    try {
                        const response = await fetch(item.ipfsMetadata);
                        const json = await response.json();
                        meta = { ...meta, ...json };
                    } catch (err) { console.warn("IPFS Error", err); }
                }

                const getAttr = (key) => meta.attributes?.find(a => a.trait_type === key)?.value || "N/A";
                const isOwner = item.requester.toLowerCase() === walletAddress.toLowerCase();

                return {
                    id: Number(item.id),
                    name: item.ownerName || meta.name, 
                    address: getAttr("Address"),
                    status: Number(item.status),
                    saleStatus: Number(item.saleStatus),
                    salePrice: item.price ? formatEther(item.price) : "0",
                    leasePrice: item.leasePrice ? formatEther(item.leasePrice) : "0",
                    leaseEnd: Number(item.leaseEndTime) * 1000,
                    tenant: item.tenant,
                    area: getAttr("Area"),
                    // ✨ IPFS LINK ADDED HERE
                    ipfsLink: item.ipfsMetadata,
                    // ✨ Tx HASH logic: Hardhat mein events se milta hai, filhal hum placeholder ya item attributes use kar sakte hain
                    txHash: item.identityHash || "N/A", 
                    displayImage: meta.image,
                    date: new Date(Number(item.requestTime) * 1000).toLocaleDateString(),
                    userRole: isOwner ? "OWNER" : "TENANT" 
                };
            }));

            setMyProperties(formatted.reverse());
            setLoading(false);
        } catch (error) {
            console.error("Loading Error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isWalletConnected) loadMyProperties();
    }, [isWalletConnected, walletAddress]);

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
            }
            else if (type === "PRIVATE") tx = await contract.makePropertyPrivate(id);
            await tx.wait();
            setShowModal(false);
            loadMyProperties();
        } catch (error) { alert("Error: " + error.message); }
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

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">Loading Dashboard...</div>;

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 flex justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-cyan-400">Owner Dashboard</h1>
                        <p className="text-gray-400">Manage your assets, IPFS links, and Blockchain proofs.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myProperties.map((prop) => (
                        <div key={prop.id} className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                            {/* Property Image */}
                            <div className="h-40 bg-zinc-800 relative">
                                {prop.displayImage && <img src={prop.displayImage} className="w-full h-full object-cover opacity-60" alt="" />}
                                <div className="absolute top-3 left-3 bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded">
                                    ID: #{prop.id}
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold mb-1 truncate">{prop.name}</h3>
                                <p className="text-gray-500 text-xs mb-4">📍 {prop.address}</p>

                                {/* ✨ NEW: REGISTRY PROOFS SECTION (CHOTA HASH & LINK) */}
                                <div className="mb-5 space-y-2 p-3 bg-black/40 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Digital Asset</span>
                                        <a href={prop.ipfsLink} target="_blank" rel="noreferrer" className="text-[9px] text-cyan-400 hover:underline">VIEW IPFS</a>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Identity Hash</span>
                                        {/* Chota Hash logic */}
                                        <span className="text-[9px] font-mono text-zinc-400">
                                            {prop.txHash.slice(0, 10)}...{prop.txHash.slice(-8)}
                                        </span>
                                    </div>
                                </div>

                                {prop.status === 2 ? (
                                    <div className="flex-1 flex flex-col">
                                        <div id={`nft-card-${prop.id}`} className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border border-yellow-500/20 scale-90 origin-top">
                                            <img src={nftTemplate} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                            <div className="absolute inset-0 z-10 text-white p-4">
                                                <div className="absolute top-[28%] left-[22%] text-xs font-bold">{prop.name}</div>
                                                <div className="absolute top-[38%] left-[10%] text-[10px] w-[70%]">{prop.address}</div>
                                                <div className="absolute top-[60%] left-[8%] text-[8px] font-mono opacity-60">{walletAddress}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => downloadNFTCard(`nft-card-${prop.id}`, prop.name)} className="mt-2 text-[10px] font-bold text-yellow-500 text-center uppercase tracking-tighter hover:text-white transition">
                                            ⬇ Download Official Deed
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center bg-zinc-800/20 rounded-2xl border border-dashed border-zinc-700">
                                        <p className="text-yellow-500 text-xs font-bold animate-pulse">Verification in Progress...</p>
                                    </div>
                                )}

                                {/* Owner Actions */}
                                {prop.userRole === "OWNER" && prop.status === 2 && (
                                    <div className="mt-6 flex gap-2">
                                        {prop.saleStatus === 0 ? (
                                            <>
                                                <button onClick={() => openActionModal(prop.id, "SALE")} className="flex-1 py-2 bg-emerald-600 text-[11px] font-bold rounded-lg">SELL</button>
                                                <button onClick={() => openActionModal(prop.id, "LEASE")} className="flex-1 py-2 bg-indigo-600 text-[11px] font-bold rounded-lg">LEASE</button>
                                            </>
                                        ) : (
                                            <button onClick={() => openActionModal(prop.id, "PRIVATE")} className="w-full py-2 bg-zinc-800 text-red-400 text-[11px] font-bold rounded-lg border border-red-500/20">MAKE PRIVATE</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;