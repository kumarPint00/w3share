#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { ethers } = require('ethers');
const GiftEscrowArtifact = require('../contracts/abi/GiftEscrow.json');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Searching for expired LOCKED gift packs...');
    const expired = await prisma.giftPack.findMany({ where: { status: 'LOCKED', expiry: { lt: new Date() } } });
    if (!expired || expired.length === 0) {
      console.log('No expired LOCKED gift packs found.');
      return process.exit(0);
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_BASE_RPC);
    const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.GIFT_ESCROW_ADDRESS, GiftEscrowArtifact.abi, signer);

    // Collect on-chain gift ids (supports giftIdOnChain and giftIdsOnChain JSON)
    const ids = [];
    for (const p of expired) {
      if (typeof p.giftIdOnChain === 'number') ids.push(p.giftIdOnChain);
      if (p.giftIdsOnChain) {
        try {
          const parsed = JSON.parse(p.giftIdsOnChain);
          if (Array.isArray(parsed)) parsed.forEach(v => typeof v === 'number' && ids.push(v));
        } catch (err) {
          console.warn('Failed to parse giftIdsOnChain for', p.id, err.message);
        }
      }
    }

    if (ids.length === 0) {
      console.log('No on-chain gift IDs found for expired packs — marking packs REFUNDED locally.');
      for (const p of expired) {
        await prisma.giftPack.update({ where: { id: p.id }, data: { status: 'REFUNDED' } });
        console.log('Marked REFUNDED:', p.id);
      }
      return process.exit(0);
    }

    console.log('Calling contract.refundExpired with ids:', ids);
    const tx = await contract.refundExpired(ids);
    console.log('Submitted refundExpired tx:', tx.hash);
    const receipt = await tx.wait();
    console.log('Refund tx mined:', receipt.transactionHash);

    // Mark corresponding packs as REFUNDED when any of their on-chain IDs were refunded
    for (const p of expired) {
      const packIds = [];
      if (typeof p.giftIdOnChain === 'number') packIds.push(p.giftIdOnChain);
      if (p.giftIdsOnChain) {
        try { const parsed = JSON.parse(p.giftIdsOnChain); if (Array.isArray(parsed)) parsed.forEach(v => typeof v === 'number' && packIds.push(v)); } catch {}
      }
      const intersects = packIds.some(v => ids.includes(v));
      if (intersects) {
        await prisma.giftPack.update({ where: { id: p.id }, data: { status: 'REFUNDED' } });
        console.log('Marked REFUNDED:', p.id);
      }
    }

    console.log('Sweep completed.');
  } catch (err) {
    console.error('Sweep failed:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
