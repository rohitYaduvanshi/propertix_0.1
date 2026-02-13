// ✅ Step 1: JSON file import karein (Ensure ye file 'src/blockchain/' folder me ho)
import PropertyRegistry from "./PropertyRegistry.json"; 

// ✅ Step 2: Naya Contract Address 
export const PROPERTY_REGISTRY_ADDRESS = "0xf77ebA56cE7A39592C2E6404D99A2Db1f91b7754";

// ✅ Step 3: ABI ab direct JSON file se aayega (No manual copy-paste needed)
export const PROPERTY_REGISTRY_ABI = PropertyRegistry.abi;