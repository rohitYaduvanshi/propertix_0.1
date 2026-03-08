import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";
import { ParticleAuthModule, ParticleProvider } from "@biconomy/particle-auth";
import { createSmartAccountClient } from "@biconomy/account";
import { ECDSAOwnershipValidationModule, DEFAULT_ECDSA_OWNERSHIP_MODULE } from "@biconomy/modules";

const SmartAccountContext = createContext();
export const useSmartAccount = () => useContext(SmartAccountContext);

export const SmartAccountProvider = ({ children }) => {
  const [smartAccount, setSmartAccount] = useState(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLocalhost, setIsLocalhost] = useState(true); // Prototype ke liye true rakhein

  const particle = new ParticleAuthModule.ParticleNetwork({
    projectId: "963a1fbe-6e9f-42b8-a89a-f05dba1fb052", 
    clientKey: "cbq1cJFHtXvQM67pQJlrLEaKcaQef8RTIS8OBGvu",
    appId: "sHTXqMnIyuu5qFQG4lAmENZmAD6NmSm49nXYGNlS",
    chainName: "polygon",
    chainId: 80002, 
  });

  const loginWithSocial = async () => {
    setLoading(true);
    try {
      // Localhost Prototype Testing logic [cite: 2026-03-01]
      if (isLocalhost) {
        const localProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
        const signer = localProvider.getSigner(0); // Hardhat ka pehla account [cite: 2026-03-01]
        const address = await signer.getAddress();
        
        setSmartAccount(signer); // Localhost par signer hi smart account ki tarah kaam karega
        setSmartAccountAddress(address);
        setUserInfo({ name: "Local Tester", email: "test@localhost.com" });
        console.log("Localhost Mock Login Ready:", address);
      } else {
        // Asli Amoy/Biconomy Logic [cite: 2026-01-24]
        const user = await particle.auth.login();
        setUserInfo(user);
        const particleProvider = new ParticleProvider(particle.auth);
        const ethersProvider = new ethers.providers.Web3Provider(particleProvider);
        await initializeSmartAccount(ethersProvider);
      }
    } catch (error) {
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializeSmartAccount = async (provider) => {
    try {
      const signer = provider.getSigner();
      const ownerShipModule = await ECDSAOwnershipValidationModule.create({
        signer: signer,
        moduleAddress: DEFAULT_ECDSA_OWNERSHIP_MODULE
      });

      const biconomySmartAccount = await createSmartAccountClient({
        signer: signer,
        biconomyPaymasterApiKey: "Ymee_NjT46KsFmM4PQg3tzArThf",
        bundlerUrl: "https://bundler.biconomy.io/api/v2/80002/mee_NjT46KsFmM4PQg3tzArThf",
        defaultValidationModule: ownerShipModule,
      });

      const address = await biconomySmartAccount.getAccountAddress();
      setSmartAccount(biconomySmartAccount);
      setSmartAccountAddress(address);
    } catch (error) {
      console.error("Smart Account Initialization Error:", error);
    }
  };

  const logout = async () => {
    if (!isLocalhost) await particle.auth.logout();
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
      logout,
      isLocalhost
    }}>
      {children}
    </SmartAccountContext.Provider>
  );
};