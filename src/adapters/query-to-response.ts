import { emoteFromQuery, landForResponse, landFromQuery, nameForResponse, nameFromQuery, emoteForResponse, wearableFromQuery, wearableForResponse } from "../types";

/* 
 * Adapts the result from the wearables query to the desired schema for the response
 */
export function transformWearableToResponseSchema(wearable: wearableFromQuery): wearableForResponse {
  return {
    urn: wearable.urn,
    image: wearable.image,
    name: wearable.item.metadata.wearable.name,
    description: wearable.item.metadata.wearable.description,
    rarity: wearable.item.rarity,
    individualData: [{
      id: wearable.id,
      createdAt: wearable.createdAt,
      price: wearable.item.price,
    }]
  }
}

/* 
 * Adapts the result from the emotes query to the desired schema for the response
 */
export function transformEmoteToResponseSchema(emote: emoteFromQuery): emoteForResponse {
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
  // Set price depending on activeOrder. It could be null if is not at sale
  let price = null
  if (name.activeOrder)
    price = name.activeOrder.price

  return {
    name: name.name,
    contractAddress: name.contractAddress,
    price: price,
  }
}

/* 
 * Adapts the result from the landes query to the desired schema for the response
 */
export function transformLandToResponseSchema(land: landFromQuery): landForResponse {
  // Set price depending on activeOrder. It could be null if is not at sale
  let price = null
  if (land.activeOrder)
    price = land.activeOrder.price
  
  // Set category dependent fields
  let x, y, description
  if (land.category == "parcel") {
    x = land.parcel.x
    y = land.parcel.y
    if (land.parcel.data)
      description = land.parcel.data.description
  } else if (land.category == "estate"){
    if (land.estate.data)
      description = land.estate.data.description
  }
  
  return {
    name: land.name,
    contractAddress: land.contractAddress,
    category: land.category,
    x: x,
    y: y,
    description: description,
    price: price,
    image: land.image
  }
}
