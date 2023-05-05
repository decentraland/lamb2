import { EmoteDefinition, WearableDefinition } from '@dcl/schemas'
import { DefinitionsFetcher } from '../adapters/definitions-fetcher'

export async function addDefinitions<T, E extends WearableDefinition | EmoteDefinition>(
  thingsWithUrn: T[],
  getUrn: (t: T) => string,
  definitionFetcher: DefinitionsFetcher<E>
): Promise<(T & { definition?: E })[]> {
  const definitions = await definitionFetcher.fetchItemsDefinitions(
    thingsWithUrn.map((thingWithUrn) => getUrn(thingWithUrn))
  )
  const results: (T & { definition?: E })[] = []
  for (let i = 0; i < thingsWithUrn.length; ++i) {
    results.push({
      ...thingsWithUrn[i],
      definition: definitions[i]
    })
  }
  return results
}
