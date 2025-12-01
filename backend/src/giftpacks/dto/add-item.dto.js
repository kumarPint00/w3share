"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddItemDto = exports.AssetType = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var AssetType;
(function (AssetType) {
    AssetType["ERC20"] = "ERC20";
    AssetType["ERC721"] = "ERC721";
})(AssetType || (exports.AssetType = AssetType = {}));
var AddItemDto = function () {
    var _a;
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _contract_decorators;
    var _contract_initializers = [];
    var _contract_extraInitializers = [];
    var _tokenId_decorators;
    var _tokenId_initializers = [];
    var _tokenId_extraInitializers = [];
    var _amount_decorators;
    var _amount_initializers = [];
    var _amount_extraInitializers = [];
    return _a = /** @class */ (function () {
            function AddItemDto() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.contract = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _contract_initializers, void 0));
                this.tokenId = (__runInitializers(this, _contract_extraInitializers), __runInitializers(this, _tokenId_initializers, void 0));
                this.amount = (__runInitializers(this, _tokenId_extraInitializers), __runInitializers(this, _amount_initializers, void 0));
                __runInitializers(this, _amount_extraInitializers);
            }
            return AddItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiProperty)({ enum: AssetType }), (0, class_validator_1.IsEnum)(AssetType)];
            _contract_decorators = [(0, swagger_1.ApiProperty)({ description: 'Token contract address' }), (0, class_validator_1.IsEthereumAddress)()];
            _tokenId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Token ID for ERC721', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumberString)()];
            _amount_decorators = [(0, swagger_1.ApiProperty)({ description: 'Amount for ERC20 in wei', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumberString)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _contract_decorators, { kind: "field", name: "contract", static: false, private: false, access: { has: function (obj) { return "contract" in obj; }, get: function (obj) { return obj.contract; }, set: function (obj, value) { obj.contract = value; } }, metadata: _metadata }, _contract_initializers, _contract_extraInitializers);
            __esDecorate(null, null, _tokenId_decorators, { kind: "field", name: "tokenId", static: false, private: false, access: { has: function (obj) { return "tokenId" in obj; }, get: function (obj) { return obj.tokenId; }, set: function (obj, value) { obj.tokenId = value; } }, metadata: _metadata }, _tokenId_initializers, _tokenId_extraInitializers);
            __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: function (obj) { return "amount" in obj; }, get: function (obj) { return obj.amount; }, set: function (obj, value) { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _amount_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.AddItemDto = AddItemDto;
