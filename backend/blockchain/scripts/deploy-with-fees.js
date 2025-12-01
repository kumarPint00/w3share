const hre = require("hardhat");

async function main() {
  console.log("Deploying GiftEscrowWithFees with percentage-based fees...");

  // Deploy GiftEscrowWithFees (no price oracle needed!)
  const GiftEscrowWithFees = await hre.ethers.getContractFactory("GiftEscrowWithFees");
  const giftEscrow = await GiftEscrowWithFees.deploy();
  await giftEscrow.waitForDeployment();

  console.log("GiftEscrowWithFees deployed to:", await giftEscrow.getAddress());

  // Verify configuration
  console.log("Fee recipient:", await giftEscrow.FEE_RECIPIENT());
  console.log("Fee percentage:", await giftEscrow.FEE_PERCENTAGE(), "basis points (", (await giftEscrow.FEE_PERCENTAGE()) / 100, "%)");
  console.log("Basis points:", await giftEscrow.BASIS_POINTS());

  console.log("\n🎉 Deployment completed!");
  console.log("📋 Contract address:");
  console.log("  GiftEscrowWithFees:", await giftEscrow.getAddress());
  console.log("💰 Fee recipient:", "0xB8552A57ca4fA5fE2f14f32199dBA62EA8276c08");
  console.log("💸 Fee structure: 1% of gift amount on creation + 1% on claiming = 2% total");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });