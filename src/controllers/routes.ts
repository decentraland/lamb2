import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { allCollectionsHandler } from './handlers/all-collections-handler'
import { emotesHandler } from './handlers/emotes-handler'
import { landsHandler } from './handlers/lands-handler'
import { namesHandler } from './handlers/names-handler'
import { oldWearablesHandler } from './handlers/old-wearables-handler'
import { profileHandler, profilesHandler } from './handlers/profiles-handler'
import { statusHandler } from './handlers/status-handler'
import {
  thirdPartyCollectionWearablesHandler,
  thirdPartyWearablesHandler
} from './handlers/third-party-wearables-handler'
import { wearablesHandler } from './handlers/wearables-handler'
import { explorerHandler } from './handlers/explorer-handler'
import { errorHandler } from './handlers/errorHandler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(errorHandler)

  router.get('/status', statusHandler)
  router.get('/users/:address/wearables', wearablesHandler)
  router.get('/users/:address/third-party-wearables', thirdPartyWearablesHandler)
  router.get('/users/:address/third-party-wearables/:collectionId', thirdPartyCollectionWearablesHandler)
  router.get('/users/:address/emotes', emotesHandler)
  router.get('/users/:address/names', namesHandler)
  router.get('/users/:address/lands', landsHandler)
  router.post('/profiles', profilesHandler)
  router.get('/profiles/:id', profileHandler)
  router.get('/nfts/collections', allCollectionsHandler)

  router.get('/explorer/:address/wearables', explorerHandler)

  // old routes to be deprecated
  router.get('/nfts/wearables/:id', oldWearablesHandler)
  router.get('/nfts/names/:address', async (context) => {
    const res = await namesHandler(context)
    if ('error' in res.body) {
      return res
    }
    return {
      status: res.status,
      body: {
        names: res.body.elements,
        totalAmount: res.body.totalAmount,
        pageNum: res.body.pageNum,
        pageSize: res.body.pageSize
      }
    }
  })
  router.get('/nfts/lands/:address', async (context) => {
    const res = await landsHandler(context)
    if ('error' in res.body) {
      return res
    }
    return {
      status: res.status,
      body: {
        lands: res.body.elements,
        totalAmount: res.body.totalAmount,
        pageNum: res.body.pageNum,
        pageSize: res.body.pageSize
      }
    }
  })
  router.get('/nfts/emotes/:address', async (context) => {
    const res = await emotesHandler(context)
    if ('error' in res.body) {
      return res
    }
    return {
      status: res.status,
      body: {
        emotes: res.body.elements,
        totalAmount: res.body.totalAmount,
        pageNum: res.body.pageNum,
        pageSize: res.body.pageSize
      }
    }
  })

  return router
}
