import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import axios from "axios"; 
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

const AuthContext = createContext(null);

// ✅ Railway Backend URL (Updated from localhost)
const API_BASE_URL = "https://propertixbackend-production.up.railway.app/api/auth";

export const AuthProvider = ({ children }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState({
    isAdmin: false,
    isSurveyor: false,
    isRegistrar: false,
    isOfficer: false
  });
  const [currentUser, setCurrentUser] = useState(null);

  // --- HELPER: Identify User (Blockchain + Neon DB Sync) ---
  const fetchUserIdentity = async (account) => {
    try {
      if (!window.ethereum || !account) return null;

      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      // 1. BLOCKCHAIN CHECK
      const userStruct = await contract.users(account);
      const roleString = userStruct.role; 
      const isRegisteredOnBC = userStruct.isRegistered;

      if (!isRegisteredOnBC) return { isRegistered: false };

      // 2. NEON DB (PostgreSQL) CHECK - Fetch real Name and Email
      let dbUser = { name: "Citizen", email: "No Email Linked" };
      try {
        // वॉलेट एड्रेस को lowercase में भेजें ताकि DB मैचिंग में गलती न हो
        const response = await axios.get(`${API_BASE_URL}/user/${account.toLowerCase()}`);
        if (response.data) {
            dbUser = response.data;
        }
      } catch (err) {
        console.warn("⚠️ User profile not found in Neon DB. Ensure registration was successful.");
      }

      const isAdmin = roleString === "ADMIN";
      const isSurveyor = roleString === "SURVEYOR";
      const isRegistrar = roleString === "REGISTRAR";

      setRoleData({ 
        isAdmin, 
        isSurveyor, 
        isRegistrar, 
        isOfficer: isAdmin || isSurveyor || isRegistrar 
      });

      // ✅ Setting the real name and email from Database
      const updatedUser = {
        name: dbUser.name || "Verified User",
        email: dbUser.email || "",
        role: roleString,
        walletAddress: account, 
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${account}`
      };

      setCurrentUser(updatedUser);
      return { isRegistered: true, roleString };
    } catch (error) {
      console.error("❌ Error fetching identity:", error);
      return null;
    }
  };

  // --- AUTO LOGIN ---
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
            if (result?.isRegistered) {
                setIsUserLoggedIn(true);
            }
          }
        } catch (err) {
          console.error("Auto-login error:", err);
          localStorage.removeItem("loginSession");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // --- LOGIN LOGIC ---
  const loginWithRole = async (desiredRole) => {
    if (!window.ethereum) {
        alert("MetaMask not found!");
        return false;
    }
    setLoading(true);

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      
      // डिजिटल सिग्नेचर (FREE & SECURE)
      const message = `Propertix Login Verification\n\nRole: ${desiredRole}\nWallet: ${address}\nTime: ${new Date().toLocaleString()}`;
      await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      const identity = await fetchUserIdentity(address);

      if (!identity || !identity.isRegistered) {
        alert("❌ Wallet not registered in our system. Please Register first.");
        setLoading(false);
        return false;
      }

      // Role Check
      if (identity.roleString !== "ADMIN" && identity.roleString !== desiredRole) {
          alert(`⚠️ Access Denied! Your assigned role is ${identity.roleString}`);
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
      setLoading(false);
      return false;
    }
  };

  const appLogout = () => {
    localStorage.removeItem("loginSession");
    setIsUserLoggedIn(false);
    setWalletAddress(null);
    setRoleData({ isAdmin: false, isSurveyor: false, isRegistrar: false, isOfficer: false });
    setCurrentUser(null);
    window.location.href = "/login";
  };

  const value = {
    loading,
    isUserLoggedIn,
    walletAddress,
    isWalletConnected: !!walletAddress,
    ...roleData,
    currentUser,
    loginWithRole,
    appLogout,
    refreshUser: () => fetchUserIdentity(walletAddress)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);