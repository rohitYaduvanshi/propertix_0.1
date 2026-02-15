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
                    // ✨ Proof of Registry
                    ipfsLink: item.ipfsMetadata,
                    identityHash: item.identityHash, 
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

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-black">SYNCING ASSETS...</div>;

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 flex justify-between items-end border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-4xl font-black text-cyan-400 uppercase tracking-tighter">My Assets</h1>
                        <p className="text-gray-500 text-sm">Review your land records and registry proofs.</p>
                    </div>
                </div>

                {myProperties.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
                        <p className="text-gray-600">No properties found in your vault.</p>
                        <Link to="/blockchain" className="text-cyan-400 mt-4 block font-bold">Register Now →</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {myProperties.map((prop) => (
                            <div key={prop.id} className="bg-zinc-900/50 border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
                                <div className="h-40 bg-zinc-800 relative">
                                    {prop.displayImage && <img src={prop.displayImage} className="w-full h-full object-cover opacity-50" alt="" />}
                                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full text-[10px] font-bold text-cyan-400">ID: #{prop.id}</div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold mb-1">{prop.name}</h3>
                                    <p className="text-gray-500 text-[10px] mb-4 uppercase tracking-widest">{prop.address}</p>

                                    {/* ✨ PROOF OF REGISTRY SECTION (IPFS & HASH) */}
                                    <div className="mb-6 space-y-3 p-4 bg-black/40 rounded-2xl border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-gray-500 font-black uppercase mb-1">🌍 IPFS Link</span>
                                            <a href={prop.ipfsLink} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 truncate hover:underline">{prop.ipfsLink}</a>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] text-gray-500 font-black uppercase mb-1">🔗 Identity Hash</span>
                                            <span className="text-[10px] text-zinc-400 font-mono truncate">
                                                {prop.identityHash.substring(0, 20)}...
                                            </span>
                                        </div>
                                    </div>

                                    {prop.status === 2 ? (
                                        <>
                                            <div id={`nft-card-${prop.id}`} className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-yellow-500/20 scale-95">
                                                <img src={nftTemplate} className="absolute inset-0 w-full h-full object-cover" alt="" />
                                                <div className="absolute inset-0 z-10 text-white p-4">
                                                    <div className="absolute top-[28%] left-[22%] text-xs font-bold">{prop.name}</div>
                                                    <div className="absolute top-[38%] left-[10%] text-[9px] w-[70%] leading-tight">{prop.address}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => downloadNFTCard(`nft-card-${prop.id}`, prop.name)} className="mt-4 text-[10px] font-black text-yellow-500 text-center uppercase tracking-widest hover:text-white transition">
                                                ⬇ Download Deed
                                            </button>
                                        </>
                                    ) : (
                                        <div className="py-12 text-center bg-zinc-800/10 rounded-2xl border border-dashed border-zinc-700">
                                            <p className="text-yellow-500 text-[10px] font-black uppercase animate-pulse">Verification Pending</p>
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