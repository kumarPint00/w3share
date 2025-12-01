"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var modules_1 = require("@nomicfoundation/hardhat-ignition/modules");
var GiftEscrowModule = (0, modules_1.buildModule)("GiftEscrowModule", function (m) {
    var giftEscrow = m.contract("GiftEscrow", []);
    return { giftEscrow: giftEscrow };
});
exports.default = GiftEscrowModule;
