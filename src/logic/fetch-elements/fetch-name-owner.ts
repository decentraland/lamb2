import { AppComponents } from '../../types'

const QUERY_NAME_OWNER: string = `
  query fetchNameOwner($name: String) {
    nfts(
      where: {name_starts_with_nocase: $name, name_ends_with_nocase: $name }
    ) {
      owner {
        address
      }
    }
}`

export type NameOwnerFromQuery = {
  nfts: {
    owner: {
      address: string
    }
  }[]
}

export async function fetchNameOwner(
  components: Pick<AppComponents, 'theGraph'>,
  name: string
): Promise<{
  owner: string | null
}> {
  const result = await components.theGraph.ensSubgraph.query<NameOwnerFromQuery>(QUERY_NAME_OWNER, { name })
  return { owner: result.nfts[0]?.owner.address || null }
}
