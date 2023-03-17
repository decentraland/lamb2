import { testWithComponents } from '../../components'
import {  generateThirdPartyWearables, getThirdPartyProviders } from '../../data/wearables'
import Wallet from 'ethereumjs-wallet'
import { createTheGraphComponentMock } from '../../mocks/the-graph-mock'

testWithComponents(() => {
    const theGraphMock = createTheGraphComponentMock()
    const resolverResponse = getThirdPartyProviders()
  
    theGraphMock.thirdPartyRegistrySubgraph.query = jest.fn().mockResolvedValue(resolverResponse)
    return {
      theGraphComponent: theGraphMock
    }
  })('third-party-wearables-handler: GET /users/:address/third-party-wearables with multiple providers should', function ({ components }) { 
    it('return wearables when found on a single provider', async () => {
      const { localFetch, fetch } = components
      const wearables = generateThirdPartyWearables(2)
  
      fetch.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('babydoge')) {
          return({ok: true, json: () => ({
            assets: wearables
          })})
        } else {
          return({ ok: true, json: () => ( { assets: [] } ) })
        }
      })
  
      const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)
  
      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({
        elements: convertToDataModel(wearables),
        totalAmount: 2,
        pageNum: 1,
        pageSize: 100
      })
    })

    it('return wearables when found on multiple providers', async () => {
        const { localFetch, fetch } = components
        const wearables = generateThirdPartyWearables(6)
    
        fetch.fetch = jest.fn().mockImplementation((url) => {
          if (url.includes('babydoge')) {
            return({ok: true, json: () => ({
              assets: wearables.slice(0, 2)
            })})
          }

          if (url.includes('cryptoavatars')) {
            return({ok: true, json: () => ({
              assets: wearables.slice(2, 4)
            })})
          }

          if (url.includes('unxd')) {
            return({ok: true, json: () => ({
              assets: wearables.slice(4, 6)
            })})
          }
        })
    
        const r = await localFetch.fetch(`/users/${Wallet.generate().getAddressString()}/third-party-wearables`)
    
        expect(r.status).toBe(200)
        expect(await r.json()).toEqual({
          elements: convertToDataModel(wearables),
          totalAmount: 6,
          pageNum: 1,
          pageSize: 100
        })
      })
  })

function convertToDataModel(wearables, definitions = undefined) {
    return wearables.map(wearable => {
        const definition = definitions?.find(def => def.id === wearable.urn.decentraland)
        const definitionData = definition?.metadata?.data

        return {
            amount: wearable.amount,
            individualData: [
                {
                id: wearable.id
                }
            ],
            urn: wearable.urn.decentraland,
            ...(definitions ? {
                definition: definitionData && {
                id: wearable.urn.decentraland,
                data: {
                    ...definitionData,
                    representations: [{ contents: [{ key: definitionData.representations[0]?.contents[0] }] }]
                }
                }
            } : {})
        }
    })
}