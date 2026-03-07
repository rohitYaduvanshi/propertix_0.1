// Step 1: JSON file import (Ensure ye file 'src/blockchain/' folder me ho)
import PropertyRegistry from "./PropertyRegistry.json"; 

// Step 2: Naya Contract Address 
export const PROPERTY_REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Step 3: ABI ab direct JSON file se aayega (No manual copy-paste needed)
export const PROPERTY_REGISTRY_ABI = PropertyRegistry.abi;