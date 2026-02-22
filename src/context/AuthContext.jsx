import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import axios from "axios"; 
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

const AuthContext = createContext(null);

//Backend Endpoint
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

  // --- SECURE IDENTITY FETCH (Blockchain + Neon DB) ---
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

      // 2. DATABASE SYNC (Fetching Profile Details)
      let dbUser = { name: "Verified Citizen", email: "Identity Encrypted" };
      try {
        const response = await axios.get(`${API_BASE_URL}/user/${lowerAccount}`);
        if (response.data) dbUser = response.data;
      } catch (err) {
        console.warn("🛡️ Security Note: Neon DB profile not synced. Relying on Blockchain records.");
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
      return null;
    }
  };

  //  PERSISTENT SESSION CHECK ---
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

  // ---SECURE LOGIN WITH SIGNATURE ---
  const loginWithRole = async (desiredRole) => {
    if (!window.ethereum) return alert("MetaMask required!"), false;
    setLoading(true);

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      
      // CRYPTOGRAPHIC PROOF (Sign Message)
      const message = `PROPERTIX PROTOCOL LOGIN\n\nVerify wallet owner for role: ${desiredRole}\nTimestamp: ${Date.now()}`;
      await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      const identity = await fetchUserIdentity(address);

      if (!identity || !identity.isRegistered) {
        alert("❌ Identity not found on Ledger. Please register first.");
        return setLoading(false), false;
      }

      // Role authorization
      if (identity.roleString !== "ADMIN" && identity.roleString !== desiredRole) {
          alert(`⚠️ Restricted! Your assigned role is ${identity.roleString}`);
          return setLoading(false), false;
      }

      localStorage.setItem("loginSession", "active");
      setWalletAddress(address);
      setIsUserLoggedIn(true);
      setLoading(false);
      return true;

    } catch (error) {
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