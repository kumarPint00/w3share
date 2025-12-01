"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftpacksController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var wallet_guard_1 = require("../auth/wallet.guard");
var GiftpacksController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Giftpacks'), (0, common_1.Controller)('giftpacks')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _get_decorators;
    var _update_decorators;
    var _delete_decorators;
    var _addItem_decorators;
    var _removeItem_decorators;
    var GiftpacksController = _classThis = /** @class */ (function () {
        function GiftpacksController_1(service) {
            this.service = (__runInitializers(this, _instanceExtraInitializers), service);
        }
        GiftpacksController_1.prototype.create = function (dto) {
            return this.service.createDraft(dto);
        };
        GiftpacksController_1.prototype.get = function (id) {
            return this.service.getDraft(id);
        };
        GiftpacksController_1.prototype.update = function (id, dto) {
            return this.service.updateDraft(id, dto);
        };
        GiftpacksController_1.prototype.delete = function (id) {
            return this.service.deleteDraft(id);
        };
        GiftpacksController_1.prototype.addItem = function (id, dto) {
            return this.service.addItem(id, dto);
        };
        GiftpacksController_1.prototype.removeItem = function (id, itemId) {
            return this.service.removeItem(id, itemId);
        };
        return GiftpacksController_1;
    }());
    __setFunctionName(_classThis, "GiftpacksController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.UseGuards)(wallet_guard_1.WalletAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Post)(), (0, swagger_1.ApiOperation)({ summary: 'Create a new draft gift pack' })];
        _get_decorators = [(0, common_1.UseGuards)(wallet_guard_1.WalletAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Get)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Get a gift pack by ID' }), (0, swagger_1.ApiParam)({ name: 'id', description: 'GiftPack ID' })];
        _update_decorators = [(0, common_1.UseGuards)(wallet_guard_1.WalletAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Patch)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Update draft gift pack metadata' })];
        _delete_decorators = [(0, common_1.UseGuards)(wallet_guard_1.WalletAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Delete)(':id'), (0, swagger_1.ApiOperation)({ summary: 'Delete a draft gift pack' })];
        _addItem_decorators = [(0, common_1.UseGuards)(wallet_guard_1.WalletAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Post)(':id/items'), (0, swagger_1.ApiOperation)({ summary: 'Add item to gift pack' })];
        _removeItem_decorators = [(0, common_1.UseGuards)(wallet_guard_1.WalletAuthGuard), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Delete)(':id/items/:itemId'), (0, swagger_1.ApiOperation)({ summary: 'Remove item from gift pack' })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: function (obj) { return "get" in obj; }, get: function (obj) { return obj.get; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: function (obj) { return "delete" in obj; }, get: function (obj) { return obj.delete; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addItem_decorators, { kind: "method", name: "addItem", static: false, private: false, access: { has: function (obj) { return "addItem" in obj; }, get: function (obj) { return obj.addItem; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removeItem_decorators, { kind: "method", name: "removeItem", static: false, private: false, access: { has: function (obj) { return "removeItem" in obj; }, get: function (obj) { return obj.removeItem; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GiftpacksController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GiftpacksController = _classThis;
}();
exports.GiftpacksController = GiftpacksController;
