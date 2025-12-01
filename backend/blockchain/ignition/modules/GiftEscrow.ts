import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GiftEscrowModule = buildModule("GiftEscrowModule", (m) => {
    const giftEscrow = m.contract("GiftEscrow", []);

    return { giftEscrow };
});

export default GiftEscrowModule;