// ✅ Step 1: JSON file import karein (Ensure ye file 'src/blockchain/' folder me ho)
import PropertyRegistry from "./PropertyRegistry.json"; 

// ✅ Step 2: Naya Contract Address 
export const PROPERTY_REGISTRY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// ✅ Step 3: ABI ab direct JSON file se aayega (No manual copy-paste needed)
export const PROPERTY_REGISTRY_ABI = PropertyRegistry.abi;