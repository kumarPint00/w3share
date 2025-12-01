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
exports.CreateGiftpackDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateGiftpackDto = function () {
    var _a;
    var _message_decorators;
    var _message_initializers = [];
    var _message_extraInitializers = [];
    var _expiry_decorators;
    var _expiry_initializers = [];
    var _expiry_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateGiftpackDto() {
                this.message = __runInitializers(this, _message_initializers, void 0);
                this.expiry = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _expiry_initializers, void 0));
                __runInitializers(this, _expiry_extraInitializers);
            }
            return CreateGiftpackDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _message_decorators = [(0, swagger_1.ApiProperty)({ description: 'Optional message for recipient', required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _expiry_decorators = [(0, swagger_1.ApiProperty)({ description: 'ISO8601 expiry datetime', example: '2025-07-16T00:00:00Z' }), (0, class_validator_1.IsISO8601)()];
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: function (obj) { return "message" in obj; }, get: function (obj) { return obj.message; }, set: function (obj, value) { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _expiry_decorators, { kind: "field", name: "expiry", static: false, private: false, access: { has: function (obj) { return "expiry" in obj; }, get: function (obj) { return obj.expiry; }, set: function (obj, value) { obj.expiry = value; } }, metadata: _metadata }, _expiry_initializers, _expiry_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateGiftpackDto = CreateGiftpackDto;
