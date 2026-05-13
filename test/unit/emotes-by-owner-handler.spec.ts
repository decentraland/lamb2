import { EmoteDefinition } from '@dcl/schemas'
import { emotesByOwnerHandler } from '../../src/controllers/handlers/emotes-by-owner-handler'
import * as fetchThirdPartyModule from '../../src/logic/fetch-elements/fetch-third-party-wearables'
import { InvalidRequestError, OnChainEmote } from '../../src/types'
import { generateRandomAddress } from '../helpers'
import {
  buildOwnerHandlerSharedComponents,
  makeDefinitionsFetcherMock,
  makeOwnedFetcherMock
} from '../mocks/items-by-owner-fixtures'

describe('emotes-by-owner-handler: GET /collections/emotes-by-owner/:owner', () => {
  const emoteA: OnChainEmote = {
    urn: 'urn:decentraland:matic:collections-v2:0xa:0',
    name: 'A',
    rarity: 'common',
    category: 'dance' as any,
    amount: 2,
    individualData: [
      { id: 'a:1', tokenId: '1', transferredAt: 0, price: 0 },
      { id: 'a:2', tokenId: '2', transferredAt: 0, price: 0 }
    ],
    minTransferredAt: 0,
    maxTransferredAt: 0
  }
  const emoteB: OnChainEmote = {
    ...emoteA,
    urn: 'urn:decentraland:matic:collections-v2:0xb:0',
    name: 'B',
    amount: 1,
    individualData: [{ id: 'b:1', tokenId: '1', transferredAt: 0, price: 0 }]
  }

  let owner: string
  let components: ReturnType<typeof buildComponents>

  function buildComponents() {
    return {
      emotesFetcher: makeOwnedFetcherMock(),
      emoteDefinitionsFetcher: makeDefinitionsFetcherMock(),
      ...buildOwnerHandlerSharedComponents()
    }
  }

  function buildContext(urlPath: string) {
    return {
      components,
      params: { owner },
      url: new URL(`http://localhost${urlPath}`)
    } as any
  }

  beforeEach(() => {
    owner = generateRandomAddress()
    components = buildComponents()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when called without query params', () => {
    beforeEach(() => {
      components.emotesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [emoteA, emoteB],
        totalAmount: 2
      })
    })

    it('should query the on-chain emotes fetcher with the owner address and skip the definitions fetcher', async () => {
      await emotesByOwnerHandler(buildContext(`/collections/emotes-by-owner/${owner}`))

      expect(components.emotesFetcher.fetchOwnedElements).toHaveBeenCalledWith(owner)
      expect(components.emoteDefinitionsFetcher.fetchItemsDefinitions).not.toHaveBeenCalled()
    })

    it('should respond with one urn+amount entry per owned emote and no definition field', async () => {
      const response = await emotesByOwnerHandler(buildContext(`/collections/emotes-by-owner/${owner}`))

      expect(response.body).toEqual([
        { urn: emoteA.urn, amount: 2 },
        { urn: emoteB.urn, amount: 1 }
      ])
    })
  })

  describe('when called with ?includeDefinitions', () => {
    let urlPath: string

    beforeEach(() => {
      urlPath = `/collections/emotes-by-owner/${owner}?includeDefinitions`
    })

    describe('and the definitions fetcher resolves a definition for the owned urn', () => {
      let definition: EmoteDefinition

      beforeEach(() => {
        definition = { id: emoteA.urn, name: 'A def' } as EmoteDefinition
        components.emotesFetcher.fetchOwnedElements.mockResolvedValueOnce({
          elements: [emoteA],
          totalAmount: 1
        })
        components.emoteDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([definition])
      })

      it('should call the definitions fetcher with the owned urns', async () => {
        await emotesByOwnerHandler(buildContext(urlPath))

        expect(components.emoteDefinitionsFetcher.fetchItemsDefinitions).toHaveBeenCalledWith([emoteA.urn])
      })

      it('should attach the definition to each urn+amount entry', async () => {
        const response = await emotesByOwnerHandler(buildContext(urlPath))

        expect(response.body).toEqual([{ urn: emoteA.urn, amount: 2, definition }])
      })
    })

    describe('and the definitions fetcher cannot resolve a definition for the owned urn', () => {
      beforeEach(() => {
        components.emotesFetcher.fetchOwnedElements.mockResolvedValueOnce({
          elements: [emoteA],
          totalAmount: 1
        })
        components.emoteDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([undefined])
      })

      it('should leave the definition field undefined on the entry', async () => {
        const response = await emotesByOwnerHandler(buildContext(urlPath))

        expect(response.body).toEqual([{ urn: emoteA.urn, amount: 2, definition: undefined }])
      })
    })
  })

  describe('when ?collectionId is a valid third-party collection URN', () => {
    const thirdPartyCollection = 'urn:decentraland:matic:collections-thirdparty:cryptoavatars'
    let thirdPartyItem: { urn: string; amount: number; individualData: { id: string }[]; name: string; category: string; entity: any }
    let urlPath: string
    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      thirdPartyItem = {
        urn: `${thirdPartyCollection}:asset-1`,
        amount: 4,
        individualData: [{ id: '1' }],
        name: 'tp emote',
        category: 'dance',
        entity: {} as any
      }
      urlPath = `/collections/emotes-by-owner/${owner}?collectionId=${encodeURIComponent(thirdPartyCollection)}`
      fetchSpy = jest.spyOn(fetchThirdPartyModule, 'fetchThirdPartyWearablesFromThirdPartyName')
      fetchSpy.mockResolvedValueOnce([thirdPartyItem])
    })

    afterEach(() => {
      fetchSpy.mockRestore()
    })

    it('should delegate to fetchThirdPartyWearablesFromThirdPartyName with the parsed third-party urn and skip the on-chain fetcher', async () => {
      await emotesByOwnerHandler(buildContext(urlPath))

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(Object),
        owner,
        expect.objectContaining({ thirdPartyName: 'cryptoavatars' })
      )
      expect(components.emotesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
    })

    it('should respond with the third-party item mapped to the urn+amount shape', async () => {
      const response = await emotesByOwnerHandler(buildContext(urlPath))

      expect(response.body).toEqual([{ urn: thirdPartyItem.urn, amount: 4 }])
    })
  })

  describe('when ?collectionId is not a third-party collection URN', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      context = buildContext(
        `/collections/emotes-by-owner/${owner}?collectionId=urn:decentraland:matic:collections-v2:0xabc:0`
      )
    })

    it('should reject with InvalidRequestError and never call the on-chain fetcher', async () => {
      await expect(emotesByOwnerHandler(context)).rejects.toThrow(InvalidRequestError)
      expect(components.emotesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
    })
  })
})
