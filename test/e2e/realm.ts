/**
 * Access to the realm under test. Everything is derived from one URL so the suite can be pointed
 * at any deployment: the lambdas live under /lambdas, the explorer routes at the realm root.
 */
export const REALM_URL = (process.env.E2E_REALM_URL ?? 'https://peer.decentraland.zone').replace(/\/$/, '')
export const LAMBDAS_URL = `${REALM_URL}/lambdas`
export const EXPLORER_URL = `${REALM_URL}/explorer`

/** The L2 collections subgraph for the realm's network, used only to discover wallets with inventory. */
const COLLECTIONS_SUBGRAPH_URL =
  process.env.E2E_COLLECTIONS_SUBGRAPH_URL ?? 'https://subgraph.decentraland.org/collections-matic-amoy'

export type Page<T> = { elements: T[]; totalAmount: number; pageNum: number; pageSize: number }

export type OwnedItem = {
  urn: string
  name: string
  category: string
  rarity: string
  amount: number
  individualData: { id: string; tokenId: string; transferredAt: string; price: string }[]
}

export type Profile = {
  timestamp: number
  avatars: {
    name: string
    userId: string
    ethAddress: string
    hasClaimedName: boolean
    avatar: { wearables: string[]; emotes?: { urn: string; slot: number }[]; bodyShape: string }
  }[]
}

export type Response<T> = { status: number; body: T; text: string }

export async function get<T>(url: string, headers: Record<string, string> = {}): Promise<Response<T>> {
  const response = await fetch(url, { headers })
  return parse<T>(response)
}

export async function post<T>(
  url: string,
  payload: unknown,
  headers: Record<string, string> = {}
): Promise<Response<T>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload)
  })
  return parse<T>(response)
}

async function parse<T>(response: globalThis.Response): Promise<Response<T>> {
  const text = await response.text()
  let body: T = undefined as unknown as T
  try {
    body = text ? (JSON.parse(text) as T) : body
  } catch {
    // Not JSON: leave the body undefined and let the assertion show the text.
  }
  return { status: response.status, body, text }
}

/** Splits a worn URN into the item URN and its token, the way the profile validation does. */
export function splitUrnAndTokenId(worn: string): { urn: string; tokenId?: string } {
  if (worn.split(':').length === 7 && !worn.includes('collections-thirdparty')) {
    const at = worn.lastIndexOf(':')
    return { urn: worn.slice(0, at), tokenId: worn.slice(at + 1) }
  }
  return { urn: worn }
}

export const isBaseWearable = (urn: string): boolean => urn.includes('base-avatars')
export const isBaseEmote = (urn: string): boolean => !urn.includes(':') || urn.includes('off-chain:base-emotes')
export const isThirdParty = (urn: string): boolean => urn.includes('collections-thirdparty')

export type Wallet = { address: string }

let discovered: Promise<Wallet> | undefined

/**
 * A wallet on the realm's network that owns wearables and emotes and has a deployed profile.
 * Found once per run from recent transfers on the L2 collections subgraph, or taken from
 * E2E_ADDRESS. Discovery is a fixture concern, so a failure here reads as "no wallet", not as a
 * failing behaviour.
 */
export function wallet(): Promise<Wallet> {
  if (!discovered) {
    discovered = process.env.E2E_ADDRESS
      ? Promise.resolve({ address: process.env.E2E_ADDRESS.toLowerCase() })
      : discover()
  }
  return discovered
}

async function discover(): Promise<Wallet> {
  const query =
    '{ nfts(first: 1000, orderBy: transferredAt, orderDirection: desc, where: { itemType_in: [wearable_v2, smart_wearable_v1, emote_v1] }) { owner { id } itemType } }'
  const { body } = await post<{ data: { nfts: { owner: { id: string }; itemType: string }[] } }>(
    COLLECTIONS_SUBGRAPH_URL,
    { query }
  )
  const perOwner = new Map<string, { wearables: number; emotes: number }>()
  for (const nft of body?.data?.nfts ?? []) {
    const counts = perOwner.get(nft.owner.id) ?? { wearables: 0, emotes: 0 }
    counts[nft.itemType === 'emote_v1' ? 'emotes' : 'wearables'] += 1
    perOwner.set(nft.owner.id, counts)
  }
  const candidates = [...perOwner.entries()]
    .filter(([, counts]) => counts.wearables > 0 && counts.emotes > 0)
    .sort(([, a], [, b]) => b.wearables + b.emotes - (a.wearables + a.emotes))
    .slice(0, 10)
    .map(([address]) => address)

  const profiles = await post<Profile[]>(`${LAMBDAS_URL}/profiles`, { ids: candidates })
  const withProfile = (profiles.body ?? []).map((profile) => profile.avatars[0]?.ethAddress?.toLowerCase())
  const address = candidates.find((candidate) => withProfile.includes(candidate))
  if (!address) {
    throw new Error(`No wallet with wearables, emotes and a profile found on ${REALM_URL}; set E2E_ADDRESS`)
  }
  return { address }
}
