import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // on public networks the hardhat provider only exposes the deployer key,
  // so create a fresh wallet as the recipient and top it up using the deployer.
  const provider = ethers.provider;
  const recipient = ethers.Wallet.createRandom().connect(provider);
  console.log("Recipient (new):", recipient.address);
  // send a bit of ETH so recipient can submit transactions
  const topUp = ethers.parseEther("0.05");
  const tx0 = await deployer.sendTransaction({ to: recipient.address, value: topUp });
  await tx0.wait();
  console.log(`Topped up recipient with ${topUp.toString()} wei`);

  const Factory = await ethers.getContractFactory("GiftEscrow", deployer);
  // address from previous deploy on sepolia
  const address = "0x9664f4AB5E63bb2FD183f4AFD21e44d53d8efb9d";
  const contract = Factory.attach(address);

  // generate a secret code
  const code = "TEST-CODE-1234567890abcdef";
  const codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
  console.log("Code hash", codeHash);

  // create gift pack
  const tx1 = await contract.connect(deployer).createGiftPack("hello test", codeHash);
  await tx1.wait();
  console.log("Pack created");

  // add some ETH asset (send 0.01 ether)
  const assetTypeETH = 2; // ETH enum value
  const tx2 = await contract.connect(deployer).addAssetToGiftPack(codeHash, assetTypeETH, ethers.ZeroAddress, 0, ethers.parseEther("0.01"), { value: ethers.parseEther("0.01") });
  await tx2.wait();
  console.log("Added ETH asset");

  // lock gift pack
  const tx3 = await contract.connect(deployer).lockGiftPack(codeHash);
  await tx3.wait();
  console.log("Locked gift pack");

  // recipient commits claim
  const commitHash = ethers.keccak256(ethers.concat([ethers.toUtf8Bytes(code), ethers.getAddress(recipient.address)]));
  const tx4 = await contract.connect(recipient).commitClaim(commitHash);
  await tx4.wait();
  const commitBlock = await ethers.provider.getBlockNumber();
  console.log("Commitment made at block", commitBlock);

  // wait for at least one new block to be mined on Sepolia
  while ((await ethers.provider.getBlockNumber()) <= commitBlock) {
    console.log("Waiting for next block...");
    await new Promise((res) => setTimeout(res, 5000));
  }

  // reveal
  const tx5 = await contract.connect(recipient).revealClaim(codeHash, code);
  await tx5.wait();
  console.log("Reveal and claim executed");

  // verify ETH balance change
  const bal = await ethers.provider.getBalance(recipient.address);
  console.log("Recipient balance after claim", bal.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});