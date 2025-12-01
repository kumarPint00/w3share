export enum ApiTag {
  Auth = 'Auth',
  Assets = 'Assets',
  Giftpacks = 'Giftpacks',
}
export enum ApiTagDescription {
  Auth = 'Authentication and user management',
  Assets = 'Asset management and operations',
  Giftpacks = 'Giftpack creation and management',
}
export const ApiTagDescriptions: Record<ApiTag, string> = {
  [ApiTag.Auth]: ApiTagDescription.Auth,
  [ApiTag.Assets]: ApiTagDescription.Assets,
  [ApiTag.Giftpacks]: ApiTagDescription.Giftpacks,
};
export const ApiTagList = Object.values(ApiTag);
export const ApiTagDescriptionList = Object.values(ApiTagDescriptions);
export const ApiTagMap: Record<ApiTag, string> = {
  [ApiTag.Auth]: ApiTagDescription.Auth,
  [ApiTag.Assets]: ApiTagDescription.Assets,
  [ApiTag.Giftpacks]: ApiTagDescription.Giftpacks,
};
export const ApiTagMapList = Object.entries(ApiTagMap).map(
  ([tag, description]) => ({
    tag,
    description,
  }),
);
export const ApiTagMapListWithDescriptions = Object.entries(ApiTagMap).map(
  ([tag, description]) => ({
    tag,
    description,
    value: tag,
    label: description,
  }),
);
export const ApiTagMapListWithDescriptionsAndValues = Object.entries(
  ApiTagMap,
).map(([tag, description]) => ({
  tag,
  description,
  value: tag,
  label: description,
}));