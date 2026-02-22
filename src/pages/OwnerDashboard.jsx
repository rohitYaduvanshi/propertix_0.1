import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { Link } from "react-router-dom";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import * as htmlToImage from "html-to-image";
import nftTemplate from "../assets/NFT_Ownership_certificate.png";



// LEASE TIMER COMPONENT

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
                isOverdue
                ? 'bg-red-500/10 text-red-400 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50'
            }`}>
                <div className="flex items-center gap-2">
                    <span className="text-lg">{isOverdue ? '⚠️' : '⏳'}</span>
                    <span>{timeLeft}</span>
                </div>
                {isOverdue && (
                    <span className="text-[9px] text-red-300 bg-red-500/20 px-2 py-1 rounded w-fit mt-1">
                        🚨 PENALTY ACTIVE: +10% Rent Charge / Day
                    </span>
                )}
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

    // --- FETCH DATA ---
    const loadMyProperties = async () => {
        try {
            if (!isWalletConnected || !walletAddress) return;
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);
            const data = await contract.getAllRequests();
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Filter property if user is OWNER or ACTIVE TENANT
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
                    } catch (err) { console.warn("Error fetching IPFS", err); }
                }
                let currentOwnerName = item.ownerName || meta.name;
                if (!item.ownerName) {
                    try {
                        const userProfile = await contract.users(item.requester);
                        if (userProfile && userProfile[0]) currentOwnerName = userProfile[0];
                        else if (userProfile && userProfile.name) currentOwnerName = userProfile.name;
                    } catch (err) {}
                }

                const getAttr = (key) => meta.attributes?.find(a => a.trait_type === key)?.value || "N/A";
                let safePrice = "0"; if (item.price) try { safePrice = formatEther(item.price); } catch (e) {}
                let safeLeasePrice = "0"; if (item.leasePrice) try { safeLeasePrice = formatEther(item.leasePrice); } catch (e) {}
                const isOwner = item.requester.toLowerCase() === walletAddress.toLowerCase();
                const registrationDate = new Date(Number(item.requestTime) * 1000).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                });
                return {
                    id: Number(item.id),
                    name: currentOwnerName,
                    address: getAttr("Address"),
                    type: getAttr("Type"),
                    status: Number(item.status),
                    saleStatus: Number(item.saleStatus),
                    salePrice: safePrice,
                    leasePrice: safeLeasePrice,
                    leaseEnd: Number(item.leaseEndTime) * 1000,
                    tenant: item.tenant,
                    area: getAttr("Area"),
                    ipfsHash: item.ipfsMetadata,
                    displayImage: meta.image,
                    date: registrationDate,
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

    // --- ACTIONS ---
    const openActionModal = (id, type) => {
        if (type === "PRIVATE") {
            if (window.confirm("Are you sure you want to Unlist this property?")) executeAction(id, type);
            return;
        }
        setSelectedPropertyId(id);
        setModalType(type);
        setInputPrice("");
        setLeaseTimeVal("");
        setLeaseTimeUnit("months");
        setShowModal(true);

    };



    const executeAction = async (id = selectedPropertyId, type = modalType) => {
        try {
            setActionLoading(true);
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);
            let tx;
            if (type === "SALE") {
                if (!inputPrice || isNaN(inputPrice)) { alert("Enter valid ETH price"); setActionLoading(false); return; }
                tx = await contract.listPropertyForSale(id, parseEther(inputPrice));
            }
            else if (type === "LEASE") {
                if (!inputPrice || isNaN(inputPrice)) { alert("Enter valid Rent Budget"); setActionLoading(false); return; }
                if (!leaseTimeVal || isNaN(leaseTimeVal)) { alert("Enter valid Duration"); setActionLoading(false); return; }
                let durationInSeconds = leaseTimeUnit === "days"
                    ? parseInt(leaseTimeVal) * 24 * 60 * 60
                    : parseInt(leaseTimeVal) * 30 * 24 * 60 * 60;
                tx = await contract.listPropertyForLease(id, parseEther(inputPrice), durationInSeconds);
            }
            else if (type === "PRIVATE") {
                tx = await contract.makePropertyPrivate(id);
            }
            await tx.wait();
            alert("✅ Success! Status updated.");
            setShowModal(false);
            loadMyProperties();
        } catch (error) {
            console.error(error);
            alert("❌ Failed: " + (error.reason || error.message));
        }
        setActionLoading(false);
    };



    // --- DOWNLOAD DEED ---

    const downloadNFTCard = async (elementId, propertyName) => {
        try {
            const input = document.getElementById(elementId);
            if(!input) return;
            document.body.style.cursor = "wait";
            const dataUrl = await htmlToImage.toPng(input, { quality: 1, pixelRatio: 2, useCORS: true });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `${propertyName.replace(/\s+/g, '_')}_NFT_Deed.png`;
            link.click();
        } catch (error) {
            console.error("Download Error:", error);
            alert("Failed to download image.");
        } finally {
            document.body.style.cursor = "default";
        }

    };

    const getStatusLabel = (status) => ["⏳ Pending", "📝 Surveyed", "✅ Verified", "❌ Rejected"][status] || "Unknown";
    const getStatusColor = (status) => ["bg-yellow-500", "bg-blue-500", "bg-emerald-500", "bg-red-500"][status] || "bg-gray-500";
    if (!isWalletConnected) return <div className="min-h-screen bg-black text-white flex justify-center items-center"><h2>Connect Wallet</h2></div>;
    if (loading) return <div className="min-h-screen bg-black text-white flex justify-center items-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;
    return (
        <div className="min-h-screen bg-black text-white pt-8 pb-12 px-4 relative">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-10 pb-6 border-b border-white/10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold text-cyan-400 mb-2">My Assets Dashboard</h1>
                        <p className="text-gray-400">Manage your owned properties and active leases.</p>
                    </div>
                    <div className="bg-zinc-900 px-4 py-2 rounded-lg font-mono text-cyan-400 text-sm border border-zinc-700">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                </div>
                {myProperties.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-700">
                        <h3 className="text-2xl font-bold mb-2">No Properties Found</h3>
                        <p className="text-gray-400 mb-4">You don't own or lease any properties yet.</p>
                        <Link to="/blockchain" className="text-cyan-400 hover:underline">Register New Property</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myProperties.map((prop) => (
                            <div key={prop.id} className={`bg-zinc-900 border rounded-3xl overflow-hidden flex flex-col relative shadow-2xl transition-all ${
                                prop.userRole === "TENANT" ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' :
                                prop.saleStatus === 1 ? 'border-green-500/50' :
                                prop.saleStatus === 2 ? 'border-indigo-500/50' :
                                prop.saleStatus === 3 ? 'border-rose-500/50' : 'border-white/5'
                            }`}>

                                {/* --- PROPERTY IMAGE --- */}

                                <div className="h-48 bg-zinc-800 relative shrink-0">
                                    {prop.displayImage ? (
                                        <img src={prop.displayImage} alt={prop.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-4xl">🏠</div>
                                    )}
                                
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">

                                        {/* TENANT BADGE */}

                                        {prop.userRole === "TENANT" ? (

                                            <div className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-purple-600 text-white shadow-lg w-fit">

                                                🔑 RENTED BY YOU

                                            </div>

                                        ) : (

                                            <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase text-white shadow-lg w-fit ${getStatusColor(prop.status)}`}>

                                                {getStatusLabel(prop.status)}

                                            </div>

                                        )}

                                       

                                        {/* SALE / LEASE BADGES (Only for Owner to see status) */}

                                        {prop.userRole === "OWNER" && prop.saleStatus === 1 && <div className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-green-500 text-white shadow-lg w-fit">🏷️ Listed For Sale ({prop.salePrice} ETH)</div>}

                                        {prop.userRole === "OWNER" && prop.saleStatus === 2 && <div className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-indigo-500 text-white shadow-lg w-fit">📝 Listed For Lease ({prop.leasePrice} ETH/mo)</div>}

                                    </div>

                                </div>



                                {/* --- DETAILS SECTION --- */}

                                <div className="p-6 flex-1 flex flex-col">

                                    <h3 className="text-xl font-bold text-white mb-1 truncate">{prop.name}</h3>

                                    <p className="text-gray-400 text-sm mb-4 truncate">📍 {prop.address}</p>



                                    {/*UNVERIFIED VIEW (Pending) */}

                                    {prop.status !== 2 ? (

                                        <div className="mb-6 flex-1 flex flex-col items-center justify-center p-6 bg-zinc-800/30 border border-white/5 rounded-xl relative overflow-hidden">

                                            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-pulse">

                                                <span className="text-3xl">⏳</span>

                                            </div>

                                            <h4 className="text-yellow-500 font-bold text-lg mb-2 tracking-wide text-center">Verification Pending</h4>

                                            <p className="text-gray-400 text-xs text-center leading-relaxed">

                                                Your property documents are currently being reviewed by surveyors.

                                            </p>

                                        </div>

                                    ) : (

                                        <>

                                            {/* VERIFIED OWNER VIEW: Show NFT Deed & Controls */}

                                            {prop.userRole === "OWNER" && (

                                                <div className="mb-6 flex flex-col items-center">

                                                    <div id={`nft-card-${prop.id}`} className="relative w-full max-w-[320px] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl bg-black border border-yellow-500/30">

                                                        {/* FIXED IMAGE TAG (Removed crossOrigin that was breaking it locally) */}

                                                        <img src={nftTemplate} alt="Deed" className="absolute inset-0 w-full h-full object-cover z-0" />

                                                        <div className="absolute inset-0 z-10">

                                                            <div className="absolute top-[28.5%] left-[22%] truncate w-[45%]  text-lg" style={{ color: "#ffffff" }}>{prop.name}</div>

                                                            <div className="absolute top-[32%] right-[12%] text-sm font-black tracking-widest w-[20%] text-center" style={{ color: "#000000" }}>{prop.id}</div>

                                                            <div className="absolute top-[38.5%] left-[10%] text-sm w-[70%] truncate" style={{ color: "#ffffff" }}>{prop.address}</div>

                                                            <div className="absolute top-[47%] left-[32%] text-sm truncate w-[60%]" style={{ color: "#ffffff" }}>{prop.area} sq.ft</div>

                                                            <div className="absolute top-[60%] left-[8%] text-[10px] font-mono break-all w-[84%] leading-tight p-1 rounded" style={{ color: "#22d3ee", backgroundColor: "rgba(0,0,0,0.6)" }}>{walletAddress}</div>

                                                            <div className="absolute bottom-[4%] left-[8%] text-[10px] font-bold tracking-widest px-2 py-0.5 rounded" style={{ color: "#ffffff", backgroundColor: "rgba(220,38,38,0.9)" }}>ISSUED: {prop.date}</div>

                                                        </div>

                                                    </div>

                                                    <button onClick={() => downloadNFTCard(`nft-card-${prop.id}`, prop.name)} className="w-full mt-4 py-2 bg-zinc-800 rounded-lg text-sm font-bold text-yellow-500 hover:bg-zinc-700 transition">

                                                        ⬇ Download Official Deed

                                                    </button>

                                                </div>

                                            )}



                                            {/* VERIFIED TENANT VIEW: Show Rent Details */}

                                            {prop.userRole === "TENANT" && (

                                                <div className="mb-4 p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl">

                                                    <p className="text-xs text-purple-300 font-bold mb-1">Landlord (Owner)</p>

                                                    <p className="text-sm font-mono text-white mb-3">{prop.name}</p>

                                                    <p className="text-xs text-purple-300 font-bold mb-1">Rent Paid</p>

                                                    <p className="text-sm font-mono text-white">{prop.leasePrice} ETH</p>

                                                </div>

                                            )}



                                            {/* LEASE TIMER (Visible to Both Owner and Tenant) */}

                                            {prop.saleStatus === 3 && (

                                                <LeaseTimer leaseEnd={prop.leaseEnd} tenant={prop.tenant} userRole={prop.userRole} />

                                            )}



                                            {/* --- OWNER CONTROLS --- */}

                                            {prop.userRole === "OWNER" && (

                                                <div className="mt-auto flex flex-row gap-3 border-t border-white/5 pt-5">

                                                    {prop.saleStatus === 0 ? (

                                                        <>

                                                            <button onClick={() => openActionModal(prop.id, "SALE")} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all">🏷️ Sell</button>

                                                            <button onClick={() => openActionModal(prop.id, "LEASE")} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-bold shadow-lg hover:-translate-y-0.5 transition-all">📝 Lease</button>

                                                        </>

                                                    ) : prop.saleStatus === 3 ? (

                                                        <button onClick={() => openActionModal(prop.id, "PRIVATE")} className="w-full py-3 rounded-xl bg-zinc-800 text-red-400 border border-red-500/30 hover:bg-red-500/10 text-sm font-bold transition-all">

                                                            🔒 Evict & Reclaim

                                                        </button>

                                                    ) : (

                                                        <button onClick={() => openActionModal(prop.id, "PRIVATE")} className="w-full py-3 rounded-xl bg-zinc-800 text-red-400 border border-red-500/30 hover:bg-red-500/10 text-sm font-bold transition-all">

                                                            🔒 Cancel Listing (Make Private)

                                                        </button>

                                                    )}

                                                </div>

                                            )}

                                        </>

                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>



            {/* --- MODAL (POPUP) --- */}

            {showModal && (

                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">

                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">

                        <h3 className="text-xl font-bold text-white mb-1">{modalType === "SALE" ? "List for Sale 🏷️" : "List for Lease 📝"}</h3>

                        <p className="text-sm text-gray-400 mb-6">Configure your listing terms below.</p>



                        <div className="space-y-4">

                            <div>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{modalType === "SALE" ? "Selling Price (ETH)" : "Expected Rent / Month (ETH)"}</label>

                                <input type="number" value={inputPrice} onChange={(e) => setInputPrice(e.target.value)} className="w-full bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none" placeholder="e.g. 0.05" />

                            </div>

                            {modalType === "LEASE" && (

                                <div>

                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lease Duration</label>

                                    <div className="flex gap-2">

                                        <input type="number" value={leaseTimeVal} onChange={(e) => setLeaseTimeVal(e.target.value)} className="w-2/3 bg-black/50 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none" placeholder="e.g. 6" />

                                        <select value={leaseTimeUnit} onChange={(e) => setLeaseTimeUnit(e.target.value)} className="w-1/3 bg-zinc-800 border border-zinc-700 rounded-lg px-2 text-white outline-none cursor-pointer">

                                            <option value="months">Months</option>

                                            <option value="days">Days</option>

                                        </select>

                                    </div>

                                </div>

                            )}

                        </div>



                        <div className="grid grid-cols-2 gap-3 mt-8">

                            <button onClick={() => setShowModal(false)} className="py-3 rounded-xl bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-700 transition">Cancel</button>

                            <button onClick={() => executeAction()} disabled={actionLoading} className="py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:scale-[1.02] shadow-lg disabled:opacity-50">

                                {actionLoading ? "Confirming..." : "Confirm Listing"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};
export default OwnerDashboard;