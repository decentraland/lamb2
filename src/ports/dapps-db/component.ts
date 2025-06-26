import { createPgComponent } from '@well-known-components/pg-component'
import { AppComponents } from '../../types'
import { IDappsDbComponent, ProfileWearable, ProfileEmote, ProfileName, DappsDbRow } from './types'
import {
  getWearablesByOwnerQuery,
  getOwnedWearablesUrnAndTokenIdQuery,
  getEmotesByOwnerQuery,
  getOwnedEmotesUrnAndTokenIdQuery,
  getNamesByOwnerQuery,
  getOwnedNamesOnlyQuery
} from './queries'
import { fromDbRowsToWearables, fromDbRowsToEmotes, fromDbRowsToNames } from './mappers'

export async function createDappsDbComponent(
  components: Pick<AppComponents, 'config' | 'logs' | 'metrics'>
): Promise<IDappsDbComponent> {
  const { config, logs, metrics } = components
  const logger = logs.getLogger('dapps-db')

  // Create the PostgreSQL component using standard configuration
  const pg = await createPgComponent({ config, logs, metrics })

  /**
   * Gets complete wearable data for a user - used by wearables endpoint
   * Returns full wearable information including metadata, rarity, pricing, etc.
   *
   * @param owner - Ethereum address of the wearable owner
   * @param limit - Maximum number of wearables to return (default: 1000)
   * @returns Promise resolving to array of complete wearable data
   */
  async function getWearablesByOwner(owner: string, limit = 1000): Promise<ProfileWearable[]> {
    try {
      const client = await pg.getPool().connect()

      try {
        const query = getWearablesByOwnerQuery(owner, limit)
        const result = await client.query<DappsDbRow>(query)

        logger.debug(`Found ${result.rows.length} wearables for owner ${owner}`)
        return fromDbRowsToWearables(result.rows)
      } finally {
        client.release()
      }
    } catch (error) {
      logger.error('Error fetching wearables by owner', {
        owner,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Gets minimal wearable data for profile validation - used by profiles endpoint
   * Returns only URN and token ID for efficient wearable ownership validation
   *
   * @param owner - Ethereum address of the wearable owner
   * @param limit - Maximum number of wearables to return (default: 1000)
   * @returns Promise resolving to array of URN and token ID only
   */
  async function getOwnedWearablesUrnAndTokenId(
    owner: string,
    limit = 1000
  ): Promise<{ urn: string; tokenId: string }[]> {
    try {
      const client = await pg.getPool().connect()

      try {
        const query = getOwnedWearablesUrnAndTokenIdQuery(owner, limit)
        const result = await client.query<{ urn: string; token_id: string }>(query)

        logger.debug(`Found ${result.rows.length} wearables (URN+tokenId) for owner ${owner}`)
        return result.rows.map((row) => ({ urn: row.urn, tokenId: row.token_id }))
      } finally {
        client.release()
      }
    } catch (error) {
      logger.error('Error fetching wearables URN and token ID by owner', {
        owner,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Gets complete emote data for a user - used by emotes endpoint
   * Returns full emote information including metadata, rarity, pricing, etc.
   *
   * @param owner - Ethereum address of the emote owner
   * @param limit - Maximum number of emotes to return (default: 1000)
   * @returns Promise resolving to array of complete emote data
   */
  async function getEmotesByOwner(owner: string, limit = 1000): Promise<ProfileEmote[]> {
    try {
      const client = await pg.getPool().connect()

      try {
        const query = getEmotesByOwnerQuery(owner, limit)

        const result = await client.query<DappsDbRow>(query)

        logger.debug(`Found ${result.rows.length} emotes for owner ${owner}`)
        return fromDbRowsToEmotes(result.rows)
      } finally {
        client.release()
      }
    } catch (error) {
      logger.error('Error fetching emotes by owner', {
        owner,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Gets minimal emote data for profile validation - used by profiles endpoint
   * Returns only URN and token ID for efficient emote ownership validation
   *
   * @param owner - Ethereum address of the emote owner
   * @param limit - Maximum number of emotes to return (default: 1000)
   * @returns Promise resolving to array of URN and token ID only
   */
  async function getOwnedEmotesUrnAndTokenId(owner: string, limit = 1000): Promise<{ urn: string; tokenId: string }[]> {
    try {
      const client = await pg.getPool().connect()

      try {
        const query = getOwnedEmotesUrnAndTokenIdQuery(owner, limit)
        const result = await client.query<{ urn: string; token_id: string }>(query)

        logger.debug(`Found ${result.rows.length} emotes (URN+tokenId) for owner ${owner}`)
        return result.rows.map((row) => ({ urn: row.urn, tokenId: row.token_id }))
      } finally {
        client.release()
      }
    } catch (error) {
      logger.error('Error fetching emotes URN and token ID by owner', {
        owner,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Gets complete name/ENS data for a user - used by names endpoint
   * Returns full name information including contract details and pricing
   *
   * @param owner - Ethereum address of the name owner
   * @param limit - Maximum number of names to return (default: 1000)
   * @returns Promise resolving to array of complete name data
   */
  async function getNamesByOwner(owner: string, limit = 1000): Promise<ProfileName[]> {
    try {
      const client = await pg.getPool().connect()

      try {
        const query = getNamesByOwnerQuery(owner, limit)

        const result = await client.query<DappsDbRow>(query)

        logger.debug(`Found ${result.rows.length} names for owner ${owner}`)
        return fromDbRowsToNames(result.rows)
      } finally {
        client.release()
      }
    } catch (error) {
      logger.error('Error fetching names by owner', {
        owner,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * Gets minimal name data for profile validation - used by profiles endpoint
   * Returns only the name/subdomain for efficient name ownership validation
   *
   * @param owner - Ethereum address of the name owner
   * @param limit - Maximum number of names to return (default: 1000)
   * @returns Promise resolving to array of name strings only
   */
  async function getOwnedNamesOnly(owner: string, limit = 1000): Promise<{ name: string }[]> {
    try {
      const client = await pg.getPool().connect()

      try {
        const query = getOwnedNamesOnlyQuery(owner, limit)
        const result = await client.query<{ name: string }>(query)

        logger.debug(`Found ${result.rows.length} names (name only) for owner ${owner}`)
        return result.rows
      } finally {
        client.release()
      }
    } catch (error) {
      logger.error('Error fetching names only by owner', {
        owner,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  return {
    ...pg,
    getWearablesByOwner,
    getOwnedWearablesUrnAndTokenId,
    getEmotesByOwner,
    getOwnedEmotesUrnAndTokenId,
    getNamesByOwner,
    getOwnedNamesOnly
  }
}
