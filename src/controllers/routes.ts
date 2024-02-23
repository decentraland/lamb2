import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { allCollectionsHandler } from './handlers/all-collections-handler'
import { emotesHandler } from './handlers/emotes-handler'
import { landsHandler } from './handlers/lands-handler'
import { namesHandler } from './handlers/names-handler'
import { profileHandler, profilesHandler } from './handlers/profiles-handler'
import { statusHandler } from './handlers/status-handler'
import {
  thirdPartyCollectionWearablesHandler,
  thirdPartyIntegrationsHandler,
  thirdPartyWearablesHandler
} from './handlers/third-party-wearables-handler'
import { wearablesHandler } from './handlers/wearables-handler'
import { explorerHandler } from './handlers/explorer-handler'
import { errorHandler } from './handlers/errorHandler'
import { aboutHandler } from './handlers/about-handler'
import { outfitsHandler } from './handlers/outfits-handler'
import { getCatalystServersHandler } from './handlers/catalyst-servers-handler'
import { getNameDenylistHandler } from './handlers/get-name-denylist-handler'
import { getPOIsHandler } from './handlers/get-pois-handler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(errorHandler)

  router.get('/status', statusHandler)
  router.get('/about', aboutHandler)
  router.get('/users/:address/wearables', wearablesHandler)
  router.get('/users/:address/third-party-wearables', thirdPartyWearablesHandler)
  router.get('/users/:address/third-party-wearables/:collectionId', thirdPartyCollectionWearablesHandler)
  router.get('/third-party-integrations', thirdPartyIntegrationsHandler)
  router.get('/users/:address/emotes', emotesHandler)
  router.get('/users/:address/names', namesHandler)
  router.get('/users/:address/lands', landsHandler)
  router.post('/profiles', profilesHandler)
  router.get('/profiles/:id', profileHandler)
  router.get('/nfts/collections', allCollectionsHandler)
  router.get('/outfits/:id', outfitsHandler)
  router.get('/contracts/servers', getCatalystServersHandler)
  router.get('/contracts/pois', getPOIsHandler)
  router.get('/contracts/denylisted-names', getNameDenylistHandler)

  /* internal */
  router.get('/explorer/:address/wearables', explorerHandler)
  /* end internal */

  return router
}
