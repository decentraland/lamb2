import { test } from '../../../components'
import {
  fetchAllThirdPartyWearables,
  fetchThirdPartyWearablesFromThirdPartyName
} from '../../../../src/logic/fetch-elements/fetch-third-party-wearables'
import { ThirdPartyAsset, ThirdPartyWearable } from '../../../../src/types'
import { generateWearableEntities, generateWearableEntity, getThirdPartyProviders } from '../../../data/wearables'
import { WearableCategory } from '@dcl/schemas'
import { parseUrn } from '@dcl/urn-resolver'
import { FetcherError } from '../../../../src/adapters/elements-fetcher'

describe('fetchAllThirdPartyWearables', () => {
  test('resolver apis is called correctly', function ({ components }) {
    it('run test', async () => {
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue(getThirdPartyProviders())
      const fetchSpy = jest.spyOn(components.fetch, 'fetch').mockImplementation(
        jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                address: 'anAddress',
                total: 2,
                page: 1,
                assets: [],
                next: ''
              })
          })
        ) as jest.Mock
      )
      await fetchAllThirdPartyWearables(components, 'anAddress')
      expect(fetchSpy).toBeCalledWith(
        'https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets',
        expect.anything()
      )
      expect(fetchSpy).toBeCalledWith(
        'https://api.cryptoavatars.io/registry/cryptoavatars/address/anAddress/assets',
        expect.anything()
      )
      expect(fetchSpy).toBeCalledWith(
        'https://wearables-api.unxd.com/registry/dolcegabbana-disco-drip/address/anAddress/assets',
        expect.anything()
      )
    })
  })

  test('third-party wearables are mapped correctly', function ({ components }) {
    it('run test', async () => {
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue([getThirdPartyProviders()[0]])
      jest.spyOn(components.fetch, 'fetch').mockImplementation(
        jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                address: 'anAddress',
                total: 2,
                page: 1,
                assets: [
                  { id: 'id1', amount: 1, urn: { decentraland: 'urn1' } },
                  { id: 'id2', amount: 1, urn: { decentraland: 'urn2' } }
                ] as ThirdPartyAsset[],
                next: ''
              })
          })
        ) as jest.Mock
      )
      const entities = generateWearableEntities(['urn1', 'urn2'])
      jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue(entities)
      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')
      expect(wearables).toEqual([
        expect.objectContaining({
          urn: 'urn1',
          amount: 1,
          individualData: [{ id: 'id1' }],
          name: 'nameForurn1',
          entity: expect.anything()
        }),
        expect.objectContaining({ urn: 'urn2', amount: 1, individualData: [{ id: 'id2' }], name: 'nameForurn2' })
      ] as ThirdPartyWearable[])
    })
  })

  test('third-party wearables are grouped by urn', function ({ components }) {
    it('run test', async () => {
      const entities = generateWearableEntities(['urn1', 'urn2'])
      jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue(entities)
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue([getThirdPartyProviders()[0]])
      jest.spyOn(components.fetch, 'fetch').mockImplementation(
        jest.fn(() =>
          Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                address: 'anAddress',
                total: 2,
                page: 1,
                assets: [
                  { id: 'id1', amount: 1, urn: { decentraland: 'urn1' } },
                  { id: 'id2', amount: 1, urn: { decentraland: 'urn2' } },
                  { id: 'id3', amount: 1, urn: { decentraland: 'urn1' } }
                ] as ThirdPartyAsset[],
                next: ''
              })
          })
        ) as jest.Mock
      )
      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')
      expect(wearables).toMatchObject([
        {
          urn: 'urn1',
          amount: 2,
          individualData: [{ id: 'id1' }, { id: 'id3' }],
          name: entities[0].metadata.name
        },
        {
          urn: 'urn2',
          amount: 1,
          individualData: [{ id: 'id2' }],
          name: entities[1].metadata.name
        }
      ] as ThirdPartyWearable[])
    })
  })

  test('multiple pages from same api are called', function ({ components }) {
    it('run test', async () => {
      jest.spyOn(components.thirdPartyProvidersStorage, 'getAll').mockResolvedValue([getThirdPartyProviders()[0]])

      const jsonMock = jest
        .fn()
        .mockResolvedValueOnce({
          address: 'anAddress',
          total: 2,
          page: 1,
          assets: [],
          next: 'https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets?nextPage'
        })
        .mockResolvedValueOnce({ address: 'anAddress', total: 2, page: 1, assets: [], next: '' })

      const fetchSpy = (components.fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: jsonMock }))
      await fetchAllThirdPartyWearables(components, 'anAddress')
      expect(fetchSpy).toBeCalledTimes(2)
      expect(fetchSpy).toBeCalledWith(
        'https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets',
        expect.anything()
      )
      expect(fetchSpy).toBeCalledWith(
        'https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets?nextPage',
        expect.anything()
      )
    })
  })
})

describe('fetchThirdPartyWearablesFromThirdPartyName', () => {
  test('only assets from third party name are returned', function ({ components }) {
    it('run test', async () => {
      const thirdPartyWearables: ThirdPartyWearable[] = [
        {
          urn: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-collectionId:itemId',
          amount: 1,
          individualData: [{ id: 'id1' }],
          name: 'some-ntr1-name',
          category: WearableCategory.BODY_SHAPE,
          entity: generateWearableEntity(
            'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-collectionId:itemId'
          )
        },
        {
          urn: 'urn:decentraland:matic:collections-thirdparty:baby-dog:baby-dog-collection:itemId',
          amount: 1,
          individualData: [{ id: 'id2' }],
          name: 'some-baby-dog-name',
          category: WearableCategory.BODY_SHAPE,
          entity: generateWearableEntity(
            'urn:decentraland:matic:collections-thirdparty:baby-dog:baby-dog-collection:itemId'
          )
        },
        {
          urn: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars:cryptocollection:itemId',
          amount: 1,
          individualData: [{ id: 'id3' }],
          name: 'some-cryptoavatars-name',
          category: WearableCategory.BODY_SHAPE,
          entity: generateWearableEntity(
            'urn:decentraland:matic:collections-thirdparty:cryptoavatars:cryptocollection:itemId'
          )
        }
      ]
      jest.spyOn(components.thirdPartyProvidersStorage, 'get').mockResolvedValue({
        id: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta',
        resolver: 'ntr1-meta-resolver',
        metadata: {
          thirdParty: {
            name: 'ntr',
            description: 'ntr'
          }
        }
      })
      components.thirdPartyWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(thirdPartyWearables)

      const thirdPartyNameUrn = await parseUrn('urn:decentraland:matic:collections-thirdparty:ntr1-meta')
      if (thirdPartyNameUrn.type !== 'blockchain-collection-third-party-name') {
        throw new Error('test failed')
      }
      const wearables = await fetchThirdPartyWearablesFromThirdPartyName(components, 'anAddress', thirdPartyNameUrn)
      expect(wearables).toEqual([
        {
          urn: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-collectionId:itemId',
          amount: 1,
          individualData: [{ id: 'id1' }],
          name: 'some-ntr1-name',
          category: WearableCategory.BODY_SHAPE,
          entity: thirdPartyWearables[0].entity
        }
      ] as ThirdPartyWearable[])
    })
  })

  test('if thirdparty is nonexistent, it throws', function ({ components }) {
    it('run test', async () => {
      jest.spyOn(components.thirdPartyProvidersStorage, 'get').mockResolvedValue(undefined)
      components.thirdPartyWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue([])
      const nonExistentThirdPartyNameUrn = await parseUrn('urn:decentraland:matic:collections-thirdparty:non-exist')
      if (nonExistentThirdPartyNameUrn.type !== 'blockchain-collection-third-party-name') {
        throw new Error('test failed')
      }
      await expect(
        fetchThirdPartyWearablesFromThirdPartyName(components, 'anAddress', nonExistentThirdPartyNameUrn)
      ).rejects.toThrow(FetcherError)
    })
  })
})
