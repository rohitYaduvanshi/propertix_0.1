import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { ParticleAuthModule, ParticleProvider } from "@biconomy/particle-auth";
import { BiconomySmartAccountV2, createSmartAccountClient } from "@biconomy/account";
import { ECDSAOwnershipValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE } from "@biconomy/modules";
import { PaymasterMode } from "@biconomy/paymaster";

const SmartAccountContext = createContext();

export const useSmartAccount = () => useContext(SmartAccountContext);

export const SmartAccountProvider = ({ children }) => {
  const [smartAccount, setSmartAccount] = useState(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // 1. Particle Network Config (MetaMask Bypass)
  const particle = new ParticleAuthModule.ParticleNetwork({
    projectId: "963a1fbe-6e9f-42b8-a89a-f05dba1fb052", // Particle Dashboard se lein
    clientKey: "cbq1cJFHtXvQM67pQJlrLEaKcaQef8RTIS8OBGvu",
    appId: "sHTXqMnIyuu5qFQG4lAmENZmAD6NmSm49nXYGNlS",
    chainName: "polygon",
    chainId: 80002, // Amoy Testnet
  });

  const loginWithSocial = async () => {
    setLoading(true);
    try {
      // User ko Google/Email login ka popup dikhega (Web2 Experience)
      const user = await particle.auth.login();
      setUserInfo(user);

      const particleProvider = new ParticleProvider(particle.auth);
      const ethersProvider = new ethers.providers.Web3Provider(particleProvider);
      
      await initializeSmartAccount(ethersProvider);
    } catch (error) {
      console.error("Social Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSmartAccount = async (provider) => {
    try {
      const signer = provider.getSigner();
      
      // Biconomy Modules Setup
      const ownerShipModule = await ECDSAOwnershipValidationModule.create({
        signer: signer,
        moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE
      });

      // Smart Account Client Creation
      const biconomySmartAccount = await createSmartAccountClient({
        signer: signer,
        biconomyPaymasterApiKey: "Ymee_NjT46KsFmM4PQg3tzArThf", // Biconomy Dashboard se lein
        bundlerUrl: "https://bundler.biconomy.io/api/v2/80002/mee_NjT46KsFmM4PQg3tzArThf", // Biconomy Dashboard se lein
        defaultValidationModule: ownerShipModule,
        activeValidationModule: ownerShipModule,
      });

      const address = await biconomySmartAccount.getAccountAddress();
      setSmartAccount(biconomySmartAccount);
      setSmartAccountAddress(address);
      
      console.log("Smart Account Ready:", address);
    } catch (error) {
      console.error("Smart Account Initialization Error:", error);
    }
  };

  const logout = async () => {
    await particle.auth.logout();
    setSmartAccount(null);
    setSmartAccountAddress("");
    setUserInfo(null);
  };

  return (
    <SmartAccountContext.Provider value={{
      smartAccount,
      smartAccountAddress,
      loading,
      userInfo,
      loginWithSocial,
      logout
    }}>
      {children}
    </SmartAccountContext.Provider>
  );
};