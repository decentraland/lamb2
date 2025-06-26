import { Snapshots } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'

/**
 * Pure adapter function to check if a wearable is a base wearable
 */
export function isBaseWearable(wearable: string): boolean {
  return wearable.includes('base-avatars')
}

/**
 * Pure adapter function to translate wearable ID format
 */
export async function translateWearablesIdFormat(wearableId: string): Promise<string | undefined> {
  if (!wearableId.startsWith('dcl://')) {
    return wearableId
  }

  const parsed = await parseUrn(wearableId)
  return parsed?.uri?.toString()
}

/**
 * Pure adapter function to round timestamps to seconds
 * Dates received from If-Modified-Since headers have precisions of seconds
 */
export function roundToSeconds(timestamp: number): number {
  return Math.floor(timestamp / 1000) * 1000
}

/**
 * Pure adapter function to add base URL to snapshots
 * The content server provides the snapshots' hashes, but clients expect a full url.
 */
export function addBaseUrlToSnapshots(entityId: string, baseUrl: string, snapshots: Snapshots): Snapshots {
  snapshots.body = addBaseUrlToSnapshot(entityId, baseUrl, 'body')
  snapshots.face256 = addBaseUrlToSnapshot(entityId, baseUrl, 'face')
  return snapshots
}

/**
 * Pure adapter function to add base URL to a single snapshot
 */
export function addBaseUrlToSnapshot(entityId: string, baseUrl: string, which: string): string {
  const cleanedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  return cleanedBaseUrl + `entities/${entityId}/${which}.png`
}
