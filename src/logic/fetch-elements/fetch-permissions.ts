import { AppComponents, Operator } from '../../types'
import { THE_GRAPH_PAGE_SIZE } from './fetch-elements'

const QUERY_OPERATORS: string = `
  query fetchParcelsByUpdateOperator($updateOperator: String, $first: Int, $skip: Int) {
    parcels(
      where: { updateOperator: $updateOperator }
      first: $first
      skip: $skip
      orderBy: id
      orderDirection: asc
    ) {
      id,
      x,
      y,
      owner {
        id
      },
      updateOperator
    }
  }`

export type OperatorFromQuery = {
  id: string
  x: string
  y: string
  owner: {
    id: string
  }
  updateOperator: string
}

export type OperatorQueryResult = {
  parcels: OperatorFromQuery[]
}

export async function fetchAllPermissions(
  components: Pick<AppComponents, 'theGraph'>,
  updateOperator: string
): Promise<Operator[]> {
  const elements: Operator[] = []
  let skip = 0
  let hasMore = true

  while (hasMore) {
    const result = await components.theGraph.landSubgraph.query<OperatorQueryResult>(QUERY_OPERATORS, {
      updateOperator,
      first: THE_GRAPH_PAGE_SIZE,
      skip
    })

    if (result.parcels.length === 0) {
      break
    }

    for (const operator of result.parcels) {
      const { id, x, y, owner, updateOperator } = operator
      elements.push({
        id,
        x,
        y,
        owner: owner.id,
        updateOperator
      })
    }

    hasMore = result.parcels.length === THE_GRAPH_PAGE_SIZE
    skip += THE_GRAPH_PAGE_SIZE
  }

  return elements
}
