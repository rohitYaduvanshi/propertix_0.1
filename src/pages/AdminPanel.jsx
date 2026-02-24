import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI } from "../blockchain/contractConfig";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, Search, History, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

const AdminPanel = () => {
  const { isAdmin, isSurveyor, isRegistrar, walletAddress } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]); 
  const [contractBalance, setContractBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState(""); 

  const fetchData = async () => {
    try {
      if (!window.ethereum) return;
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      const data = await contract.getAllRequests();
      setRequests(data);

      if (isAdmin) {
          const balance = await provider.getBalance(PROPERTY_REGISTRY_ADDRESS);
          setContractBalance(formatEther(balance));
      }

      fetchHistory(contract, provider);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

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
                  let name = user && user[0] ? user[0] : "Authorized User";
                  nameCache[addr] = name;
                  return name;
              } catch (e) { return "Unknown User"; }
          };

          const salesPromises = soldLogs.map(async (log) => ({
              type: "SALE",
              id: log.args[0].toString(),
              fromName: await getAddressName(log.args[1]), 
              toName: await getAddressName(log.args[2]), 
              price: formatEther(log.args[3]),
              date: Number(log.args[4]) * 1000,
              hash: log.transactionHash
          }));

          const allEvents = await Promise.all([
              Promise.all(salesPromises),
              // ... (बाकी Rent/Mint logic वही रहेगा)
          ]);
          
          setHistory(allEvents.flat().sort((a, b) => b.date - a.date));
      } catch (err) { console.error("History Error:", err); }
  };

  useEffect(() => { fetchData(); }, [isAdmin, isSurveyor, isRegistrar]);

  const handleAction = async (id, actionType) => {
    try {
        setLoading(true);
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, signer);

        let tx;
        if (actionType === "SURVEY") tx = await contract.completeSurvey(id);
        else if (actionType === "APPROVE") tx = await contract.approveAndMint(id);
        else if (actionType === "REJECT") tx = await contract.rejectRequest(id);
        else if (actionType === "WITHDRAW") tx = await contract.withdrawFunds();

        await tx.wait();
        alert(`Action ${actionType} Successful!`);
        fetchData(); 
    } catch (error) {
        alert("Transaction Failed: " + (error.reason || error.message));
    } finally { setLoading(false); }
  };

  // ✅ SURVEYOR DASHBOARD (Phase 2: After Govt Verification)
  const SurveyorDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-3xl flex items-center justify-between">
            <div>
                <h2 className="text-xl font-black text-amber-500 uppercase tracking-tighter flex items-center gap-2 italic">
                    <TrendingUp className="w-5 h-5"/> Surveyor Hub
                </h2>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">Status: Checking Post-Govt Verified Assets</p>
            </div>
            <div className="text-right">
                <span className="text-2xl font-black text-white">{requests.filter(r => Number(r.status) === 1).length}</span>
                <p className="text-[8px] text-zinc-500 uppercase font-black">Pending Inspections</p>
            </div>
        </div>
        <div className="grid gap-4">
            {requests.map((req) => {
                // 🛑 केवल वही दिखेंगे जो Govt Officer से पास हो चुके हैं (Status 1)
                if (Number(req.status) !== 1) return null; 
                return (
                    <div key={req.id} className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-[32px] border border-white/5 hover:border-amber-500/50 transition-all flex justify-between items-center group">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="bg-amber-500/20 text-amber-500 text-[10px] px-3 py-1 rounded-full font-black uppercase italic">ID: #{req.id.toString()}</span>
                                <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">● Govt Approved</span>
                            </div>
                            <p className="text-white font-bold text-sm tracking-tight italic uppercase">Location: {req.landLocation}</p>
                            <a href={req.ipfsMetadata} target="_blank" rel="noreferrer" className="text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                                [ View Field Data ]
                            </a>
                        </div>
                        <button onClick={() => handleAction(req.id, "SURVEY")} disabled={loading} className="bg-white text-black font-black text-[10px] px-8 py-4 rounded-2xl uppercase tracking-[0.2em] hover:bg-amber-500 transition-all active:scale-95 disabled:opacity-50">
                            {loading ? "Verifying..." : "Mark Inspected"}
                        </button>
                    </div>
                );
            })}
             {requests.filter(r => Number(r.status) === 1).length === 0 && <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px] text-zinc-600 font-bold uppercase text-xs">Waiting for Govt Officer to verify new requests...</div>}
        </div>
    </div>
  );

  // ✅ REGISTRAR DASHBOARD (Phase 3: Final Minting)
  const RegistrarDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-cyan-500/10 border border-cyan-500/30 p-6 rounded-3xl flex items-center justify-between">
            <h2 className="text-xl font-black text-cyan-500 uppercase tracking-tighter italic">⚖️ Registrar Authority</h2>
            <div className="text-right">
                <span className="text-2xl font-black text-white">{requests.filter(r => Number(r.status) === 2).length}</span>
                <p className="text-[8px] text-zinc-500 uppercase font-black">Ready to Mint</p>
            </div>
        </div>
        <div className="grid gap-4">
            {requests.map((req) => {
                // 🛑 केवल वही दिखेंगे जिनका Survey हो चुका है (Status 2)
                if (Number(req.status) !== 2) return null; 
                return (
                    <div key={req.id} className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-[32px] border border-white/5 hover:border-cyan-500/50 transition-all flex justify-between items-center">
                        <div className="space-y-2">
                            <span className="bg-cyan-500/20 text-cyan-500 text-[10px] px-3 py-1 rounded-full font-black uppercase">ID: #{req.id.toString()}</span>
                            <p className="text-white font-black text-sm italic uppercase tracking-tighter">Deed Name: {req.ownerName}</p>
                            <p className="text-zinc-500 text-[9px] font-mono tracking-widest uppercase">{req.requester.slice(0,12)}...{req.requester.slice(-8)}</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => handleAction(req.id, "REJECT")} className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline px-4">Reject</button>
                            <button onClick={() => handleAction(req.id, "APPROVE")} disabled={loading} className="bg-cyan-500 text-black font-black text-[10px] px-8 py-4 rounded-2xl uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(6,182,212,0.2)] active:scale-95">
                                {loading ? "Minting..." : "Final Approve & Mint"}
                            </button>
                        </div>
                    </div>
                );
            })}
             {requests.filter(r => Number(r.status) === 2).length === 0 && <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[40px] text-zinc-600 font-bold uppercase text-xs">Awaiting Survey Completion...</div>}
        </div>
    </div>
  );

  // ✅ SUPER ADMIN
  const SuperAdminDashboard = () => (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
        <div className="bg-red-500/5 border border-red-500/20 p-10 rounded-[50px] text-center relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] mb-4 italic italic font-sans">Blockchain Treasury</p>
                <h2 className="text-5xl font-black text-white tracking-tighter mb-8">{contractBalance} <span className="text-xl text-zinc-600">ETH</span></h2>
                <button onClick={() => handleAction(null, "WITHDRAW")} className="bg-white text-black font-black text-xs px-12 py-5 rounded-2xl uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-2xl">Execute Fund Withdrawal</button>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <AlertCircle className="w-64 h-64 -ml-20 -mt-20"/>
            </div>
        </div>
    </div>
  );

  const HistorySection = () => {
      const filteredHistory = searchId ? history.filter(tx => tx.id === searchId) : history;
      return (
          <div className="mt-20 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase italic italic font-sans tracking-tighter">Asset Lineage <span className="text-zinc-700">/ Tracing</span></h3>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-hover:text-cyan-500 transition-colors"/>
                    <input type="number" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="TRACE PROPERTY ID..." className="bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black tracking-widest text-white outline-none focus:border-cyan-500/50 w-64 transition-all" />
                </div>
              </div>

              <div className="overflow-x-auto rounded-[32px] border border-white/5 bg-zinc-900/20 backdrop-blur-xl">
                  <table className="w-full text-left">
                      <thead className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                          <tr>
                              <th className="px-8 py-6">Type</th>
                              <th className="px-8 py-6">Identity</th>
                              <th className="px-8 py-6">Provenance Path</th>
                              <th className="px-8 py-6">Value</th>
                              <th className="px-8 py-6">Hash</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {filteredHistory.map((tx, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-all group">
                                  <td className="px-8 py-6">
                                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${tx.type === 'SALE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'}`}>{tx.type}</span>
                                  </td>
                                  <td className="px-8 py-6 font-black text-white text-sm italic tracking-tighter">#{tx.id}</td>
                                  <td className="px-8 py-6">
                                      <div className="flex items-center gap-3 text-[10px] font-bold">
                                          <span className="text-zinc-500">{tx.fromName}</span>
                                          <span className="text-cyan-500/50">→</span>
                                          <span className="text-white uppercase">{tx.toName}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-6 font-mono text-[10px] text-cyan-400 font-black">{tx.price} ETH</td>
                                  <td className="px-8 py-6">
                                      <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white transition-all">↗</a>
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
    <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-32 font-sans selection:bg-cyan-500 selection:text-black">
        <div className="max-w-6xl mx-auto">
            <header className="mb-20 flex justify-between items-end border-b border-white/5 pb-10">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.5em] italic">Authority_Interface_v3</p>
                    <h1 className="text-5xl font-black italic italic font-sans tracking-tighter uppercase">Protocol <span className="text-zinc-700">Control</span></h1>
                </div>
                <div className="flex gap-4">
                    {isAdmin && <span className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Admin_Active</span>}
                    {isSurveyor && <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Surveyor_Active</span>}
                    {isRegistrar && <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest italic">Registrar_Active</span>}
                </div>
            </header>

            <main>
                {isAdmin ? <SuperAdminDashboard /> : 
                 isSurveyor ? <SurveyorDashboard /> : 
                 isRegistrar ? <RegistrarDashboard /> : (
                    <div className="py-40 text-center space-y-6 bg-zinc-900/20 rounded-[50px] border border-white/5">
                        <ShieldAlert className="w-16 h-16 text-zinc-800 mx-auto" />
                        <h2 className="text-2xl font-black uppercase italic italic font-sans tracking-tighter">Access Unauthorized</h2>
                        <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em]">Your Identity Hash does not match official roles.</p>
                    </div>
                )}
                {(isAdmin || isSurveyor || isRegistrar) && <HistorySection />}
            </main>
        </div>
    </div>
  );
};

export default AdminPanel;