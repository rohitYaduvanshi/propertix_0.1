import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { Link } from "react-router-dom"; 
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig"; 
import { useAuth } from "../context/AuthContext";
import * as htmlToImage from "html-to-image"; 
import nftTemplate from "../assets/NFT_Ownership_certificate.png";

const OwnerDashboard = () => {
    const [myProperties, setMyProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const { walletAddress, isWalletConnected } = useAuth();

    const loadMyProperties = async () => {
        try {
            if (!isWalletConnected || !walletAddress) return;
            const provider = new BrowserProvider(window.ethereum);
            const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

            const data = await contract.getAllRequests();
            const currentTimestamp = Math.floor(Date.now() / 1000);

            // Filter logic
            const filtered = data.filter((item) => {
                const isOwner = item.requester.toLowerCase() === walletAddress.toLowerCase();
                const isTenant = item.tenant.toLowerCase() === walletAddress.toLowerCase() && Number(item.leaseEndTime) > currentTimestamp;
                return isOwner || isTenant;
            });

            const formatted = await Promise.all(filtered.map(async (item) => {
                // Default metadata if fetch fails
                let meta = { name: "Property Record", image: null, attributes: [] };
                
                if (item.ipfsMetadata && item.ipfsMetadata.startsWith("http")) {
                    try {
                        const response = await fetch(item.ipfsMetadata, { timeout: 5000 });
                        if (response.ok) {
                            const json = await response.json();
                            meta = { ...meta, ...json };
                        }
                    } catch (err) { 
                        console.warn("IPFS fetch skipped for ID:", item.id); 
                    }
                }

                const getAttr = (key) => meta.attributes?.find(a => a.trait_type === key)?.value || "N/A";
                const isOwner = item.requester.toLowerCase() === walletAddress.toLowerCase();

                return {
                    id: Number(item.id),
                    name: item.ownerName || meta.name || "Verified Owner", 
                    address: getAttr("Address") !== "N/A" ? getAttr("Address") : item.propertyAddress,
                    status: Number(item.status),
                    saleStatus: Number(item.saleStatus),
                    area: getAttr("Area"),
                    ipfsLink: item.ipfsMetadata,
                    identityHash: item.identityHash, 
                    displayImage: meta.image,
                    date: new Date(Number(item.requestTime) * 1000).toLocaleDateString(),
                    userRole: isOwner ? "OWNER" : "TENANT" 
                };
            }));

            setMyProperties(formatted.reverse());
        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isWalletConnected) loadMyProperties();
    }, [isWalletConnected, walletAddress]);

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

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-500 font-black tracking-widest animate-pulse">SYNCING ASSETS...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-cyan-400 uppercase tracking-tighter">My Vault</h1>
                        <p className="text-gray-500 text-sm mt-2">Manage your verified blockchain land records.</p>
                    </div>
                    <div className="bg-zinc-900 border border-white/5 px-4 py-2 rounded-2xl text-[10px] font-mono text-zinc-400">
                        CONNECTED: {walletAddress}
                    </div>
                </div>

                {myProperties.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-zinc-800 rounded-[40px] bg-zinc-900/10">
                        <p className="text-gray-500 font-medium">Your vault is currently empty.</p>
                        <Link to="/blockchain" className="inline-block mt-4 text-cyan-400 hover:text-white font-bold transition">Register Property →</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myProperties.map((prop) => (
                            <div key={prop.id} className="group bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl hover:border-cyan-500/30 transition-all duration-500">
                                
                                {/* Property Header Image */}
                                <div className="h-44 bg-zinc-800 relative overflow-hidden">
                                    {prop.displayImage ? (
                                        <img src={prop.displayImage} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-700 text-5xl">🏘️</div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-cyan-400 border border-white/10">
                                        ID: #{prop.id}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold mb-1 truncate">{prop.name}</h3>
                                    <p className="text-gray-500 text-[10px] mb-6 uppercase tracking-widest font-bold truncate">📍 {prop.address}</p>

                                    {/* ✨ PROOF OF REGISTRY (IPFS & HASH) */}
                                    <div className="mb-6 space-y-3 p-4 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">Digital Asset (IPFS)</span>
                                            <a href={prop.ipfsLink} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 truncate hover:text-emerald-300 transition-colors font-mono">
                                                {prop.ipfsLink}
                                            </a>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">Identity Proof (Hash)</span>
                                            <span className="text-[10px] text-zinc-300 font-mono truncate bg-zinc-800/50 p-1 rounded">
                                                {prop.identityHash}
                                            </span>
                                        </div>
                                    </div>

                                    {prop.status === 2 ? (
                                        <div className="flex-1 flex flex-col">
                                            {/* NFT Card Preview */}
                                            <div id={`nft-card-${prop.id}`} className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-yellow-500/20 group-hover:shadow-yellow-500/10 transition-shadow">
                                                <img src={nftTemplate} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                                <div className="absolute inset-0 z-10 text-white p-4">
                                                    <div className="absolute top-[28%] left-[22%] text-[10px] md:text-xs font-bold truncate w-[50%]">{prop.name}</div>
                                                    <div className="absolute top-[38%] left-[10%] text-[8px] md:text-[9px] w-[70%] leading-tight text-zinc-200">{prop.address}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => downloadNFTCard(`nft-card-${prop.id}`, prop.name)} className="mt-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-yellow-500 text-center uppercase tracking-widest transition-all">
                                                ⬇ Download Official Deed
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="py-16 text-center bg-zinc-800/10 rounded-3xl border border-dashed border-zinc-800/50">
                                            <div className="text-2xl mb-2 animate-bounce">⏳</div>
                                            <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Verification Pending</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboard;