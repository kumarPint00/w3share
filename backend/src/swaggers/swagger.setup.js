"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
var swagger_1 = require("@nestjs/swagger");
/**
 * Configures Swagger (OpenAPI) docs for the application.
 * @param app - The NestJS application instance
 */
function setupSwagger(app) {
    var config = new swagger_1.DocumentBuilder()
        .setTitle('DogeGF Gift API')
        .setDescription('API documentation for DogeGF On-chain Gifting Platform')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
    })
        .build();
    var document = swagger_1.SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true,
    });
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: { docExpansion: 'none' },
    });
}
