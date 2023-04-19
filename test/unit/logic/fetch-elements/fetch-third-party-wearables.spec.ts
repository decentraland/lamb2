import { test } from '../../../components'
// import { fetchAllThirdPartyWearables, fetchThirdPartyWearablesFromThirdPartyName, ThirdPartyNotFoundError } from '../../../../src/logic/fetch-elements/fetch-third-party-wearables'
import { fetchAllThirdPartyWearables } from '../../../../src/logic/fetch-elements/fetch-third-party-wearables'
import { ThirdPartyAsset, ThirdPartyWearable } from '../../../../src/types'
import { generateWearableContentDefinitions } from '../../../data/wearables'
// import { parseUrn } from '@dcl/urn-resolver'

describe('fetchAllThirdPartyWearables', () => {
  // test('resolver apis is called correctly', function ({ components }) {
  //   it('run test', async () => {
  //     jest.spyOn(components.thirdPartyProvidersFetcher, 'getAll').mockResolvedValue([
  //       {
  //         "id": "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
  //         "resolver": "https://decentraland-api.babydoge.com/v1"
  //       },
  //       {
  //         "id": "urn:decentraland:matic:collections-thirdparty:cryptoavatars",
  //         "resolver": "https://api.cryptoavatars.io/"
  //       },
  //       {
  //         "id": "urn:decentraland:matic:collections-thirdparty:dolcegabbana-disco-drip",
  //         "resolver": "https://wearables-api.unxd.com"
  //       }
  //     ])
  //     const fetchSpy = jest.spyOn(components.fetch, 'fetch').mockImplementation(
  //       jest.fn(
  //         () => Promise.resolve({
  //           ok: true,
  //           json: () => Promise.resolve({
  //             address: 'anAddress',
  //             total: 2,
  //             page: 1,
  //             assets: [],
  //             next: ''
  //           }),
  //         }),
  //       ) as jest.Mock)
  //     await fetchAllThirdPartyWearables(components, 'anAddress')
  //     expect(fetchSpy).toBeCalledWith('https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets', expect.anything())
  //     expect(fetchSpy).toBeCalledWith('https://api.cryptoavatars.io/registry/cryptoavatars/address/anAddress/assets', expect.anything())
  //     expect(fetchSpy).toBeCalledWith('https://wearables-api.unxd.com/registry/dolcegabbana-disco-drip/address/anAddress/assets', expect.anything())
  //   })
  // })

  test('third-party wearables are mapped correctly', function ({ components }) {
    it('run test', async () => {
      jest.spyOn(components.thirdPartyProvidersFetcher, 'getAll').mockResolvedValue([
        {
          "id": "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
          "resolver": "https://decentraland-api.babydoge.com/v1"
        }
      ])
      jest.spyOn(components.fetch, 'fetch').mockImplementation(
        jest.fn(
          () => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              address: 'anAddress',
              total: 2,
              page: 1,
              assets: [
                { id: 'id1', amount: 1, urn: { decentraland: 'urn1' } },
                { id: 'id2', amount: 1, urn: { decentraland: 'urn2' } }
              ] as ThirdPartyAsset[],
              next: ''
            }),
          }),
        ) as jest.Mock)
      const definitions = generateWearableContentDefinitions(['urn1', 'urn2'])
      jest.spyOn(components.content, 'fetchEntitiesByPointers').mockResolvedValue(definitions)
      const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')
      expect(wearables).toEqual([
        expect.objectContaining({ urn: 'urn1', amount: 1, individualData: [{ id: 'id1' }], name: 'nameForurn1', definition: expect.anything() }),
        expect.objectContaining({ urn: 'urn2', amount: 1, individualData: [{ id: 'id2' }], name: 'nameForurn2' })
      ] as ThirdPartyWearable[])
    })
  })

  // test('third-party wearables are grouped by urn', function ({ components }) {
  //   it('run test', async () => {
  //     jest.spyOn(components.thirdPartyProvidersFetcher, 'getAll').mockResolvedValue([
  //       {
  //         "id": "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
  //         "resolver": "https://decentraland-api.babydoge.com/v1"
  //       }
  //     ])
  //     jest.spyOn(components.fetch, 'fetch').mockImplementation(
  //       jest.fn(
  //         () => Promise.resolve({
  //           ok: true,
  //           json: () => Promise.resolve({
  //             address: 'anAddress',
  //             total: 2,
  //             page: 1,
  //             assets: [
  //               { id: 'id1', amount: 1, urn: { decentraland: 'urn1' } },
  //               { id: 'id2', amount: 1, urn: { decentraland: 'urn2' } },
  //               { id: 'id3', amount: 1, urn: { decentraland: 'urn1' } }
  //             ] as ThirdPartyAsset[],
  //             next: ''
  //           }),
  //         }),
  //       ) as jest.Mock)
  //     const wearables = await fetchAllThirdPartyWearables(components, 'anAddress')
  //     expect(wearables).toEqual([
  //       { urn: 'urn1', amount: 2, individualData: [{ id: 'id1' }, { id: 'id3' }] },
  //       { urn: 'urn2', amount: 1, individualData: [{ id: 'id2' }] }
  //     ] as ThirdPartyWearable[])
  //   })
  // })

  // test('multiple pages from same api are called', function ({ components }) {
  //   it('run test', async () => {
  //     jest.spyOn(components.thirdPartyProvidersFetcher, 'getAll').mockResolvedValue([
  //       {
  //         "id": "urn:decentraland:matic:collections-thirdparty:baby-doge-coin",
  //         "resolver": "https://decentraland-api.babydoge.com/v1"
  //       }
  //     ])

  //     const jsonMock = jest.fn()
  //       .mockResolvedValueOnce({ address: 'anAddress', total: 2, page: 1, assets: [], next: 'https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets?nextPage' })
  //       .mockResolvedValueOnce({ address: 'anAddress', total: 2, page: 1, assets: [], next: '' })

  //     const fetchSpy = components.fetch.fetch = jest.fn().mockResolvedValue({ ok: true, json: jsonMock })
  //     await fetchAllThirdPartyWearables(components, 'anAddress')
  //     expect(fetchSpy).toBeCalledTimes(2)
  //     expect(fetchSpy).toBeCalledWith('https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets', expect.anything())
  //     expect(fetchSpy).toBeCalledWith('https://decentraland-api.babydoge.com/v1/registry/baby-doge-coin/address/anAddress/assets?nextPage', expect.anything())
  //   })
  // })
})

// describe('fetchThirdPartyWearablesFromThirdPartyName', () => {

//   test('only assets from third party name are returned', function ({ components }) {
//     it('run test', async () => {
//       const thirdPartyWearables: ThirdPartyWearable[] = [
//         { urn: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-collectionId:itemId', amount: 1, individualData: [{ id: 'id1' }] },
//         { urn: 'urn:decentraland:matic:collections-thirdparty:baby-dog:baby-dog-collection:itemId', amount: 1, individualData: [{ id: 'id2' }] },
//         { urn: 'urn:decentraland:matic:collections-thirdparty:cryptoavatars:cryptocollection:itemId', amount: 1, individualData: [{ id: 'id3' }] }
//       ]
//       jest.spyOn(components.thirdPartyProvidersFetcher, 'get').mockResolvedValue({
//         "id": "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
//         "resolver": "ntr1-meta-resolver"
//       })
//       components.thirdPartyWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue(thirdPartyWearables)

//       const thirdPartyNameUrn = await parseUrn("urn:decentraland:matic:collections-thirdparty:ntr1-meta")
//       if (thirdPartyNameUrn.type !== 'blockchain-collection-third-party-name') {
//         throw new Error('test failed')
//       }
//       const wearables = await fetchThirdPartyWearablesFromThirdPartyName(components, 'anAddress', thirdPartyNameUrn)
//       expect(wearables).toEqual([
//         { urn: 'urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-collectionId:itemId', amount: 1, individualData: [{ id: 'id1' }] }
//       ] as ThirdPartyWearable[])
//     })
//   })

//   test('if thirdparty is nonexistent, it throws', function ({ components }) {
//     it('run test', async () => {
//       jest.spyOn(components.thirdPartyProvidersFetcher, 'get').mockResolvedValue(undefined)
//       components.thirdPartyWearablesFetcher.fetchOwnedElements = jest.fn().mockResolvedValue([])
//       const nonExistentThirdPartyNameUrn = await parseUrn("urn:decentraland:matic:collections-thirdparty:non-exist")
//       if (nonExistentThirdPartyNameUrn.type !== 'blockchain-collection-third-party-name') {
//         throw new Error('test failed')
//       }
//       await expect(fetchThirdPartyWearablesFromThirdPartyName(components, 'anAddress', nonExistentThirdPartyNameUrn)).rejects.toThrow(ThirdPartyNotFoundError)
//     })
//   })

// })
