import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { emotesHandler } from './handlers/emotes-handler'
import { landsHandler } from './handlers/lands-handler'
import { namesHandler } from './handlers/names-handler'
import { profilesHandler } from './handlers/profiles-handler'
import { statusHandler } from './handlers/status-handler'
import { wearablesHandler } from './handlers/wearables-handler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(_: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()

  router.get('/status', statusHandler)
  router.post('/profiles', profilesHandler)
  router.get('/nfts/wearables/:id', wearablesHandler)
  router.get('/nfts/names/:id', namesHandler)
  router.get('/nfts/lands/:id', landsHandler)
  router.get('/nfts/emotes/:id', emotesHandler)

  return router
}
