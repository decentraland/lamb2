import { HTTPProvider, RPCSendableMessage, toBatchPayload } from 'eth-connect'
import { parseUrn } from '@dcl/urn-resolver'

export const erc721Abi = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
]

export const erc1155Abi = [
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' }
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]

export function sendBatch(provider: HTTPProvider, batch: RPCSendableMessage[]) {
  const payload = toBatchPayload(batch)
  return new Promise<any>((resolve, reject) => {
    provider.sendAsync(payload as any, (err: any, result: any) => {
      if (err) {
        reject(err)
        return
      }

      resolve(result)
    })
  })
}

export async function sendSingle(provider: HTTPProvider, message: RPCSendableMessage) {
  const res = await sendBatch(provider, [message])
  return res[0]
}

type URNsByNetwork = {
  l1ThirdParty: { urn: string; type: string }[]
  l2ThirdParty: { urn: string; type: string }[]
}

export const L1_NETWORKS = ['mainnet', 'sepolia']
export const L2_NETWORKS = ['matic', 'amoy']

/**
 * Splits linked third-party item URNs by the network of their NFT. Any other URN, including a
 * third-party URN that names no NFT, is left out: its ownership cannot be checked.
 */
export async function splitItemsURNsByTypeAndNetwork(urnsToSplit: string[]): Promise<URNsByNetwork> {
  const l1ThirdParty: { urn: string; type: string }[] = []
  const l2ThirdParty: { urn: string; type: string }[] = []

  for (const urn of urnsToSplit) {
    const asset = await parseUrn(urn).catch(() => null)
    if (!asset || asset.type !== 'blockchain-collection-third-party-item' || !L2_NETWORKS.includes(asset.network)) {
      continue
    }

    if (L1_NETWORKS.includes(asset.nftChain)) {
      l1ThirdParty.push({ urn: asset.uri.toString(), type: asset.type })
    } else if (L2_NETWORKS.includes(asset.nftChain)) {
      l2ThirdParty.push({ urn: asset.uri.toString(), type: asset.type })
    }
  }

  return {
    l1ThirdParty,
    l2ThirdParty
  }
}
