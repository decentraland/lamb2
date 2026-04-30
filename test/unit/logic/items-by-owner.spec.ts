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

  let components: ReturnType<typeof buildComponents>

  function buildComponents() {
    return {
      ...buildOwnerHandlerSharedComponents(),
      ownedFetcher: makeOwnedFetcherMock(),
      definitionsFetcher: makeDefinitionsFetcherMock()
    }
  }

  beforeEach(() => {
    components = buildComponents()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when no collectionId is provided', () => {
    let searchParams: URLSearchParams

    beforeEach(() => {
      components.ownedFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [ownedItem],
        totalAmount: 1
      })
      searchParams = new URL('http://localhost/?').searchParams
    })

    it('should call the on-chain owned fetcher with the owner address', async () => {
      await getItemsByOwner<WearableDefinition>(components, owner, searchParams)

      expect(components.ownedFetcher.fetchOwnedElements).toHaveBeenCalledWith(owner)
    })

    it('should return one urn+amount entry per owned item with no definition field', async () => {
      const result = await getItemsByOwner<WearableDefinition>(components, owner, searchParams)

      expect(result).toEqual([{ urn: ownedItem.urn, amount: 3 }])
    })
  })

  describe('when ?includeDefinitions is set', () => {
    let definition: WearableDefinition
    let searchParams: URLSearchParams

    beforeEach(() => {
      definition = { id: ownedItem.urn, name: 'A' } as WearableDefinition
      components.ownedFetcher.fetchOwnedElements.mockResolvedValueOnce({
        elements: [ownedItem],
        totalAmount: 1
      })
      components.definitionsFetcher.fetchItemsDefinitions.mockResolvedValueOnce([definition])
      searchParams = new URL('http://localhost/?includeDefinitions').searchParams
    })

    it('should call the definitions fetcher with the owned urns', async () => {
      await getItemsByOwner<WearableDefinition>(components, owner, searchParams)

      expect(components.definitionsFetcher.fetchItemsDefinitions).toHaveBeenCalledWith([ownedItem.urn])
    })

    it('should attach the definition to the entry', async () => {
      const result = await getItemsByOwner<WearableDefinition>(components, owner, searchParams)

      expect(result).toEqual([{ urn: ownedItem.urn, amount: 3, definition }])
    })
  })

  describe('when ?collectionId points at a third-party collection', () => {
    const thirdPartyCollection = 'urn:decentraland:matic:collections-thirdparty:baby-doge-coin'
    let fetchSpy: jest.SpyInstance
    let searchParams: URLSearchParams

    beforeEach(() => {
      fetchSpy = jest.spyOn(fetchThirdPartyModule, 'fetchThirdPartyWearablesFromThirdPartyName')
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
      searchParams = new URL(`http://localhost/?collectionId=${encodeURIComponent(thirdPartyCollection)}`).searchParams
    })

    afterEach(() => {
      fetchSpy.mockRestore()
    })

    it('should delegate to the third-party fetcher with the parsed urn and skip the on-chain owned fetcher', async () => {
      await getItemsByOwner<WearableDefinition>(components, owner, searchParams)

      expect(components.ownedFetcher.fetchOwnedElements).not.toHaveBeenCalled()
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(Object),
        owner,
        expect.objectContaining({ thirdPartyName: 'baby-doge-coin' })
      )
    })

    it('should return the third-party item mapped to the urn+amount shape', async () => {
      const result = await getItemsByOwner<WearableDefinition>(components, owner, searchParams)

      expect(result).toEqual([{ urn: `${thirdPartyCollection}:asset-1`, amount: 5 }])
    })
  })

  describe('when ?collectionId is not a third-party collection URN', () => {
    let searchParams: URLSearchParams

    beforeEach(() => {
      searchParams = new URL('http://localhost/?collectionId=urn:decentraland:off-chain:base-avatars').searchParams
    })

    it('should reject with InvalidRequestError', async () => {
      await expect(getItemsByOwner<WearableDefinition>(components, owner, searchParams)).rejects.toThrow(
        InvalidRequestError
      )
    })
  })
})
