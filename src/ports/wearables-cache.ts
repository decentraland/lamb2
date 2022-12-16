import { AppComponents } from "../types";
import LRU from 'lru-cache'
import { NFT } from "@dcl/schemas";

export async function createWearablesCache(components: Pick<AppComponents, 'config'>): Promise<LRU<string, NFT[]>> {
    const { config } = components
    
    const wearablesSize = parseInt(await config.getString('WEARABLES_CACHE_MAX_SIZE') ?? '1000')
    const wearablesAge = parseInt(await config.getString('WEARABLES_CACHE_MAX_AGE') ?? '600000') // 10 minutes by default
    
    return new LRU({ max: wearablesSize, ttl: wearablesAge})
}