// src/pages/Home.jsx
import { useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { useAuth } from "../context/AuthContext.jsx";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig.js";

const Home = () => {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { isWalletConnected, connectWallet, hasMetaMask } = useAuth();

  const handleSearch = async () => {
    setResult(null);
    if (!hash.trim()) return;

    try {
      setIsSearching(true);

      if (!window.ethereum) {
        setResult("no-wallet");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(
        PROPERTY_REGISTRY_ADDRESS,
        PROPERTY_REGISTRY_ABI,
        provider
      );

      const [exists] = await contract.checkProperty(hash.trim());
      setResult(exists ? "found" : "not-found");
    } catch (err) {
      console.error(err);
      setResult("error");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* HERO + SEARCH */}
      <section className="relative flex items-center justify-center px-8 py-16 overflow-hidden">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-amber-900/40 blur-3xl" />
          <div className="absolute right-10 top-10 h-72 w-72 border border-amber-900/60 rounded-[40px] rotate-6 opacity-40" />
        </div>

        <div className="relative max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Wallet suggestion banner */}
            {!isWalletConnected && (
              <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <span>
                  For secure on-chain verification and property registration,
                  please connect your Ethereum wallet.
                </span>
                <div className="flex items-center gap-2">
                  {!hasMetaMask && (
                    <span className="text-[11px] text-red-300">
                      MetaMask not detected.
                    </span>
                  )}
                  <button
                    onClick={connectWallet}
                    disabled={!hasMetaMask}
                    className="px-3 py-1.5 rounded-full bg-amber-500 text-black text-xs font-semibold hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            )}

            <p className="text-sm font-semibold tracking-[0.2em] text-cyan-400 mb-3">
              BLOCKCHAIN POWERED REAL ESTATE
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Property Management
              <span className="block text-cyan-400">using Blockchain</span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base mb-6">
              Verify ownership and track property records instantly by searching
              with a unique blockchain hash.
            </p>

            <div className="bg-black/70 border border-white/10 rounded-2xl p-5 shadow-xl shadow-amber-900/30">
              <label className="block text-xs font-medium text-gray-300 mb-2">
                SEARCH PROPERTY BY HASH
              </label>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Enter property hash (e.g. 0x...)"
                  className="flex-1 rounded-xl bg-zinc-900/80 border border-zinc-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-semibold shadow-lg shadow-cyan-500/40 transition-all"
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {result === "found" && (
                <p className="mt-4 text-sm text-emerald-400">
                  ✔ Property exists on the blockchain for this hash.
                </p>
              )}
              {result === "not-found" && (
                <p className="mt-4 text-sm text-red-400">
                  ✖ No property record found for this hash.
                </p>
              )}
              {result === "no-wallet" && (
                <p className="mt-4 text-sm text-amber-300">
                  Wallet provider not detected. Please open MetaMask on the
                  Hardhat network.
                </p>
              )}
              {result === "error" && (
                <p className="mt-4 text-sm text-red-400">
                  Something went wrong while checking the property. Try again.
                </p>
              )}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="relative group max-w-sm ml-auto">
              {/* gradient glow background */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 opacity-40 blur-xl group-hover:opacity-70 group-hover:blur-2xl transition-all duration-500"></div>

              {/* main card */}
              <div className="relative rounded-3xl border border-white/10 bg-black/40 bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-950/90 p-7 shadow-2xl shadow-amber-900/50 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Latest Blocks
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/40">
                    LIVE
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <BlockRow height="#8212" hash="0x123" />
                  <BlockRow height="#8211" hash="0xabc" />
                  <BlockRow height="#8210" hash="0x999" />
                  <BlockRow height="#820F" hash="0xpropertyhash1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP SECTION */}
      <section className="relative px-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            How Propertix works
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-2xl">
            A simple three-step flow to make property records verifiable and
            tamper‑proof using blockchain.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="relative group rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-black/80 to-zinc-950/90 p-5 shadow-lg shadow-black/60 overflow-hidden">
              <div className="absolute -top-10 -right-10 h-24 w-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-3">
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-semibold">
                  1
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Register property details
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Owner or authority fills basic property information and uploads
                supporting documents. These details are converted into a unique
                cryptographic hash.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative group rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-black/80 to-zinc-950/90 p-5 shadow-lg shadow-black/60 overflow-hidden">
              <div className="absolute -top-10 -right-10 h-24 w-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-3">
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-amber-500/20 text-amber-300 text-sm font-semibold">
                  2
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Store hash on blockchain
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Using a connected wallet, the hash is stored in a smart
                contract. Validators include this transaction in a block,
                creating an immutable proof of existence.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative group rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-black/80 to-zinc-950/90 p-5 shadow-lg shadow-black/60 overflow-hidden">
              <div className="absolute -top-10 -right-10 h-24 w-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
              <div className="flex items-center gap-3 mb-3">
                <span className="h-8 w-8 flex items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-semibold">
                  3
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Verify with a single hash
                </h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Any buyer, bank or verifier can paste the property hash on
                Propertix. The system checks the blockchain and instantly tells
                whether the record exists and is valid.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

const BlockRow = ({ height, hash }) => (
  <div className="group flex items-center justify-between rounded-2xl bg-black/70 border border-white/10 px-4 py-3 transition-all duration-200 hover:border-amber-400/70 hover:bg-amber-950/40 hover:-translate-y-[1px]">
    <div>
      <p className="text-gray-100 text-sm">Block {height}</p>
      <p className="text-[11px] text-gray-500">Hash: {hash}</p>
    </div>
    <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/40 group-hover:bg-purple-500/20">
      confirmed
    </span>
  </div>
);

export default Home;
