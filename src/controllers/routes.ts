import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { emotesHandler } from './handlers/emotes-handler'
import { landsHandler } from './handlers/lands-handler'
import { namesHandler } from './handlers/names-handler'
import { profilesHandler } from './handlers/profiles-handler'
import { statusHandler } from './handlers/status-handler'
import {
  wearablesHandler,
  thirdPartyWearablesHandler,
  thirdPartyCollectionWearablesHandler
} from './handlers/wearables-handler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()

  router.get('/status', statusHandler)

  // TODO: passport en lugar de users?
  router.get('/users/:address/wearables', wearablesHandler)
  router.get('/users/:address/third-party-wearables', thirdPartyWearablesHandler)
  router.get('/users/:address/third-party-wearables/:collectionId', thirdPartyCollectionWearablesHandler)

  router.get('/nfts/emotes/:id', emotesHandler)

  router.post('/profiles', profilesHandler)
  router.get('/nfts/names/:id', namesHandler)
  router.get('/nfts/lands/:id', landsHandler)

  return router
}
