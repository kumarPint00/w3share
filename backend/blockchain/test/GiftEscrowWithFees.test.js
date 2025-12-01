const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GiftEscrowWithFees", function () {
  let giftEscrow, priceOracle, mockToken;
  let owner, sender, claimer, feeRecipient;
  
  const FEE_RECIPIENT = "0xB8552A57ca4fA5fE2f14f32199dBA62EA8276c08";
  const FEE_USD = ethers.parseUnits("1", 6); // $1 in 6 decimals

  beforeEach(async function () {
    [owner, sender, claimer] = await ethers.getSigners();
    
    // Get the fee recipient address
    feeRecipient = await ethers.getImpersonatedSigner(FEE_RECIPIENT);
    
    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("TestToken");
    mockToken = await MockToken.deploy("Mock Token", "MOCK", 18);
    await mockToken.waitForDeployment();
    
    // Deploy GiftEscrowWithFees (no oracle needed for percentage fees)
    const GiftEscrowWithFees = await ethers.getContractFactory("GiftEscrowWithFees");
    giftEscrow = await GiftEscrowWithFees.deploy();
    await giftEscrow.waitForDeployment();
    
    // Mint tokens to sender and claimer
    await mockToken.mint(sender.address, ethers.parseEther("1000"));
    await mockToken.mint(claimer.address, ethers.parseEther("1000"));
  });

  it("Should collect 1% fee on gift creation", async function () {
    const tokenAmount = ethers.parseEther("100"); // 100 tokens
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes("secret123"));
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400; // 1 day
    
    // Calculate expected fee: 1% of 100 tokens = 1 token
    const expectedFee = ethers.parseEther("1");
    
    // Approve tokens for gift and fee
    await mockToken.connect(sender).approve(
      await giftEscrow.getAddress(), 
      tokenAmount + expectedFee
    );
    
    const initialBalance = await mockToken.balanceOf(FEE_RECIPIENT);
    
    // Create gift (fee collected silently)
    await giftEscrow.connect(sender).lockGiftV2(
      0, // ERC20
      await mockToken.getAddress(),
      0, // tokenId
      tokenAmount, // amount
      expiryTimestamp,
      "Test gift",
      codeHash
    );
    
    // Check fee was transferred
    const finalBalance = await mockToken.balanceOf(FEE_RECIPIENT);
    expect(finalBalance - initialBalance).to.equal(expectedFee);
  });

  it("Should collect 1% fee on gift claim", async function () {
    const tokenAmount = ethers.parseEther("100"); // 100 tokens
    const code = "secret123";
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400; // 1 day
    
    const creationFee = ethers.parseEther("1"); // 1% of 100 tokens
    const claimFee = ethers.parseEther("1"); // 1% of 100 tokens
    
    // Approve and create gift
    await mockToken.connect(sender).approve(
      await giftEscrow.getAddress(), 
      tokenAmount + creationFee
    );
    
    await giftEscrow.connect(sender).lockGiftV2(
      0, // ERC20
      await mockToken.getAddress(),
      0, // tokenId
      tokenAmount, // amount
      expiryTimestamp,
      "Test gift",
      codeHash
    );
    
    // Approve claimer's fee
    await mockToken.connect(claimer).approve(
      await giftEscrow.getAddress(), 
      claimFee
    );
    
    const initialBalance = await mockToken.balanceOf(FEE_RECIPIENT);
    
    // Claim gift (fee collected silently)
    await giftEscrow.connect(claimer).claimGiftWithCode(0, code);
    
    // Check fee was transferred (only claim fee, creation fee was already collected)
    const finalBalance = await mockToken.balanceOf(FEE_RECIPIENT);
    expect(finalBalance - initialBalance).to.equal(claimFee);
  });

  it("Should handle small amounts correctly", async function () {
    const tokenAmount = ethers.parseEther("1"); // 1 token
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes("secret123"));
    const expiryTimestamp = Math.floor(Date.now() / 1000) + 86400;
    
    // Calculate expected fee: 1% of 1 token = 0.01 tokens
    const expectedFee = ethers.parseEther("0.01");
    
    await mockToken.connect(sender).approve(
      await giftEscrow.getAddress(), 
      tokenAmount + expectedFee
    );
    
    const initialBalance = await mockToken.balanceOf(FEE_RECIPIENT);
    
    // Create gift with small amount
    await giftEscrow.connect(sender).lockGiftV2(
      0, // ERC20
      await mockToken.getAddress(),
      0, // tokenId
      tokenAmount,
      expiryTimestamp,
      "Small gift",
      codeHash
    );
    
    // Check fee was transferred correctly
    const finalBalance = await mockToken.balanceOf(FEE_RECIPIENT);
    expect(finalBalance - initialBalance).to.equal(expectedFee);
  });
});