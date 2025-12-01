"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthDocs = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var JwtAuthDocs = function () {
    return (0, common_1.applyDecorators)((0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Invalid or missing JWT' }));
};
exports.JwtAuthDocs = JwtAuthDocs;
