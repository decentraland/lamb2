import {
  EmoteFromQuery,
  LandForResponse,
  LandFromQuery,
  NameForResponse,
  NameFromQuery,
  EmoteForResponse,
  ThirdPartyAsset
} from '../types'

/*
 * Adapts the result from the emotes query to the desired schema for the response
 */
export function transformEmoteToResponseSchema(emote: EmoteFromQuery): EmoteForResponse {
  return {
    urn: emote.urn,
    // id: emote.id,
    // contractAddress: emote.contractAddress,
    // tokenId: emote.tokenId,
    // image: emote.image,
    // transferredAt: emote.transferredAt,
    // name: emote.item.metadata.emote.name,
    // description: emote.item.metadata.emote.description,
    // rarity: emote.item.rarity,
    // price: emote.item.price
    amount: 1
  }
}

/*
 * Adapts the result from the names query to the desired schema for the response
 */
export function transformNameToResponseSchema(name: NameFromQuery): NameForResponse {
  // Set price depending on activeOrder. It could be null if is not at sale
  let price = null
  if (name.activeOrder) price = name.activeOrder.price

  return {
    name: name.name,
    contractAddress: name.contractAddress,
    tokenId: name.tokenId,
    price: price
  }
}

/*
 * Adapts the result from the lands query to the desired schema for the response
 */
export function transformLandToResponseSchema(land: LandFromQuery): LandForResponse {
  // Set price depending on activeOrder. It could be null if is not at sale
  let price = null
  if (land.activeOrder) price = land.activeOrder.price

  // Set category dependent fields
  let x, y, description
  if (land.category === 'parcel') {
    x = land.parcel.x
    y = land.parcel.y
    if (land.parcel.data) description = land.parcel.data.description
  } else if (land.category === 'estate') {
    if (land.estate.data) description = land.estate.data.description
  }

  return {
    name: land.name,
    contractAddress: land.contractAddress,
    tokenId: land.tokenId,
    category: land.category,
    x: x,
    y: y,
    description: description,
    price: price,
    image: land.image
  }
}

/*
 * Adapts the response from a third-party resolver to /nfts/emotes endpoint response
 */
export function transformThirdPartyAssetToEmoteForResponse(asset: ThirdPartyAsset): EmoteForResponse {
  return {
    urn: asset.urn.decentraland,
    amount: 1
  }
}
