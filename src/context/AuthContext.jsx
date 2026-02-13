import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract } from "ethers";
import {
  PROPERTY_REGISTRY_ADDRESS,
  PROPERTY_REGISTRY_ABI,
} from "../blockchain/contractConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Roles State
  const [roleData, setRoleData] = useState({
    isAdmin: false,
    isSurveyor: false,
    isRegistrar: false,
    isOfficer: false
  });

  const [currentUser, setCurrentUser] = useState(null);

  // --- HELPER: Identify User from Blockchain ---
  const fetchUserIdentity = async (account) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const contract = new Contract(PROPERTY_REGISTRY_ADDRESS, PROPERTY_REGISTRY_ABI, provider);

      // User Details Fetch
      const userStruct = await contract.users(account);
      const roleString = userStruct.role; 
      const isRegistered = userStruct.isRegistered;

      // Role Boolean Setters
      const isAdmin = roleString === "ADMIN";
      const isSurveyor = roleString === "SURVEYOR";
      const isRegistrar = roleString === "REGISTRAR";
      const isOfficer = isAdmin || isSurveyor || isRegistrar;

      setRoleData({ isAdmin, isSurveyor, isRegistrar, isOfficer });

      setCurrentUser({
        name: userStruct.name,
        email: userStruct.email,
        role: roleString,
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${account}`
      });

      return { isRegistered, roleString };

    } catch (error) {
      console.error("❌ Error fetching identity:", error);
      return null;
    }
  };

  // --- INITIAL CHECK (Page Load) ---
  useEffect(() => {
    const initAuth = async () => {
      // 🛑 STRICT CHECK: Kya user ne Login kiya tha?
      // Agar 'loginSession' nahi hai, to hum auto-connect NAHI karenge.
      const isSessionActive = localStorage.getItem("loginSession");

      if (window.ethereum && isSessionActive === "active") {
        try {
            const provider = new BrowserProvider(window.ethereum);
            const accounts = await provider.listAccounts();
            
            if (accounts.length > 0) {
              const address = accounts[0].address;
              console.log("🔄 Auto-Restoring Session for:", address);
              setWalletAddress(address);
              
              const result = await fetchUserIdentity(address);
              if (result && result.isRegistered) {
                  setIsUserLoggedIn(true);
              }
            } else {
                // Agar MetaMask locked hai ya disconnected hai
                localStorage.removeItem("loginSession");
            }
        } catch (err) {
            console.error(err);
            localStorage.removeItem("loginSession");
        }
      }
      setLoading(false);
    };

    initAuth();

    // Account Changed = Force Logout
    if (window.ethereum) {
        window.ethereum.on("accountsChanged", () => {
            appLogout(); // Turant bahar phek do
        });
    }
  }, []);

  // --- MANUAL LOGIN FUNCTION ---
  const loginWithRole = async (desiredRole) => {
    if (!window.ethereum) return alert("MetaMask not found!");
    setLoading(true);

    try {
      // 1. Force Account Selection (Hamesha Puchega)
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length === 0) {
          setLoading(false);
          return false;
      }

      const address = accounts[0].address;
      
      // 2. Check Identity
      const identity = await fetchUserIdentity(address);

      if (!identity || !identity.isRegistered) {
        alert("❌ Wallet not registered! Please Register first.");
        setLoading(false);
        return false;
      }

      // 3. Role Mismatch Check
      if (desiredRole !== "ADMIN" && identity.roleString !== desiredRole) {
          alert(`⚠️ Access Denied! Wallet is registered as ${identity.roleString}`);
          setLoading(false);
          return false;
      }

      // ✅ SUCCESS: Set Session Flag
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

  // --- LOGOUT FUNCTION (The Cleaner) ---
  const appLogout = () => {
    // 🗑️ Clear Everything
    localStorage.removeItem("loginSession");
    setIsUserLoggedIn(false);
    setWalletAddress(null);
    setRoleData({ isAdmin: false, isSurveyor: false, isRegistrar: false, isOfficer: false });
    setCurrentUser(null);
    
    // Redirect
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
    appLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);