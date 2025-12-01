import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('GiftEscrowPausable', function () {
  let giftEscrowPausable: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let testToken: any;

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the TestToken for testing
    const TestToken = await ethers.getContractFactory('TestToken');
    testToken = await TestToken.deploy('TestToken', 'TTK');
    await testToken.waitForDeployment();

    // Deploy the GiftEscrowPausable contract
    const GiftEscrowPausable = await ethers.getContractFactory('GiftEscrowPausable');
    giftEscrowPausable = await GiftEscrowPausable.deploy();
    await giftEscrowPausable.waitForDeployment();
  });

  it('deploys and has an address', async () => {
    const addr = await giftEscrowPausable.getAddress();
    expect(addr).to.properAddress;
  });

  it('initializes with correct values', async () => {
    const [isPaused, activeUntil, isActive] = await giftEscrowPausable.getContractStatus();
    expect(isPaused).to.be.false;
    expect(isActive).to.be.true;
    expect(activeUntil).to.be.gt(Math.floor(Date.now() / 1000));
  });

  it('allows owner to pause and unpause', async () => {
    await giftEscrowPausable.pause();
    let [isPaused] = await giftEscrowPausable.getContractStatus();
    expect(isPaused).to.be.true;

    await giftEscrowPausable.unpause();
    [isPaused] = await giftEscrowPausable.getContractStatus();
    expect(isPaused).to.be.false;
  });

  it('prevents non-owners from pausing', async () => {
    await expect(giftEscrowPausable.connect(user1).pause())
      .to.be.reverted;
  });

  it('allows owner to update timer', async () => {
    const initialStatus = await giftEscrowPausable.getContractStatus();
    const initialTimer = initialStatus[1];
    
    // Extend by 30 days
    await giftEscrowPausable.extendActiveTimer(30);
    
    const newStatus = await giftEscrowPausable.getContractStatus();
    const newTimer = newStatus[1];
    
    // Should be extended by approximately 30 days (2,592,000 seconds)
    expect(newTimer).to.be.closeTo(initialTimer.add(30 * 86400), 10);
  });

  it('allows creating and claiming gifts when not paused', async () => {
    // Mint some tokens to user1
    await testToken.mint(user1.address, ethers.parseEther("100"));
    
    // Approve the escrow contract
    const escrowAddress = await giftEscrowPausable.getAddress();
    await testToken.connect(user1).approve(escrowAddress, ethers.parseEther("100"));
    
    // Create a gift
    const tokenAddress = await testToken.getAddress();
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes("secretcode123"));
    
    const tx = await giftEscrowPausable.connect(user1).lockGiftV2(
      0, // ERC20
      tokenAddress,
      0, // tokenId not used for ERC20
      ethers.parseEther("10"), 
      Math.floor(Date.now() / 1000) + 86400, // 1 day expiry
      "Happy Birthday!",
      codeHash
    );
    
    const receipt = await tx.wait();
    const giftId = 0; // First gift should be ID 0
    
    // Check gift was created
    const [exists, claimed, sender, expiryTimestamp] = await giftEscrowPausable.getGiftStatus(giftId);
    expect(exists).to.be.true;
    expect(claimed).to.be.false;
    expect(sender).to.equal(user1.address);
    
    // Claim the gift
    const balanceBefore = await testToken.balanceOf(user2.address);
    await giftEscrowPausable.connect(user2).claimGiftWithCode(giftId, "secretcode123");
    const balanceAfter = await testToken.balanceOf(user2.address);
    
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("10"));
  });
  
  it('prevents gift operations when paused', async () => {
    // Pause the contract
    await giftEscrowPausable.pause();
    
    // Mint some tokens to user1
    await testToken.mint(user1.address, ethers.parseEther("100"));
    
    // Approve the escrow contract
    const escrowAddress = await giftEscrowPausable.getAddress();
    await testToken.connect(user1).approve(escrowAddress, ethers.parseEther("100"));
    
    // Try to create a gift when paused
    const tokenAddress = await testToken.getAddress();
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes("secretcode456"));
    
    await expect(giftEscrowPausable.connect(user1).lockGiftV2(
      0, // ERC20
      tokenAddress,
      0, // tokenId not used for ERC20
      ethers.parseEther("10"), 
      Math.floor(Date.now() / 1000) + 86400, // 1 day expiry
      "Happy Birthday!",
      codeHash
    )).to.be.reverted;
    
    // Unpause for further tests
    await giftEscrowPausable.unpause();
  });
  
  it('allows setting a specific end date', async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 180; // 180 days in the future
    await giftEscrowPausable.setActiveTimerEnd(futureTimestamp);
    
    const [,activeUntil,] = await giftEscrowPausable.getContractStatus();
    expect(activeUntil).to.equal(futureTimestamp);
  });
  
  it('disables operations after contract timer expires', async () => {
    // Set the timer to expire immediately (5 seconds in the past)
    const expiredTimestamp = Math.floor(Date.now() / 1000) - 5;
    await giftEscrowPausable.setActiveTimerEnd(expiredTimestamp);
    
    // Mint some tokens to user1
    await testToken.mint(user1.address, ethers.parseEther("100"));
    
    // Approve the escrow contract
    const escrowAddress = await giftEscrowPausable.getAddress();
    await testToken.connect(user1).approve(escrowAddress, ethers.parseEther("100"));
    
    // Try to create a gift when contract is inactive
    const tokenAddress = await testToken.getAddress();
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes("secretcode789"));
    
    await expect(giftEscrowPausable.connect(user1).lockGiftV2(
      0, // ERC20
      tokenAddress,
      0, // tokenId not used for ERC20
      ethers.parseEther("10"), 
      Math.floor(Date.now() / 1000) + 86400, // 1 day expiry
      "Happy Birthday!",
      codeHash
    )).to.be.revertedWith("Contract operation period has ended");
    
    // Reset the timer for future tests
    await giftEscrowPausable.setActiveTimerEnd(Math.floor(Date.now() / 1000) + 86400);
  });
});
