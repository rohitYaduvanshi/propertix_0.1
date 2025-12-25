// src/blockchain/contractConfig.js
export const PROPERTY_REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const PROPERTY_REGISTRY_ABI = [
  // yaha Hardhat artifact se abi array paste karo
  {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "propertyHash",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "registrar",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],  
      "name": "PropertyRegistered",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "propertyHash",
          "type": "bytes32"
        }
      ],
      "name": "addProperty",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "propertyHash",
          "type": "bytes32"
        }
      ],
      "name": "checkProperty",
      "outputs": [
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        },
        {
          "internalType": "address",
          "name": "registrar",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "registeredAt",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "propertyExists",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
];
