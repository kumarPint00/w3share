import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await ethers.getContractFactory("GiftEscrow");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("GiftEscrow deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
