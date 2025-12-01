// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying GiftEscrowPausable contract...");

  const GiftEscrowPausable = await ethers.getContractFactory("GiftEscrowPausable");
  const giftEscrowPausable = await GiftEscrowPausable.deploy();

  await giftEscrowPausable.waitForDeployment();

  console.log(
    `GiftEscrowPausable deployed to ${await giftEscrowPausable.getAddress()}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
