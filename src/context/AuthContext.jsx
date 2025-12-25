import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1) App login state (normal login)
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // 2) Wallet state (MetaMask)
  const [walletAddress, setWalletAddress] = useState(null);

  const hasMetaMask =
    typeof window !== "undefined" && typeof window.ethereum !== "undefined";

  // ----- APP LOGIN FUNCTIONS -----
  const appLogin = () => {
    setIsUserLoggedIn(true);
  };

  const appLogout = () => {
    setIsUserLoggedIn(false);
    setWalletAddress(null);
  };

  // ----- WALLET FUNCTIONS -----
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

  // listen accounts change
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
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, [hasMetaMask]);

  const value = {
    // app login
    isUserLoggedIn,
    appLogin,
    appLogout,

    // wallet
    walletAddress,
    isWalletConnected: !!walletAddress,
    connectWallet,
    disconnectWallet,
    hasMetaMask,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
