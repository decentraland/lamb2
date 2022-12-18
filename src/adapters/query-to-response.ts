import { emoteFromQuery, nameForResponse, nameFromQuery, nftForCollectionResponse, wearableFromQuery } from "../types";

/* 
 * Adapts the result from the wearables query to the desired schema for the response
 */
export function transformWearableToResponseSchema(wearable: wearableFromQuery): nftForCollectionResponse {
  return {
    urn: wearable.urn,
    id: wearable.id,
    image: wearable.image,
    createdAt: wearable.createdAt,
    name: wearable.item.metadata.wearable.name,
    description: wearable.item.metadata.wearable.description,
    rarity: wearable.item.rarity,
    price: wearable.item.price,
  }
}

/* 
 * Adapts the result from the emotes query to the desired schema for the response
 */
export function transformEmoteToResponseSchema(emote: emoteFromQuery): nftForCollectionResponse {
  return {
    urn: emote.urn,
    id: emote.id,
    image: emote.image,
    createdAt: emote.createdAt,
    name: emote.item.metadata.emote.name,
    description: emote.item.metadata.emote.description,
    rarity: emote.item.rarity,
    price: emote.item.price,
  }
}

/* 
 * Adapts the result from the names query to the desired schema for the response
 */
export function transformNameToResponseSchema(name: nameFromQuery): nameForResponse {
  let price = null
  if (name.activeOrder)
    price = name.activeOrder.price
  return {
    name: name.name,
    contractAddress: name.contractAddress,
    price: price,
  }
}
