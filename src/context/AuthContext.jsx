// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const isAuthenticated = !!walletAddress;

  // MetaMask available hai ya nahi
  const hasMetaMask = typeof window !== "undefined" && window.ethereum;

  const connectWallet = async () => {
    try {
      if (!hasMetaMask) {
        alert("MetaMask not found. Please install MetaMask extension.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  // account change / disconnect handle
  useEffect(() => {
    if (!hasMetaMask) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
      } else {
        setWalletAddress(accounts[0]);
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [hasMetaMask]);

  const value = {
    walletAddress,
    isAuthenticated,
    connectWallet,
    disconnectWallet,
    hasMetaMask,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
