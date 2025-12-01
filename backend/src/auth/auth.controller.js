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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var wallet_nonce_dto_1 = require("./dto/wallet-nonce.dto");
var siwe_login_dto_1 = require("./dto/siwe-login.dto");
var wallet_guard_1 = require("./wallet.guard");
var AuthController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Auth'), (0, common_1.Controller)('auth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _walletNonce_decorators;
    var _siweLogin_decorators;
    var _session_decorators;
    var AuthController = _classThis = /** @class */ (function () {
        function AuthController_1(auth) {
            this.auth = (__runInitializers(this, _instanceExtraInitializers), auth);
        }
        /* ---------- 1. request nonce ---------- */
        AuthController_1.prototype.walletNonce = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = {};
                            return [4 /*yield*/, this.auth.generateNonce(dto.address)];
                        case 1: return [2 /*return*/, (_a.nonce = _b.sent(), _a)];
                    }
                });
            });
        };
        /* ---------- 2. verify SIWE ---------- */
        AuthController_1.prototype.siweLogin = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var token;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.auth.validateSiwe(dto.message, dto.signature)];
                        case 1:
                            token = _a.sent();
                            return [2 /*return*/, { accessToken: token }];
                    }
                });
            });
        };
        /* ---------- 3. session ---------- */
        AuthController_1.prototype.session = function (req) {
            return { address: req.user.address, loginAt: new Date().toISOString() };
        };
        return AuthController_1;
    }());
    __setFunctionName(_classThis, "AuthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _walletNonce_decorators = [(0, common_1.Post)('wallet-nonce'), (0, swagger_1.ApiOperation)({ summary: 'Request a SIWE nonce' }), (0, swagger_1.ApiBody)({ type: wallet_nonce_dto_1.WalletNonceDto }), (0, swagger_1.ApiCreatedResponse)({
                description: 'Nonce generated',
                schema: { example: { nonce: '0xabc123...' } },
            })];
        _siweLogin_decorators = [(0, common_1.Post)('siwe'), (0, swagger_1.ApiOperation)({ summary: 'Exchange SIWE signature for JWT' }), (0, swagger_1.ApiBody)({ type: siwe_login_dto_1.SiweLoginDto }), (0, swagger_1.ApiOkResponse)({
                description: 'JWT issued',
                schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...' } },
            })];
        _session_decorators = [(0, common_1.Get)('session'), (0, common_1.UseGuards)(wallet_guard_1.WalletAuthGuard), (0, swagger_1.ApiOperation)({ summary: 'Get current wallet session' }), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOkResponse)({
                schema: {
                    example: {
                        address: '0xBbA2be6c533645b6A51463a12ca31c60E24b6f52',
                        loginAt: '2025-06-09T11:05:00.000Z',
                    },
                },
            })];
        __esDecorate(_classThis, null, _walletNonce_decorators, { kind: "method", name: "walletNonce", static: false, private: false, access: { has: function (obj) { return "walletNonce" in obj; }, get: function (obj) { return obj.walletNonce; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _siweLogin_decorators, { kind: "method", name: "siweLogin", static: false, private: false, access: { has: function (obj) { return "siweLogin" in obj; }, get: function (obj) { return obj.siweLogin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _session_decorators, { kind: "method", name: "session", static: false, private: false, access: { has: function (obj) { return "session" in obj; }, get: function (obj) { return obj.session; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthController = _classThis;
}();
exports.AuthController = AuthController;
