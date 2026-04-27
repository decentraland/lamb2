import { WearableDefinition } from '@dcl/schemas'
import { wearablesByOwnerHandler } from '../../src/controllers/handlers/wearables-by-owner-handler'
import * as fetchThirdPartyModule from '../../src/logic/fetch-elements/fetch-third-party-wearables'
import { InvalidRequestError, OnChainWearable } from '../../src/types'
import { generateRandomAddress } from '../helpers'
import {
  buildOwnerHandlerSharedComponents,
  makeDefinitionsFetcherMock,
  makeOwnedFetcherMock
} from '../mocks/items-by-owner-fixtures'

describe('wearables-by-owner-handler: GET /collections/wearables-by-owner/:owner', () => {
  const owner = generateRandomAddress()
  const wearableA: OnChainWearable = {
    urn: 'urn:decentraland:matic:collections-v2:0xa:0',
    name: 'A',
    rarity: 'common',
    category: 'hat' as any,
    amount: 2,
    individualData: [
      { id: 'a:1', tokenId: '1', transferredAt: 0, price: 0 },
      { id: 'a:2', tokenId: '2', transferredAt: 0, price: 0 }
    ],
    minTransferredAt: 0,
    maxTransferredAt: 0
  }
  const wearableB: OnChainWearable = {
    ...wearableA,
    urn: 'urn:decentraland:matic:collections-v2:0xb:0',
    name: 'B',
    amount: 1,
    individualData: [{ id: 'b:1', tokenId: '1', transferredAt: 0, price: 0 }]
  }

  function buildComponents() {
    return {
      wearablesFetcher: makeOwnedFetcherMock(),
      wearableDefinitionsFetcher: makeDefinitionsFetcherMock(),
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
    it('should return owned wearables as urn+amount entries', async () => {
      const components = buildComponents()
      components.wearablesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [wearableA, wearableB],
        totalAmount: 2
      })

      const response = await wearablesByOwnerHandler(
        buildContext(components, `/collections/wearables-by-owner/${owner}`)
      )

      expect(components.wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(owner)
      expect(components.wearableDefinitionsFetcher.fetchItemsDefinitions).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(response.body).toEqual([
        { urn: wearableA.urn, amount: 2 },
        { urn: wearableB.urn, amount: 1 }
      ])
    })
  })

  describe('when called with ?includeDefinitions', () => {
    it('should attach the wearable definition to each entry', async () => {
      const components = buildComponents()
      const definition = { id: wearableA.urn, name: 'A def' } as WearableDefinition
      components.wearablesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [wearableA],
        totalAmount: 1
      })
      components.wearableDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([definition])

      const response = await wearablesByOwnerHandler(
        buildContext(components, `/collections/wearables-by-owner/${owner}?includeDefinitions`)
      )

      expect(components.wearableDefinitionsFetcher.fetchItemsDefinitions).toHaveBeenCalledWith([wearableA.urn])
      expect(response.body).toEqual([{ urn: wearableA.urn, amount: 2, definition }])
    })

    it('should return undefined definition when the fetcher cannot resolve one', async () => {
      const components = buildComponents()
      components.wearablesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [wearableA],
        totalAmount: 1
      })
      components.wearableDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([undefined])

      const response = await wearablesByOwnerHandler(
        buildContext(components, `/collections/wearables-by-owner/${owner}?includeDefinitions`)
      )

      expect(response.body).toEqual([{ urn: wearableA.urn, amount: 2, definition: undefined }])
    })
  })

  describe('when ?collectionId is a valid third-party collection URN', () => {
    const thirdPartyCollection = 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'
    const thirdPartyWearable = {
      urn: `${thirdPartyCollection}:asset-1`,
      amount: 3,
      individualData: [{ id: '1' }],
      name: 'tp',
      category: 'hat',
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
      fetchSpy.mockResolvedValueOnce([thirdPartyWearable])
      const components = buildComponents()

      const response = await wearablesByOwnerHandler(
        buildContext(
          components,
          `/collections/wearables-by-owner/${owner}?collectionId=${encodeURIComponent(thirdPartyCollection)}`
        )
      )

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(Object),
        owner,
        expect.objectContaining({ thirdPartyName: 'baby-doge-coin' })
      )
      expect(components.wearablesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
      expect(response.body).toEqual([{ urn: thirdPartyWearable.urn, amount: 3 }])
    })
  })

  describe('when ?collectionId is not a third-party collection URN', () => {
    it('should throw InvalidRequestError', async () => {
      const components = buildComponents()
      const context = buildContext(
        components,
        `/collections/wearables-by-owner/${owner}?collectionId=urn:decentraland:off-chain:base-avatars`
      )

      await expect(wearablesByOwnerHandler(context)).rejects.toThrow(InvalidRequestError)
      expect(components.wearablesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
    })
  })
})
