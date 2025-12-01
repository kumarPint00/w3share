"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var hardhat_1 = require("hardhat");
describe('GiftEscrow', function () {
    var _this = this;
    var giftEscrow;
    before(function () { return __awaiter(_this, void 0, void 0, function () {
        var Factory;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hardhat_1.ethers.getContractFactory('GiftEscrow')];
                case 1:
                    Factory = _a.sent();
                    return [4 /*yield*/, Factory.deploy()];
                case 2:
                    giftEscrow = _a.sent();
                    return [4 /*yield*/, giftEscrow.deployed()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('placeholder test', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (0, chai_1.expect)(true).to.be.true;
            return [2 /*return*/];
        });
    }); });
});
const { describe, it } = require('mocha');
describe('GiftEscrow placeholder JS', function () {
    it('has minimal test', function () { });
});

module.exports = {};
