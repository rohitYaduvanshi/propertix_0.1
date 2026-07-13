const hre = require("hardhat");

async function main() {
  const PropertyRegistry = await hre.ethers.getContractFactory(
    "PropertyRegistry"
  );

  // deploy contract
  const registry = await PropertyRegistry.deploy();

  // Hardhat + ethers v6 style
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("PropertyRegistry deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
