import { WearableDefinition } from '@dcl/schemas'
import { getItemsByOwner } from '../../../src/logic/items-by-owner'
import * as fetchThirdPartyModule from '../../../src/logic/fetch-elements/fetch-third-party-wearables'
import { InvalidRequestError } from '../../../src/types'
import {
  buildOwnerHandlerSharedComponents,
  makeDefinitionsFetcherMock,
  makeOwnedFetcherMock
} from '../../mocks/items-by-owner-fixtures'

describe('getItemsByOwner', () => {
  const owner = '0xabc'
  const ownedItem = {
    urn: 'urn:decentraland:matic:collections-v2:0xa:0',
    individualData: [{ id: '1' }, { id: '2' }, { id: '3' }]
  }

  function buildComponents() {
    return {
      ...buildOwnerHandlerSharedComponents(),
      ownedFetcher: makeOwnedFetcherMock(),
      definitionsFetcher: makeDefinitionsFetcherMock()
    }
  }

  describe('when no collectionId is provided', () => {
    it('should fetch owned on-chain items and return urn+amount entries', async () => {
      const components = buildComponents()
      components.ownedFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [ownedItem],
        totalAmount: 1
      })

      const result = await getItemsByOwner<WearableDefinition>(
        components,
        owner,
        new URL(`http://localhost/?`).searchParams
      )

      expect(components.ownedFetcher.fetchOwnedElements).toHaveBeenCalledWith(owner)
      expect(result).toEqual([{ urn: ownedItem.urn, amount: 3 }])
    })
  })

  describe('when ?includeDefinitions is set', () => {
    const definition = { id: ownedItem.urn, name: 'A' } as WearableDefinition

    it('should attach the definition to the entry', async () => {
      const components = buildComponents()
      components.ownedFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [ownedItem],
        totalAmount: 1
      })
      components.definitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([definition])

      const result = await getItemsByOwner<WearableDefinition>(
        components,
        owner,
        new URL(`http://localhost/?includeDefinitions`).searchParams
      )

      expect(components.definitionsFetcher.fetchItemsDefinitions).toHaveBeenCalledWith([ownedItem.urn])
      expect(result).toEqual([{ urn: ownedItem.urn, amount: 3, definition }])
    })
  })

  describe('when ?collectionId points at a third-party collection', () => {
    const thirdPartyCollection = 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'

    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      fetchSpy = jest.spyOn(fetchThirdPartyModule, 'fetchThirdPartyWearablesFromThirdPartyName')
    })

    afterEach(() => {
      fetchSpy.mockRestore()
    })

    it('should delegate to the third-party fetcher and skip the on-chain owned fetcher', async () => {
      fetchSpy.mockResolvedValueOnce([
        {
          urn: `${thirdPartyCollection}:asset-1`,
          amount: 5,
          individualData: [{ id: '1' }],
          name: 'tp',
          category: 'hat',
          entity: {} as any
        }
      ])
      const components = buildComponents()

      const result = await getItemsByOwner<WearableDefinition>(
        components,
        owner,
        new URL(`http://localhost/?collectionId=${encodeURIComponent(thirdPartyCollection)}`).searchParams
      )

      expect(components.ownedFetcher.fetchOwnedElements).not.toHaveBeenCalled()
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(Object),
        owner,
        expect.objectContaining({ thirdPartyName: 'baby-doge-coin' })
      )
      expect(result).toEqual([{ urn: `${thirdPartyCollection}:asset-1`, amount: 5 }])
    })
  })

  describe('when ?collectionId is not a third-party collection URN', () => {
    it('should throw InvalidRequestError', async () => {
      const components = buildComponents()

      await expect(
        getItemsByOwner<WearableDefinition>(
          components,
          owner,
          new URL(`http://localhost/?collectionId=urn:decentraland:off-chain:base-avatars`).searchParams
        )
      ).rejects.toThrow(InvalidRequestError)
    })
  })
})
