import { createContext, useContext, useState, useEffect } from "react";
import { createSmartAccountClient } from "@biconomy/account";
import { ethers } from "ethers";

const SmartAccountContext = createContext();

export const SmartAccountProvider = ({ children }) => {
    const [smartAccount, setSmartAccount] = useState(null);
    const [smartAccountAddress, setSmartAccountAddress] = useState("");
    const [isInitializing, setIsInitializing] = useState(false);

    // Biconomy Smart Account ko initialize karne ka function
    const initializeSmartAccount = async (externalProvider) => {
        if (!externalProvider) return;
        
        setIsInitializing(true);
        try {
            // 1. Ethers provider aur signer setup karna
            const provider = new ethers.providers.Web3Provider(externalProvider);
            const signer = provider.getSigner();

            // 2. Biconomy Smart Account Client create karna
            // Hum .env se Bundler URL aur API Key uthayenge
            const biconomySmartAccount = await createSmartAccountClient({
                signer: signer,
                bundlerUrl: import.meta.env.VITE_BICONOMY_BUNDLER_URL,
                biconomyApiKey: import.meta.env.VITE_BICONOMY_API_KEY,
                paymasterServiceData: { mode: "SPONSORED" }, // Testnet par auto-sponsored hai
            });

            // 3. User ka unique Smart Wallet address nikalna
            const address = await biconomySmartAccount.getAccountAddress();
            
            setSmartAccount(biconomySmartAccount);
            setSmartAccountAddress(address);
            
            console.log("Propertix Smart Wallet Ready:", address);
        } catch (error) {
            console.error("Smart Account initialization failed:", error);
        } finally {
            setIsInitializing(false);
        }
    };

    // Logout logic (State clear karne ke liye)
    const logoutSmartAccount = () => {
        setSmartAccount(null);
        setSmartAccountAddress("");
    };

    return (
        <SmartAccountContext.Provider 
            value={{ 
                smartAccount, 
                smartAccountAddress, 
                initializeSmartAccount, 
                logoutSmartAccount,
                isInitializing 
            }}
        >
            {children}
        </SmartAccountContext.Provider>
    );
};

// Custom hook taaki hum baaki pages mein isse use kar sakein
export const useSmartAccount = () => {
    const context = useContext(SmartAccountContext);
    if (!context) {
        throw new Error("useSmartAccount must be used within a SmartAccountProvider");
    }
    return context;
};
