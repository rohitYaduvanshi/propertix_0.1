// Step 1: JSON file import (Ensure ye file 'src/blockchain/' folder me ho)
import PropertyRegistry from "./PropertyRegistry.json"; 

// Step 2: Naya Contract Address 
export const PROPERTY_REGISTRY_ADDRESS = "0x854F3Cc65926333397d70E611160d2c1f99A2691";

// Step 3: ABI ab direct JSON file se aayega (No manual copy-paste needed)
export const PROPERTY_REGISTRY_ABI = PropertyRegistry.abi;