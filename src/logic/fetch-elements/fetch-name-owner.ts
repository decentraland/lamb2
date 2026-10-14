import { AppComponents } from '../../types'

const QUERY_NAME_OWNER: string = `
  query fetchNameOwner($name: String) {
    nfts(
      where: { category: ens, searchText: $name }
      first: 1
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
  // searchText holds the lowercased name, so this is an exact case-insensitive match
  const result = await components.theGraph.ensSubgraph.query<NameOwnerFromQuery>(QUERY_NAME_OWNER, {
    name: name.toLowerCase()
  })
  return { owner: result.nfts[0]?.owner.address || null }
}
