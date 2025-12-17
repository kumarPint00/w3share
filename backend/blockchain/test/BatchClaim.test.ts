import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('GiftEscrow batch claim', function () {
  let giftEscrow: any;
  let owner: any;
  let sender: any;
  let claimer: any;
  let testToken: any;

  before(async () => {
    [owner, sender, claimer] = await ethers.getSigners();

    // Deploy TestToken
    const TestToken = await ethers.getContractFactory('TestToken');
    testToken = await TestToken.deploy('TestToken', 'TTK');
    await testToken.waitForDeployment();

    const GiftEscrow = await ethers.getContractFactory('GiftEscrow');
    giftEscrow = await GiftEscrow.deploy();
    await giftEscrow.waitForDeployment();
  });

  it('allows claiming multiple gifts in one tx with code', async () => {
    // Mint and approve
    await testToken.mint(sender.address, ethers.parseEther('100'));
    await testToken.connect(sender).approve(await giftEscrow.getAddress(), ethers.parseEther('100'));

    const code = 'MULTI123';
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes(code));
    const expiry = Math.floor(Date.now() / 1000) + 86400;

    // Create two gifts
    await giftEscrow.connect(sender).lockGiftV2(
      0, // ERC20
      await testToken.getAddress(),
      0,
      ethers.parseEther('10'),
      expiry,
      'gift1',
      codeHash
    );

    await giftEscrow.connect(sender).lockGiftV2(
      0,
      await testToken.getAddress(),
      0,
      ethers.parseEther('15'),
      expiry,
      'gift2',
      codeHash
    );

    // Balances before
    const before = await testToken.balanceOf(claimer.address);

    // Claim both in one tx
    await giftEscrow.connect(claimer).claimMultipleWithCode([0,1], code);

    const after = await testToken.balanceOf(claimer.address);
    expect(after - before).to.equal(ethers.parseEther('25'));

    // Check both gifts marked claimed
    const s0 = await giftEscrow.getGiftStatus(0);
    const s1 = await giftEscrow.getGiftStatus(1);
    expect(s0[1]).to.be.true; // claimed
    expect(s1[1]).to.be.true;
  });
});
