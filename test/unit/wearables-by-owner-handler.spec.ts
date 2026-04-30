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

  let owner: string
  let components: ReturnType<typeof buildComponents>

  function buildComponents() {
    return {
      wearablesFetcher: makeOwnedFetcherMock(),
      wearableDefinitionsFetcher: makeDefinitionsFetcherMock(),
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
      components.wearablesFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [wearableA, wearableB],
        totalAmount: 2
      })
    })

    it('should query the on-chain wearables fetcher with the owner address and skip the definitions fetcher', async () => {
      await wearablesByOwnerHandler(buildContext(`/collections/wearables-by-owner/${owner}`))

      expect(components.wearablesFetcher.fetchOwnedElements).toHaveBeenCalledWith(owner)
      expect(components.wearableDefinitionsFetcher.fetchItemsDefinitions).not.toHaveBeenCalled()
    })

    it('should respond 200 with one urn+amount entry per owned wearable and no definition field', async () => {
      const response = await wearablesByOwnerHandler(buildContext(`/collections/wearables-by-owner/${owner}`))

      expect(response.status).toBe(200)
      expect(response.body).toEqual([
        { urn: wearableA.urn, amount: 2 },
        { urn: wearableB.urn, amount: 1 }
      ])
    })
  })

  describe('when called with ?includeDefinitions', () => {
    let urlPath: string

    beforeEach(() => {
      urlPath = `/collections/wearables-by-owner/${owner}?includeDefinitions`
    })

    describe('and the definitions fetcher resolves a definition for the owned urn', () => {
      let definition: WearableDefinition

      beforeEach(() => {
        definition = { id: wearableA.urn, name: 'A def' } as WearableDefinition
        components.wearablesFetcher.fetchOwnedElements.mockResolvedValueOnce({
          elements: [wearableA],
          totalAmount: 1
        })
        components.wearableDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([definition])
      })

      it('should call the definitions fetcher with the owned urns', async () => {
        await wearablesByOwnerHandler(buildContext(urlPath))

        expect(components.wearableDefinitionsFetcher.fetchItemsDefinitions).toHaveBeenCalledWith([wearableA.urn])
      })

      it('should attach the definition to each urn+amount entry', async () => {
        const response = await wearablesByOwnerHandler(buildContext(urlPath))

        expect(response.body).toEqual([{ urn: wearableA.urn, amount: 2, definition }])
      })
    })

    describe('and the definitions fetcher cannot resolve a definition for the owned urn', () => {
      beforeEach(() => {
        components.wearablesFetcher.fetchOwnedElements.mockResolvedValueOnce({
          elements: [wearableA],
          totalAmount: 1
        })
        components.wearableDefinitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([undefined])
      })

      it('should leave the definition field undefined on the entry', async () => {
        const response = await wearablesByOwnerHandler(buildContext(urlPath))

        expect(response.body).toEqual([{ urn: wearableA.urn, amount: 2, definition: undefined }])
      })
    })
  })

  describe('when ?collectionId is a valid third-party collection URN', () => {
    const thirdPartyCollection = 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'
    let thirdPartyItem: { urn: string; amount: number; individualData: { id: string }[]; name: string; category: string; entity: any }
    let urlPath: string
    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      thirdPartyItem = {
        urn: `${thirdPartyCollection}:asset-1`,
        amount: 3,
        individualData: [{ id: '1' }],
        name: 'tp',
        category: 'hat',
        entity: {} as any
      }
      urlPath = `/collections/wearables-by-owner/${owner}?collectionId=${encodeURIComponent(thirdPartyCollection)}`
      fetchSpy = jest.spyOn(fetchThirdPartyModule, 'fetchThirdPartyWearablesFromThirdPartyName')
      fetchSpy.mockResolvedValueOnce([thirdPartyItem])
    })

    afterEach(() => {
      fetchSpy.mockRestore()
    })

    it('should delegate to fetchThirdPartyWearablesFromThirdPartyName with the parsed third-party urn and skip the on-chain fetcher', async () => {
      await wearablesByOwnerHandler(buildContext(urlPath))

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(Object),
        owner,
        expect.objectContaining({ thirdPartyName: 'baby-doge-coin' })
      )
      expect(components.wearablesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
    })

    it('should respond with the third-party item mapped to the urn+amount shape', async () => {
      const response = await wearablesByOwnerHandler(buildContext(urlPath))

      expect(response.body).toEqual([{ urn: thirdPartyItem.urn, amount: 3 }])
    })
  })

  describe('when ?collectionId is not a third-party collection URN', () => {
    let context: ReturnType<typeof buildContext>

    beforeEach(() => {
      context = buildContext(
        `/collections/wearables-by-owner/${owner}?collectionId=urn:decentraland:off-chain:base-avatars`
      )
    })

    it("should reject with InvalidRequestError and never call the on-chain fetcher", async () => {
      await expect(wearablesByOwnerHandler(context)).rejects.toThrow(InvalidRequestError)
      expect(components.wearablesFetcher.fetchOwnedElements).not.toHaveBeenCalled()
    })
  })
})
