import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import axios from "axios"; 
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

const AuthContext = createContext(null);

// Vercel Backend URL — VITE_API_BASE_URL env variable se aata hai
// Local dev: http://localhost:5000/api/auth
// Production (Vercel): https://propertix-backend-eight.vercel.app/api/auth
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000") + "/api/auth";

export const AuthProvider = ({ children }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState({
    isAdmin: false,
    isSurveyor: false,
    isRegistrar: false,
    isGovtOfficer: false, // Added Govt Officer flag
    isOfficer: false
  });
  const [currentUser, setCurrentUser] = useState(null);

  // --- SECURE IDENTITY FETCH ---
  const fetchUserIdentity = async (account) => {
    try {
      if (!window.ethereum || !account) return null;
      const lowerAccount = account.toLowerCase();

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      // 1. BLOCKCHAIN SOURCE OF TRUTH
      const userStruct = await contract.users(account);
      const roleString = userStruct.role; 
      const isRegisteredOnBC = userStruct.isRegistered;

      if (!isRegisteredOnBC) return { isRegistered: false };

      // 2. DATABASE SYNC
      let dbUser = { name: "Verified Citizen", email: "Identity Encrypted" };
      try {
        const response = await axios.get(`${API_BASE_URL}/user/${lowerAccount}`);
        if (response.data) dbUser = response.data;
      } catch (err) {
        console.warn("🛡️ Security Note: Neon DB profile not synced.");
      }

      //  Updated Role Logic to include GOVT_OFFICER
      const isAdmin = roleString === "ADMIN";
      const isSurveyor = roleString === "SURVEYOR";
      const isRegistrar = roleString === "REGISTRAR";
      const isGovtOfficer = roleString === "GOVT_OFFICER"; //  Check for Govt Officer

      setRoleData({ 
        isAdmin, 
        isSurveyor, 
        isRegistrar,
        isGovtOfficer,
        isOfficer: isAdmin || isSurveyor || isRegistrar || isGovtOfficer //  Govt Officer is also an officer
      });

      const updatedUser = {
        name: dbUser.name || "Owner",
        email: dbUser.email || "",
        role: roleString,
        walletAddress: account, 
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${account}`
      };

      setCurrentUser(updatedUser);
      return { isRegistered: true, roleString };
    } catch (error) {
      console.error("❌ Critical Identity Error:", error);
      alert("Identity Fetch Error: " + (error.reason || error.message));
      return null;
    }
  };

  // PERSISTENT SESSION CHECK
  useEffect(() => {
    const initAuth = async () => {
      const isSessionActive = localStorage.getItem("loginSession");
      if (window.ethereum && isSessionActive === "active") {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          
          if (accounts.length > 0) {
            const address = accounts[0].address;
            setWalletAddress(address);
            const result = await fetchUserIdentity(address);
            if (result?.isRegistered) setIsUserLoggedIn(true);
          }
        } catch (err) {
          localStorage.removeItem("loginSession");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // --- SECURE LOGIN ---
  const loginWithRole = async (desiredRole) => {
    if (!window.ethereum) return alert("MetaMask required!"), false;
    setLoading(true);

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      
      const message = `PROPERTIX PROTOCOL LOGIN\n\nVerify wallet owner for role: ${desiredRole}\nTimestamp: ${Date.now()}`;
      await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      const identity = await fetchUserIdentity(address);

      if (!identity || !identity.isRegistered) {
        alert("❌ Identity not found on Ledger. Please register first.");
        setLoading(false);
        return false;
      }

      //  Role authorization check
      if (identity.roleString !== "ADMIN" && identity.roleString !== desiredRole) {
          alert(`⚠️ Restricted! Your assigned role is ${identity.roleString}`);
          setLoading(false);
          return false;
      }

      localStorage.setItem("loginSession", "active");
      setWalletAddress(address);
      setIsUserLoggedIn(true);
      setLoading(false);
      return true;

    } catch (error) {
      console.error("Login Error:", error);
      alert("Login Error Details: " + (error.reason || error.message));
      setLoading(false);
      return false;
    }
  };

  // --- CONNECT WALLET ---
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask required!");
      return null;
    }
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        const identity = await fetchUserIdentity(address);
        if (identity && identity.isRegistered) {
          setIsUserLoggedIn(true);
          localStorage.setItem("loginSession", "active");
        } else {
          alert("Wallet connected! However, identity is not registered on the ledger. Please register first.");
        }
        setLoading(false);
        return address;
      }
    } catch (error) {
      console.error("Connect Wallet Error:", error);
      alert("Failed to connect wallet.");
    }
    setLoading(false);
    return null;
  };

  const appLogout = () => {
    localStorage.removeItem("loginSession");
    setIsUserLoggedIn(false);
    setWalletAddress(null);
    setRoleData({ isAdmin: false, isSurveyor: false, isRegistrar: false, isGovtOfficer: false, isOfficer: false });
    setCurrentUser(null);
    window.location.href = "/login";
  };

  const value = {
    loading,
    isUserLoggedIn,
    walletAddress,
    isWalletConnected: !!walletAddress,
    connectWallet,
    userRole: currentUser?.role, // Adding userRole for easier access in App.jsx
    ...roleData,
    currentUser,
    loginWithRole,
    appLogout,
    refreshUser: () => fetchUserIdentity(walletAddress)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);