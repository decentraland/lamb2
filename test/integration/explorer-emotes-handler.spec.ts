import { EmoteCategory, Entity } from '@dcl/schemas'
import { testWithComponents } from '../components'
import { generateEmoteEntities } from '../data/emotes'

import { MixedEmoteResponse, MixedEmoteTrimmedResponse } from '../../src/controllers/handlers/explorer-emotes-handler'
import { createTheGraphComponentMock } from '../mocks/the-graph-mock'
import { generateRandomAddress } from '../helpers'
import { OnChainEmote } from '../../src/types'

const TWO_DAYS = 2 * 24 * 60 * 60 * 1000

// Helper to generate OnChainEmote data for explorer endpoint tests
function generateOnChainEmotes(quantity: number): OnChainEmote[] {
    const emotes: OnChainEmote[] = []
    for (let i = 0; i < quantity; i++) {
        emotes.push({
            urn: 'urn-' + i,
            amount: 1,
            individualData: [
                {
                    id: 'id-' + i,
                    tokenId: 'tokenId-' + i,
                    transferredAt: Date.now() - TWO_DAYS,
                    price: 100 + i
                }
            ],
            name: 'name-' + i,
            rarity: 'unique',
            minTransferredAt: Date.now() - TWO_DAYS,
            maxTransferredAt: Date.now() - TWO_DAYS,
            category: EmoteCategory.FUN
        })
    }
    return emotes
}

type ContentInfo = {
    entities: Entity[]
    contentServerUrl: string
}

testWithComponents(() => {
    const theGraphMock = createTheGraphComponentMock()
    const thirdPartyProvidersResponse = {
        thirdParties: []
    }

    theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(thirdPartyProvidersResponse)
    return {
        theGraphComponent: theGraphMock
    }
})('emotes-handler: GET /explorer/:address/emotes', function ({ components }) {
    it('return descriptive errors for bad requests', async () => {
        const { localFetch } = components

        const wallet = generateRandomAddress()

        const r = await localFetch.fetch(`/explorer/${wallet}/emotes?collectionType=base-emote`)
        expect(r.status).toBe(400)
        expect(await r.json()).toEqual({
            error: 'Bad request',
            message: 'Invalid collection type. Valid types are: on-chain.'
        })

        const r2 = await localFetch.fetch(`/explorer/${wallet}/emotes?orderBy=owner`)
        expect(r2.status).toBe(400)
        expect(await r2.json()).toEqual({
            error: 'Bad request',
            message: "Invalid sorting requested: 'owner DESC'. Valid options are '[rarity, name, date] [ASC, DESC]'."
        })

        const r3 = await localFetch.fetch(`/explorer/${wallet}/emotes?orderBy=rarity&direction=INC`)
        expect(r3.status).toBe(400)
        expect(await r3.json()).toEqual({
            error: 'Bad request',
            message: "Invalid sorting requested: 'rarity INC'. Valid options are '[rarity, name, date] [ASC, DESC]'."
        })

        const r4 = await localFetch.fetch(`/explorer/${wallet}/emotes?rarity=espectacular`)
        expect(r4.status).toBe(400)
        expect(await r4.json()).toEqual({
            error: 'Bad request',
            message: "Invalid rarity requested: 'espectacular'."
        })
    })

    it('return on-chain emotes', async () => {
        const { emotesFetcher, content, localFetch, theGraph } = components

        const onChainEmotes = generateOnChainEmotes(5)
        emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: onChainEmotes,
            totalAmount: onChainEmotes.length
        })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const wallet = generateRandomAddress()
        const entities = generateEmoteEntities(5, (index) => onChainEmotes[index].urn)

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
            pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
        )

        const r = await localFetch.fetch(`/explorer/${wallet}/emotes`)

        expect(r.status).toBe(200)
        const response = (await r.json()) as { elements: MixedEmoteResponse[]; totalAmount: number; pageNum: number }

        expect(response.totalAmount).toBe(5)
        expect(response.pageNum).toBe(1)
        expect(response.elements.length).toBe(5)

        // Verify structure of on-chain emote
        const firstEmote = response.elements[0]
        expect(firstEmote).toHaveProperty('type', 'on-chain')
        expect(firstEmote).toHaveProperty('urn')
        expect(firstEmote).toHaveProperty('amount')
        expect(firstEmote).toHaveProperty('individualData')
        expect(firstEmote).toHaveProperty('entity')
        expect(firstEmote).toHaveProperty('rarity')
        expect(firstEmote).toHaveProperty('name')
        expect(firstEmote).toHaveProperty('category')

        // Verify minTransferredAt and maxTransferredAt are removed in the response
        expect(firstEmote).not.toHaveProperty('minTransferredAt')
        expect(firstEmote).not.toHaveProperty('maxTransferredAt')
    })

    it('return trimmed response when trimmed=true parameter is provided', async () => {
        const { emotesFetcher, content, localFetch, theGraph } = components

        const onChainEmotes = generateOnChainEmotes(3)
        emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: onChainEmotes,
            totalAmount: onChainEmotes.length
        })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const wallet = generateRandomAddress()
        const entities = generateEmoteEntities(3, (index) => onChainEmotes[index].urn)

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
            pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
        )

        const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true`)

        expect(r.status).toBe(200)
        const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[]; totalAmount: number; page: number }

        expect(response.totalAmount).toBe(3)
        expect(response.elements.length).toBe(3)

        const firstEmote = response.elements[0]
        expect(firstEmote).toHaveProperty('entity')
        expect(firstEmote.entity).toHaveProperty('id')
        expect(firstEmote.entity).toHaveProperty('metadata')

        // Verify the response only has entity property (no type, urn, amount, etc.)
        expect(Object.keys(firstEmote)).toEqual(['entity'])
    })

    it('return non-trimmed response when trimmed=false or not provided', async () => {
        const { emotesFetcher, content, localFetch, theGraph } = components

        const onChainEmotes = generateOnChainEmotes(2)
        emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: onChainEmotes,
            totalAmount: onChainEmotes.length
        })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const wallet = generateRandomAddress()
        const entities = generateEmoteEntities(2, (index) => onChainEmotes[index].urn)

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
            pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
        )

        const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=false`)

        expect(r.status).toBe(200)
        const response = (await r.json()) as { elements: MixedEmoteResponse[]; totalAmount: number; pageNum: number }

        expect(response.totalAmount).toBe(2)
        expect(response.elements.length).toBe(2)

        const firstEmote = response.elements[0]
        expect(firstEmote).toHaveProperty('type')
        expect(firstEmote).toHaveProperty('urn')
        expect(firstEmote).toHaveProperty('amount')
    })

    it('return full response when trimmed parameter has invalid value', async () => {
        const { emotesFetcher, content, localFetch, theGraph } = components

        const onChainEmotes = generateOnChainEmotes(2)
        emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: onChainEmotes,
            totalAmount: onChainEmotes.length
        })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const wallet = generateRandomAddress()
        const entities = generateEmoteEntities(2, (index) => onChainEmotes[index].urn)

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
            pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
        )

        const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=invalid`)

        expect(r.status).toBe(200)
        const response = (await r.json()) as { elements: MixedEmoteResponse[]; totalAmount: number; pageNum: number }

        expect(response.elements.length).toBe(2)
        expect(response.elements[0]).toHaveProperty('type')
    })

    it('return trimmed response when trimmed=1 parameter is provided', async () => {
        const { emotesFetcher, content, localFetch, theGraph } = components

        const onChainEmotes = generateOnChainEmotes(2)
        emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: onChainEmotes,
            totalAmount: onChainEmotes.length
        })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const wallet = generateRandomAddress()
        const entities = generateEmoteEntities(2, (index) => onChainEmotes[index].urn)

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
            pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
        )

        const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=1`)

        expect(r.status).toBe(200)
        const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[]; totalAmount: number; page: number }

        expect(response.elements.length).toBe(2)
        expect(Object.keys(response.elements[0])).toEqual(['entity'])
    })

    it('sort trimmed responses correctly', async () => {
        const { emotesFetcher, content, localFetch, theGraph } = components

        const onChainEmotes = generateOnChainEmotes(4)
        // Set different rarities for sorting
        onChainEmotes[0] = { ...onChainEmotes[0], rarity: 'common', name: 'emote-0' }
        onChainEmotes[1] = { ...onChainEmotes[1], rarity: 'rare', name: 'emote-1' }
        onChainEmotes[2] = { ...onChainEmotes[2], rarity: 'epic', name: 'emote-2' }
        onChainEmotes[3] = { ...onChainEmotes[3], rarity: 'legendary', name: 'emote-3' }

        emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: onChainEmotes,
            totalAmount: onChainEmotes.length
        })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const wallet = generateRandomAddress()
        const entities = generateEmoteEntities(4, (index) => onChainEmotes[index].urn)

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
            pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
        )

        // Test rarity sorting - legendary should come first when sorting DESC
        const r1 = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&orderBy=rarity&direction=DESC`)
        const response1 = (await r1.json()) as any
        expect(response1.elements[0].entity.id).toBe('urn-3') // legendary

        // Test that sorting works (order changes with different params)
        const r2 = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&orderBy=rarity&direction=ASC`)
        const response2 = (await r2.json()) as any
        expect(response2.elements[0].entity.id).not.toBe(response1.elements[0].entity.id)

        // Verify response structure is correct for trimmed
        const r3 = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true`)
        const response3 = (await r3.json()) as any
        expect(response3.elements.length).toBe(4)
        expect(response3.elements[0]).toHaveProperty('entity')
    })

    it('maintain backward compatibility with existing API', async () => {
        const { emotesFetcher, content, localFetch, theGraph } = components

        const onChainEmotes = generateOnChainEmotes(3)
        emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
            elements: onChainEmotes,
            totalAmount: onChainEmotes.length
        })
        theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

        const wallet = generateRandomAddress()
        const entities = generateEmoteEntities(3, (index) => onChainEmotes[index].urn)

        content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
            pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
        )

        // Test without any query parameters (default behavior)
        const r = await localFetch.fetch(`/explorer/${wallet}/emotes`)

        expect(r.status).toBe(200)
        const response = (await r.json()) as { elements: MixedEmoteResponse[]; totalAmount: number }

        expect(response.totalAmount).toBe(3)
        expect(response.elements).toHaveLength(3)

        // All emotes should be on-chain type
        expect(response.elements.every((e) => e.type === 'on-chain')).toBe(true)
    })

    describe('when includeAmount parameter is provided', () => {
        describe('and includeAmount is true with trimmed response', () => {
            let wallet: string
            let onChainEmotes: OnChainEmote[]
            let entities: Entity[]

            beforeEach(() => {
                const { emotesFetcher, content, theGraph } = components

                wallet = generateRandomAddress()
                onChainEmotes = generateOnChainEmotes(3)
                // Set different amounts
                onChainEmotes[0] = { ...onChainEmotes[0], individualData: [{}, {}, {}] as any } // 3 items
                onChainEmotes[1] = { ...onChainEmotes[1], individualData: [{}, {}] as any } // 2 items
                onChainEmotes[2] = { ...onChainEmotes[2], individualData: [{}] as any } // 1 item

                emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
                    elements: onChainEmotes,
                    totalAmount: onChainEmotes.length
                })
                theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

                entities = generateEmoteEntities(3, (index) => onChainEmotes[index].urn)

                content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
                    pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
                )
            })

            afterEach(() => {
                jest.resetAllMocks()
            })

            it('should include amount field in trimmed response when includeAmount=true', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&includeAmount=true`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                expect(response.elements[0]).toHaveProperty('amount', 3)
                expect(response.elements[1]).toHaveProperty('amount', 2)
                expect(response.elements[2]).toHaveProperty('amount', 1)
            })

            it('should include amount field when includeAmount=1', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&includeAmount=1`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                expect(response.elements[0]).toHaveProperty('amount', 3)
                expect(response.elements[1]).toHaveProperty('amount', 2)
                expect(response.elements[2]).toHaveProperty('amount', 1)
            })

            it('should calculate amount correctly from individualData length', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&includeAmount=true`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                response.elements.forEach((emote, index) => {
                    expect(emote.amount).toBe(onChainEmotes[index].individualData.length)
                })
            })
        })

        describe('and includeAmount is false or not provided with trimmed response', () => {
            let wallet: string
            let onChainEmotes: OnChainEmote[]
            let entities: Entity[]

            beforeEach(() => {
                const { emotesFetcher, content, theGraph } = components

                wallet = generateRandomAddress()
                onChainEmotes = generateOnChainEmotes(2)

                emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
                    elements: onChainEmotes,
                    totalAmount: onChainEmotes.length
                })
                theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

                entities = generateEmoteEntities(2, (index) => onChainEmotes[index].urn)

                content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
                    pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
                )
            })

            afterEach(() => {
                jest.resetAllMocks()
            })

            it('should not include amount field when includeAmount=false', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&includeAmount=false`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                expect(response.elements[0]).not.toHaveProperty('amount')
                expect(Object.keys(response.elements[0])).toEqual(['entity'])
            })

            it('should not include amount field when includeAmount is not provided', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                expect(response.elements[0]).not.toHaveProperty('amount')
                expect(Object.keys(response.elements[0])).toEqual(['entity'])
            })

            it('should not include amount field when includeAmount=0', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&includeAmount=0`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                expect(response.elements[0]).not.toHaveProperty('amount')
                expect(Object.keys(response.elements[0])).toEqual(['entity'])
            })

            it('should treat invalid includeAmount values as false', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?trimmed=true&includeAmount=invalid`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                expect(response.elements[0]).not.toHaveProperty('amount')
                expect(Object.keys(response.elements[0])).toEqual(['entity'])
            })
        })

        describe('and includeAmount is used with non-trimmed response', () => {
            let wallet: string
            let onChainEmotes: OnChainEmote[]
            let entities: Entity[]

            beforeEach(() => {
                const { emotesFetcher, content, theGraph } = components

                wallet = generateRandomAddress()
                onChainEmotes = generateOnChainEmotes(2)
                onChainEmotes[0] = { ...onChainEmotes[0], amount: 3, individualData: [{}, {}, {}] as any } // 3 items
                onChainEmotes[1] = { ...onChainEmotes[1], amount: 2, individualData: [{}, {}] as any } // 2 items

                emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
                    elements: onChainEmotes,
                    totalAmount: onChainEmotes.length
                })
                theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

                entities = generateEmoteEntities(2, (index) => onChainEmotes[index].urn)

                content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
                    pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
                )
            })

            afterEach(() => {
                jest.resetAllMocks()
            })

            it('should already have amount in non-trimmed response regardless of includeAmount', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(`/explorer/${wallet}/emotes?includeAmount=true`)

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteResponse[] }

                // Non-trimmed response always includes amount field
                expect(response.elements[0]).toHaveProperty('amount', 3)
                expect(response.elements[1]).toHaveProperty('amount', 2)
            })
        })

        describe('and includeAmount is combined with other filters', () => {
            let wallet: string
            let onChainEmotes: OnChainEmote[]
            let entities: Entity[]

            beforeEach(() => {
                const { emotesFetcher, content, theGraph } = components

                wallet = generateRandomAddress()
                onChainEmotes = generateOnChainEmotes(3)
                onChainEmotes[0] = {
                    ...onChainEmotes[0],
                    rarity: 'common',
                    individualData: [{}, {}, {}] as any
                }
                onChainEmotes[1] = {
                    ...onChainEmotes[1],
                    rarity: 'rare',
                    individualData: [{}, {}] as any
                }
                onChainEmotes[2] = {
                    ...onChainEmotes[2],
                    rarity: 'epic',
                    individualData: [{}] as any
                }

                emotesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue({
                    elements: onChainEmotes,
                    totalAmount: onChainEmotes.length
                })
                theGraph.maticCollectionsSubgraph.query = jest.fn().mockResolvedValue({ nfts: [] })

                entities = generateEmoteEntities(3, (index) => onChainEmotes[index].urn)

                content.fetchEntitiesByPointers = jest.fn(async (pointers) =>
                    pointers.map((pointer: string) => entities.find((entity) => entity.id === pointer))
                )
            })

            afterEach(() => {
                jest.resetAllMocks()
            })

            it('should work with includeAmount and sorting', async () => {
                const { localFetch } = components

                const r = await localFetch.fetch(
                    `/explorer/${wallet}/emotes?trimmed=true&includeAmount=true&orderBy=rarity&direction=DESC`
                )

                expect(r.status).toBe(200)
                const response = (await r.json()) as { elements: MixedEmoteTrimmedResponse[] }

                expect(response.elements[0]).toHaveProperty('amount', 1) // epic (highest rarity in set)
                expect(response.elements[0]).toHaveProperty('entity')
            })
        })
    })
})
