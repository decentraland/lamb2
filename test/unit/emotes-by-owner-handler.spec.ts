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
  const owner = generateRandomAddress()
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

  function buildComponents() {
    return {
      emotesFetcher: makeOwnedFetcherMock(),
      emoteDefinitionsFetcher: makeDefinitionsFetcherMock(),
      ...buildOwnerHandlerSharedComponents()
    }
  }

  function buildContext(components: ReturnType<typeof buildComponents>, urlPath: string) {
    return {
      components,
      params: { owner },
      url: new URL(`http://localhost${urlPath}`)
    } as any
  }

  describe('when called without query params', () => {
    it('should return owned emotes as urn+amount entries', async () => {
      const components = buildComponents()
      components.emotesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [emoteA, emoteB],
        totalAmount: 2
      })

      const response = await emotesByOwnerHandler(buildContext(components, `/collections/emotes-by-owner/${owner}`))

      expect(components.emotesFetcher.fetchOwnedElements).toHaveBeenCalledWith(owner)
      expect(components.emoteDefinitionsFetcher.fetchItemsDefinitions).not.toHaveBeenCalled()
      expect(response.body).toEqual([
        { urn: emoteA.urn, amount: 2 },
        { urn: emoteB.urn, amount: 1 }
      ])
    })
  })

  describe('when called with ?includeDefinitions', () => {
    it('should attach the emote definition to each entry', async () => {
      const components = buildComponents()
      const definition = { id: emoteA.urn, name: 'A def' } as EmoteDefinition
      components.emotesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [emoteA],
        totalAmount: 1
      })
      components.emoteDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([definition])

      const response = await emotesByOwnerHandler(
        buildContext(components, `/collections/emotes-by-owner/${owner}?includeDefinitions`)
      )

      expect(components.emoteDefinitionsFetcher.fetchItemsDefinitions).toHaveBeenCalledWith([emoteA.urn])
      expect(response.body).toEqual([{ urn: emoteA.urn, amount: 2, definition }])
    })

    it('should return undefined definition when the fetcher cannot resolve one', async () => {
      const components = buildComponents()
      components.emotesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [emoteA],
        totalAmount: 1
      })
      components.emoteDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([undefined])

      const response = await emotesByOwnerHandler(
        buildContext(components, `/collections/emotes-by-owner/${owner}?includeDefinitions`)
      )

      expect(response.body).toEqual([{ urn: emoteA.urn, amount: 2, definition: undefined }])
    })
  })

  describe('when ?collectionId is a valid third-party collection URN', () => {
    const thirdPartyCollection = 'urn:decentraland:matic:collections-thirdparty:cryptoavatars'
    const thirdPartyItem = {
      urn: `${thirdPartyCollection}:asset-1`,
      amount: 4,
      individualData: [{ id: '1' }],
      name: 'tp emote',
      category: 'dance',
      entity: {} as any
    }

    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      fetchSpy = jest.spyOn(fetchThirdPartyModule, 'fetchThirdPartyWearablesFromThirdPartyName')
    })

    afterEach(() => {
      fetchSpy.mockRestore()
    })

    it('should delegate to fetchThirdPartyWearablesFromThirdPartyName and map to urn+amount', async () => {
      fetchSpy.mockResolvedValueOnce([thirdPartyItem])
      const components = buildComponents()

      const response = await emotesByOwnerHandler(
        buildContext(
          components,
          `/collections/emotes-by-owner/${owner}?collectionId=${encodeURIComponent(thirdPartyCollection)}`
        )
      )

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(Object),
        owner,
        expect.objectContaining({ thirdPartyName: 'cryptoavatars' })
      )
      expect(components.emotesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
      expect(response.body).toEqual([{ urn: thirdPartyItem.urn, amount: 4 }])
    })
  })

  describe('when ?collectionId is not a third-party collection URN', () => {
    it('should throw InvalidRequestError', async () => {
      const components = buildComponents()
      const context = buildContext(
        components,
        `/collections/emotes-by-owner/${owner}?collectionId=urn:decentraland:matic:collections-v2:0xabc:0`
      )

      await expect(emotesByOwnerHandler(context)).rejects.toThrow(InvalidRequestError)
      expect(components.emotesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
    })
  })
})
