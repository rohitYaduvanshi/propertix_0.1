require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); 

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20", 
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, 
    },
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_URL, 
      accounts: [process.env.PRIVATE_KEY] 
    }
  },
};