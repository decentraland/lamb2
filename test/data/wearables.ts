import { ThirdPartyWearable } from "../../src/types"

const TWO_DAYS = (2 * 24 * 60 * 60 * 1000)

export function generateWearables(quantity: number) {
    const generatedWearables = []
    for (let i = 0; i < quantity; i++) {
        generatedWearables.push({
            urn: 'urn-' + i,
            id: 'id-' + i,
            tokenId: 'tokenId-' + i,
            category: 'wearable',
            transferredAt: Date.now() - TWO_DAYS,
            item: {
                rarity: 'unique',
                price: 100 + i
            }
        })
    }

    return generatedWearables
}

export function generateDefinitions(urns: string[]) {
    return urns.map((urn) => ({
        version: '1',
        id: urn,
        type: 'wearable',
        pointers: ['0x0', '0x1'],
        timestamp: Date.now() - TWO_DAYS,
        content: [{
            file: 'file',
            hash: 'id'
        }],
        metadata: {
            id: urn,
            data: {
                representations: [
                    { contents: ['fileName'] }
                ]
            }
        }
    }))
}

export function generateThirdPartyWearables(quantity: number): ThirdPartyWearable[] {
    const generatedThirdPartyWearables = []
    for (let i = 0; i < quantity; i++) {
        generatedThirdPartyWearables.push({
            id: 'id-' + i,
            amount: 1,
            urn: {
                decentraland: 'urn-' + i
            }
        })
    }
    return generatedThirdPartyWearables
}

export function getThirdPartyProviders() {
    return {
        thirdParties: [
            {
                id: "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
                resolver: "https://decentraland-api.babydoge.com/v1"
            },
            {
                id: "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
                resolver: "https://api.cryptoavatars.io/"
            },
            {
                id: "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
                resolver: "https://wearables-api.unxd.com"
            }
        ]
    }
}
