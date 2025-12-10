import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== MAINNET DEPLOYMENT ===");
  
  if (!deployer) {
    console.error("❌ No deployer found! Check your MAINNET_PRIVATE_KEY in .env");
    process.exit(1);
  }
  
  console.log("Deployer address:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");
  
  const network = await ethers.provider.getNetwork();
  const isMainnet = network.chainId === 1n;
  const requiredBalance = isMainnet ? "0.05" : "0.01";
  
  if (balance < ethers.parseEther(requiredBalance)) {
    console.error(`❌ Insufficient balance! Need at least ${requiredBalance} ${isMainnet ? 'ETH' : 'MATIC'} for deployment`);
    console.log(`💡 Tip: ${isMainnet ? 'Try deploying to Polygon instead (much cheaper!)' : 'Get some MATIC from a faucet or exchange'}`);
    process.exit(1);
  }
  
  // Get current gas price
  const gasPrice = (await ethers.provider.getFeeData()).gasPrice;
  console.log("Current gas price:", ethers.formatUnits(gasPrice!, "gwei"), "gwei");
  
  console.log("\n🚀 Deploying GiftEscrow to Mainnet...");
  
  const Factory = await ethers.getContractFactory("GiftEscrow");
  const contract = await Factory.deploy({
    gasLimit: 3000000, // Set reasonable gas limit
  });
  
  console.log("⏳ Waiting for deployment...");
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("✅ GiftEscrow deployed to:", address);
  
  // Wait for a few confirmations
  console.log("⏳ Waiting for 5 confirmations...");
  await contract.deploymentTransaction()?.wait(5);
  
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Contract Address:", address);
  console.log("Network: Ethereum Mainnet");
  console.log("Explorer:", `https://etherscan.io/address/${address}`);
  console.log("\n📝 Update your .env file:");
  console.log(`GIFT_ESCROW_ADDRESS=${address}`);
  console.log(`GIFT_ESCROW_CHAIN_ID=1`);
  console.log(`GIFT_ESCROW_RPC_URL=${process.env.MAINNET_RPC}`);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode =1;
});