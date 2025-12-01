"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTagMapListWithDescriptionsAndValues = exports.ApiTagMapListWithDescriptions = exports.ApiTagMapList = exports.ApiTagMap = exports.ApiTagDescriptionList = exports.ApiTagList = exports.ApiTagDescriptions = exports.ApiTagDescription = exports.ApiTag = void 0;
var ApiTag;
(function (ApiTag) {
    ApiTag["Auth"] = "Auth";
    ApiTag["Assets"] = "Assets";
    ApiTag["Giftpacks"] = "Giftpacks";
})(ApiTag || (exports.ApiTag = ApiTag = {}));
var ApiTagDescription;
(function (ApiTagDescription) {
    ApiTagDescription["Auth"] = "Authentication and user management";
    ApiTagDescription["Assets"] = "Asset management and operations";
    ApiTagDescription["Giftpacks"] = "Giftpack creation and management";
})(ApiTagDescription || (exports.ApiTagDescription = ApiTagDescription = {}));
exports.ApiTagDescriptions = (_a = {},
    _a[ApiTag.Auth] = ApiTagDescription.Auth,
    _a[ApiTag.Assets] = ApiTagDescription.Assets,
    _a[ApiTag.Giftpacks] = ApiTagDescription.Giftpacks,
    _a);
exports.ApiTagList = Object.values(ApiTag);
exports.ApiTagDescriptionList = Object.values(exports.ApiTagDescriptions);
exports.ApiTagMap = (_b = {},
    _b[ApiTag.Auth] = ApiTagDescription.Auth,
    _b[ApiTag.Assets] = ApiTagDescription.Assets,
    _b[ApiTag.Giftpacks] = ApiTagDescription.Giftpacks,
    _b);
exports.ApiTagMapList = Object.entries(exports.ApiTagMap).map(function (_a) {
    var tag = _a[0], description = _a[1];
    return ({
        tag: tag,
        description: description,
    });
});
exports.ApiTagMapListWithDescriptions = Object.entries(exports.ApiTagMap).map(function (_a) {
    var tag = _a[0], description = _a[1];
    return ({
        tag: tag,
        description: description,
        value: tag,
        label: description,
    });
});
exports.ApiTagMapListWithDescriptionsAndValues = Object.entries(exports.ApiTagMap).map(function (_a) {
    var tag = _a[0], description = _a[1];
    return ({
        tag: tag,
        description: description,
        value: tag,
        label: description,
    });
});
