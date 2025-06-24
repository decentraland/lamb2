import SQL, { SQLStatement } from 'sql-template-strings'

/**
 * Gets full wearable data for a user - used by wearables endpoint
 * Returns complete wearable information including metadata, rarity, name, etc.
 *
 * @param owner - Ethereum address of the owner
 * @param limit - Maximum number of wearables to return
 * @returns SQL query for complete wearable data
 */
export function getWearablesByOwnerQuery(owner: string, limit: number): SQLStatement {
  return SQL`
    SELECT
      nft.id,
      nft.contract_address,
      nft.token_id,
      nft.network,
      nft.created_at,
      nft.updated_at,
      nft.urn,
      owner_address as owner,
      nft.image,
      nft.item_id,
      nft.category,
      wearable.rarity,
      wearable.name,
      nft.item_type,
      wearable.description,
      transferred_at
    FROM squid_marketplace.nft nft
    LEFT JOIN squid_marketplace.metadata metadata on nft.metadata_id = metadata.id
    LEFT JOIN squid_marketplace.wearable wearable on metadata.wearable_id = wearable.id
    WHERE owner_address = ${owner}
      AND nft.item_type IN ('wearable_v1', 'wearable_v2', 'smart_wearable_v1')
    ORDER BY nft.created_at DESC
    LIMIT ${limit}
  `
}

/**
 * Gets minimal wearable data for profile validation - used by profiles endpoint
 * Returns only URN and token ID for efficient profile wearable validation
 *
 * @param owner - Ethereum address of the owner
 * @param limit - Maximum number of wearables to return
 * @returns SQL query for URN and token ID only
 */
export function getOwnedWearablesUrnAndTokenIdQuery(owner: string, limit: number): SQLStatement {
  return SQL`
    SELECT
      nft.urn,
      nft.token_id
    FROM squid_marketplace.nft nft
    WHERE owner_address = ${owner}
      AND nft.item_type IN ('wearable_v1', 'wearable_v2', 'smart_wearable_v1')
    ORDER BY nft.created_at DESC
    LIMIT ${limit}
  `
}

/**
 * Gets full emote data for a user - used by emotes endpoint
 * Returns complete emote information including metadata, rarity, name, etc.
 *
 * @param owner - Ethereum address of the owner
 * @param limit - Maximum number of emotes to return
 * @returns SQL query for complete emote data
 */
export function getEmotesByOwnerQuery(owner: string, limit: number): SQLStatement {
  return SQL`
    SELECT
      nft.id,
      nft.contract_address,
      nft.token_id,
      nft.network,
      nft.created_at,
      nft.updated_at,
      nft.urn,
      owner_address as owner,
      nft.image,
      nft.item_id,
      nft.category,
      emote.rarity,
      emote.name,
      nft.item_type,
      emote.description,
      transferred_at
    FROM squid_marketplace.nft nft
    LEFT JOIN squid_marketplace.emote emote on nft.item_id = emote.id
    WHERE owner_address = ${owner}
      AND nft.item_type = 'emote_v1'
    ORDER BY nft.created_at DESC
    LIMIT ${limit}
  `
}

/**
 * Gets minimal emote data for profile validation - used by profiles endpoint
 * Returns only URN and token ID for efficient profile emote validation
 *
 * @param owner - Ethereum address of the owner
 * @param limit - Maximum number of emotes to return
 * @returns SQL query for URN and token ID only
 */
export function getOwnedEmotesUrnAndTokenIdQuery(owner: string, limit: number): SQLStatement {
  return SQL`
    SELECT
      nft.urn,
      nft.token_id
    FROM squid_marketplace.nft nft
    WHERE owner_address = ${owner}
      AND nft.item_type = 'emote_v1'
    ORDER BY nft.created_at DESC
    LIMIT ${limit}
  `
}

/**
 * Gets full name/ENS data for a user - used by names endpoint
 * Returns complete name information including contract details and pricing
 *
 * @param owner - Ethereum address of the owner (automatically lowercased)
 * @param limit - Maximum number of names to return
 * @returns SQL query for complete name data
 */
export function getNamesByOwnerQuery(owner: string, limit: number): SQLStatement {
  return SQL`
    SELECT
      nft.id,
      nft.contract_address,
      nft.token_id,
      nft.network,
      nft.created_at,
      nft.updated_at,
      nft.urn,
      owner_address as owner,
      nft.image,
      nft.category,
      ens.subdomain as name,
      transferred_at
    FROM squid_marketplace.nft nft
    LEFT JOIN squid_marketplace.ens ens on ens.id = nft.ens_id
    WHERE owner_address = ${owner.toLowerCase()}
      AND nft.category = 'ens'
    ORDER BY nft.created_at DESC
    LIMIT ${limit}
  `
}

/**
 * Gets minimal name data for profile validation - used by profiles endpoint
 * Returns only the name/subdomain for efficient profile name validation
 *
 * @param owner - Ethereum address of the owner (automatically lowercased)
 * @param limit - Maximum number of names to return
 * @returns SQL query for name/subdomain only
 */
export function getOwnedNamesOnlyQuery(owner: string, limit: number): SQLStatement {
  return SQL`
    SELECT
      ens.subdomain as name
    FROM squid_marketplace.nft nft
    LEFT JOIN squid_marketplace.ens ens on ens.id = nft.ens_id
    WHERE owner_address = ${owner.toLowerCase()}
      AND nft.category = 'ens'
    ORDER BY nft.created_at DESC
    LIMIT ${limit}
  `
}
