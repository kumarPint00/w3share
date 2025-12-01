import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('GiftEscrow', function () {
  let giftEscrow: any;

  before(async () => {
    const Factory = await ethers.getContractFactory('GiftEscrow');
    giftEscrow = await Factory.deploy();
    await giftEscrow.waitForDeployment();
  });

  it('deploys and has an address', async () => {
    const addr = await giftEscrow.getAddress();
    expect(addr).to.properAddress;
  });
});
