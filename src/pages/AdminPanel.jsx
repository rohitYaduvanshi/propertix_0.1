import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";

const AdminPanel = () => {
  const { isAdmin, isSurveyor, isRegistrar, walletAddress } = useAuth();
  
  // States
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]); 
  const [contractBalance, setContractBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  
  // 🔥 NEW: Search State for Property Lineage (Ancestry Trace)
  const [searchId, setSearchId] = useState(""); 

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      if (!window.ethereum) return;
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      // 1. Get All Requests
      const data = await contract.getAllRequests();
      setRequests(data);

      // 2. Admin Balance
      if (isAdmin) {
          const balance = await provider.getBalance(PROPERTY_REGISTRY_ADDRESS);
          setContractBalance(formatEther(balance));
      }

      // 3. FETCH HISTORY
      fetchHistory(contract, provider);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // --- FETCH HISTORY LOGIC (WITH ACTUAL DEED NAMES) ---
  const fetchHistory = async (contract, provider) => {
      try {
          const soldFilter = contract.filters.PropertySold();
          const rentFilter = contract.filters.PropertyRented();
          const mintFilter = contract.filters.PropertyMinted();

          const [soldLogs, rentLogs, mintLogs] = await Promise.all([
              contract.queryFilter(soldFilter),
              contract.queryFilter(rentFilter),
              contract.queryFilter(mintFilter)
          ]);

          const nameCache = {};
          const getAddressName = async (addr) => {
              if (!addr || addr === "0x0000000000000000000000000000000000000000") return "System";
              if (nameCache[addr]) return nameCache[addr];
              try {
                  const user = await contract.users(addr);
                  let name = user && user[0] ? user[0] : (user && user.name ? user.name : "Unknown User");
                  nameCache[addr] = name;
                  return name;
              } catch (e) {
                  return "Unknown User";
              }
          };

          const getPropertyOwnerName = async (tokenId) => {
              try {
                  const prop = await contract.requests(tokenId);
                  return prop.ownerName; 
              } catch (e) {
                  return null;
              }
          };

          // Process Sales
          const salesPromises = soldLogs.map(async (log) => {
              const tokenId = log.args[0].toString();
              const fromAddr = log.args[1];
              const toAddr = log.args[2];
              const actualDeedName = await getPropertyOwnerName(tokenId);

              return {
                  type: "SALE",
                  id: tokenId,
                  from: fromAddr,
                  fromName: await getAddressName(fromAddr), 
                  to: toAddr,
                  toName: actualDeedName || await getAddressName(toAddr), 
                  price: formatEther(log.args[3]),
                  date: Number(log.args[4]) * 1000,
                  hash: log.transactionHash
              };
          });

          // Process Rents
          const rentsPromises = rentLogs.map(async (log) => {
              const tokenId = log.args[0].toString();
              const toAddr = log.args[1]; 
              const actualDeedName = await getPropertyOwnerName(tokenId);

              return {
                  type: "LEASE",
                  id: tokenId,
                  from: null,
                  fromName: actualDeedName || "Property Owner", 
                  to: toAddr,
                  toName: await getAddressName(toAddr), 
                  duration: log.args[2].toString(),
                  price: formatEther(log.args[3]),
                  date: Number(log.args[4]) * 1000,
                  hash: log.transactionHash
              };
          });

          // Process Mints
          const mintsPromises = mintLogs.map(async (log) => {
              const tokenId = log.args[0].toString();
              const toAddr = log.args[1];
              const block = await provider.getBlock(log.blockNumber);
              const actualDeedName = await getPropertyOwnerName(tokenId);

              return {
                  type: "MINT",
                  id: tokenId,
                  from: null,
                  fromName: "Govt. of India",
                  to: toAddr,
                  toName: actualDeedName || await getAddressName(toAddr), 
                  price: "0",
                  date: Number(block.timestamp) * 1000,
                  hash: log.transactionHash
              };
          });

          const allEvents = await Promise.all([
              Promise.all(salesPromises),
              Promise.all(rentsPromises),
              Promise.all(mintsPromises)
          ]);
          
          const formattedHistory = allEvents.flat().sort((a, b) => b.date - a.date);
          setHistory(formattedHistory);

      } catch (err) {
          console.error("History Error:", err);
      }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, isSurveyor, isRegistrar]);

  // --- ACTIONS ---
  const handleAction = async (id, actionType) => {
    try {
        setLoading(true);
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

        let tx;
        if (actionType === "SURVEY") {
            tx = await contract.completeSurvey(id);
        } else if (actionType === "APPROVE") {
            tx = await contract.approveAndMint(id);
        } else if (actionType === "REJECT") {
            tx = await contract.rejectRequest(id);
        } else if (actionType === "WITHDRAW") {
            tx = await contract.withdrawFunds();
        }

        await tx.wait();
        alert(`Action ${actionType} Successful!`);
        fetchData(); 

    } catch (error) {
        console.error(error);
        alert("Transaction Failed: " + (error.reason || error.message));
    }
    setLoading(false);
  };

  // --- DASHBOARD COMPONENTS ---
  const SurveyorDashboard = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-yellow-500/10 border border-yellow-500 p-4 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                🚧 Surveyor Dashboard <span className="text-sm font-normal text-gray-400">(Verification Phase)</span>
            </h2>
        </div>
        <div className="grid gap-4">
            {requests.map((req) => {
                if (Number(req.status) !== 0) return null; 
                return (
                    <div key={req.id} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-yellow-500 transition-all flex justify-between items-center group">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded font-mono">ID: #{req.id.toString()}</span>
                                <span className="text-gray-400 text-xs font-mono">{new Date(Number(req.requestTime) * 1000).toLocaleDateString()}</span>
                            </div>
                            <p className="text-white font-bold mb-1">Requester: <span className="font-mono text-gray-400">{req.requester.slice(0,6)}...{req.requester.slice(-4)}</span></p>
                            <a href={req.ipfsMetadata} target="_blank" rel="noreferrer" className="text-cyan-400 text-sm hover:underline flex items-center gap-1">
                                📄 View Documents (IPFS)
                            </a>
                        </div>
                        <button 
                            onClick={() => handleAction(req.id, "SURVEY")}
                            disabled={loading}
                            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Processing..." : "✅ Mark Verified"}
                        </button>
                    </div>
                );
            })}
             {requests.filter(r => Number(r.status) === 0).length === 0 && <p className="text-gray-500 text-center">No pending surveys.</p>}
        </div>
    </div>
  );

  const RegistrarDashboard = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-green-500/10 border border-green-500 p-4 rounded-xl mb-6">
            <h2 className="text-xl font-bold text-green-500 flex items-center gap-2">
                ⚖️ Registrar Dashboard <span className="text-sm font-normal text-gray-400">(Final Approval & Minting)</span>
            </h2>
        </div>
        <div className="grid gap-4">
            {requests.map((req) => {
                if (Number(req.status) !== 1) return null; 
                return (
                    <div key={req.id} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-green-500 transition-all flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded font-mono">ID: #{req.id.toString()}</span>
                                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">Surveyed Verified</span>
                            </div>
                            <p className="text-white font-bold text-sm">Owner Name: <span className="font-bold text-cyan-400">{req.ownerName}</span></p>
                            <p className="text-gray-500 text-xs mt-1">Wallet: <span className="font-mono">{req.requester}</span></p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => handleAction(req.id, "REJECT")} className="bg-red-900/30 border border-red-900 hover:bg-red-900 text-red-400 px-4 py-2 rounded-xl text-sm transition-all">❌ Reject</button>
                            <button onClick={() => handleAction(req.id, "APPROVE")} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all disabled:opacity-50">
                                {loading ? "Minting..." : "🏆 Approve & Mint NFT"}
                            </button>
                        </div>
                    </div>
                );
            })}
            {requests.filter(r => Number(r.status) === 1).length === 0 && <p className="text-gray-500 text-center">No approvals pending.</p>}
        </div>
    </div>
  );

  const SuperAdminDashboard = () => (
    <div className="space-y-8 animate-fade-in">
        <h2 className="text-3xl font-bold text-red-500 mb-6 flex items-center gap-3">
            👑 Government Administration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Treasury Balance</h3>
                <p className="text-3xl font-bold text-white mt-2 font-mono">{contractBalance} ETH</p>
                <button onClick={() => handleAction(null, "WITHDRAW")} className="mt-4 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg text-sm border border-zinc-700 transition-all">Withdraw Funds</button>
            </div>
        </div>
    </div>
  );

  // --- 🔥 UPDATED: HISTORY TABLE UI WITH PROPERTY TRACER ---
  const HistorySection = () => {
      // 🟢 Filter logic: if searchId exists, show only that property's history
      const filteredHistory = searchId 
          ? history.filter(tx => tx.id === searchId) 
          : history;

      return (
          <div className="mt-12 bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* HEADER & SEARCH BAR */}
              <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-800/50">
                  <div>
                      <h3 className="text-xl font-bold text-white">📜 Property Lineage & History</h3>
                      <p className="text-xs text-gray-400 mt-1">Trace complete ancestry of any property on-chain</p>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative w-full md:w-64">
                          <input 
                              type="number" 
                              value={searchId}
                              onChange={(e) => setSearchId(e.target.value)}
                              placeholder="🔍 Enter Property ID..." 
                              className="w-full bg-black/50 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-500 outline-none text-sm transition font-mono"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔎</span>
                      </div>
                      <span className="text-xs text-green-400 font-mono flex items-center gap-2 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Live Sync
                      </span>
                  </div>
              </div>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400">
                      <thead className="bg-black/60 text-[10px] tracking-widest uppercase text-gray-500 font-bold border-b border-white/5">
                          <tr>
                              <th className="px-6 py-4">Event Type</th>
                              <th className="px-6 py-4">Prop. ID</th>
                              <th className="px-6 py-4">Transfer Details (Sender ➝ Receiver)</th>
                              <th className="px-6 py-4">Price/Value</th>
                              <th className="px-6 py-4">Date & Time</th>
                              <th className="px-6 py-4">Proof</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {searchId && filteredHistory.length === 0 ? (
                              <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">No history found for Property ID #{searchId}.</td></tr>
                          ) : filteredHistory.length === 0 ? (
                              <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">No transactions found on blockchain yet.</td></tr>
                          ) : filteredHistory.map((tx, i) => (
                              <tr key={i} className={`hover:bg-white/5 transition duration-200 ${searchId ? 'bg-cyan-900/5' : ''}`}>
                                  <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                          tx.type === 'SALE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                          tx.type === 'LEASE' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' :
                                          'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                                      }`}>
                                          {tx.type}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 font-black text-white text-base">#{tx.id}</td>
                                  
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="flex flex-col items-end">
                                              <span className="text-gray-400 font-bold">{tx.fromName}</span>
                                              {tx.from && <span className="text-[9px] text-gray-600 font-mono">{tx.from.slice(0,6)}...{tx.from.slice(-4)}</span>}
                                          </div>
                                          
                                          <span className="text-cyan-500 text-lg">➝</span>
                                          
                                          <div className="flex flex-col items-start">
                                              <span className="text-white font-bold">{tx.toName}</span>
                                              {tx.to && <span className="text-[9px] text-cyan-700 font-mono">{tx.to.slice(0,6)}...{tx.to.slice(-4)}</span>}
                                          </div>
                                      </div>
                                  </td>
                                  
                                  <td className="px-6 py-4 font-bold text-cyan-400">
                                      {tx.price} ETH
                                      {tx.type === 'LEASE' && <span className="text-[10px] font-normal text-gray-500 ml-1">/mo</span>}
                                  </td>
                                  <td className="px-6 py-4 text-[11px] text-gray-400 font-mono">
                                      {new Date(tx.date).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4">
                                      <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 hover:bg-cyan-600 hover:text-white text-gray-400 transition">
                                          ↗
                                      </a>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 pt-24">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Officer Control Panel</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-gray-500 text-xs font-mono">Connected: {walletAddress}</p>
                    </div>
                </div>
                {isAdmin && <span className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-1.5 rounded-full text-xs font-bold">ADMIN MODE</span>}
                {isSurveyor && <span className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-500 px-4 py-1.5 rounded-full text-xs font-bold">SURVEYOR MODE</span>}
                {isRegistrar && <span className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-1.5 rounded-full text-xs font-bold">REGISTRAR MODE</span>}
            </div>

            {isAdmin ? <SuperAdminDashboard /> : 
             isSurveyor ? <SurveyorDashboard /> : 
             isRegistrar ? <RegistrarDashboard /> : (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-zinc-800 rounded-3xl bg-zinc-900/30">
                    <div className="text-5xl mb-4">🚫</div>
                    <h2 className="text-red-500 text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-gray-400 max-w-md">Your wallet is connected, but you do not have an official role.</p>
                </div>
            )}

            {/* History Section renders for all authorized roles */}
            {(isAdmin || isSurveyor || isRegistrar) && <HistorySection />}
        </div>
    </div>
  );
};

export default AdminPanel;