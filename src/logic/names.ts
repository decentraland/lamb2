import { transformNameToResponseSchema } from '../adapters/nfts'
import { runQuery, TheGraphComponent } from '../ports/the-graph'
import { AppComponents, CategoryResponse, NameForResponse, NamesQueryResponse } from '../types'

const QUERY_NAMES: string = `
{
  nfts(
    where: {owner: "$owner", category: "ens"} 
    orderBy: transferredAt,
    orderDirection: desc,
  ) {
    name,
    contractAddress,
    tokenId,
    activeOrder {
      price
    }
  }
}`

const QUERY_NAMES_PAGINATED: string = `
{
  nfts(
    where: {owner: "$owner", category: "ens"} 
    orderBy: transferredAt,
    orderDirection: desc,
    first: $first,
    skip: $skip
  ) {
    name,
    contractAddress,
    tokenId,
    activeOrder {
      price
    }
  }
}`

const QUERY_NAMES_TOTAL_AMOUNT: string = `
{
  nfts(
    where: {owner: "$owner", category: "ens"}
    first: 1000
  ) {
    category
  }
}`

export async function getNamesForAddress(
  components: Pick<AppComponents, 'theGraph'>,
  id: string,
  pageSize?: string | null,
  pageNum?: string | null
) {
  const { theGraph } = components

  // If pagination is required, an extra query to retrieve the total amount of emotes is asynchronously made
  let query
  let names: NameForResponse[]
  let totalAmount
  if (pageSize && pageNum) {
    // Get a promise for calculating total amount of owned emotes
    const totalAmountPromise = runQueryForTotalAmount(id, theGraph)

    // Get a promise for a page of owned emotes
    const namesPromise = runQueryForPaginatedNames(query, id, pageSize, pageNum, theGraph)

    // Wait for both queries to finish
    await Promise.all([totalAmountPromise, namesPromise])

    // Get totalAmount from the query response
    totalAmount = (await totalAmountPromise).nfts.length

    // Get emotes from the query response
    names = (await namesPromise).nfts.map(transformNameToResponseSchema)
  } else {
    // Get all owned emotes
    names = await runQueryForAllNames(query, id, theGraph)

    // Set totalAmount from the query response
    totalAmount = names.length
  }

  return {
    names,
    totalAmount
  }
}

/*
 * Sets the query used to calculate total amount of emotes and runs it
 */
function runQueryForTotalAmount(id: string, theGraph: TheGraphComponent) {
  // Set query for the total amount request
  const totalAmountQuery = QUERY_NAMES_TOTAL_AMOUNT.replace('$owner', id.toLowerCase())

  // Query for every emote with one single field for minimum payload to calculate the total amount
  return runQuery<CategoryResponse>(theGraph.ensSubgraph, totalAmountQuery, {})
}

/*
 * Sets the query for paginated emotes and runs it
 */
function runQueryForPaginatedNames(
  query: any,
  id: string,
  pageSize: string,
  pageNum: string,
  theGraph: TheGraphComponent
) {
  // Set the query for the paginated request
  query = QUERY_NAMES_PAGINATED.replace('$owner', id.toLowerCase())
    .replace('$first', `${pageSize}`)
    .replace('$skip', `${(parseInt(pageNum) - 1) * parseInt(pageSize)}`)

  // Query owned names from TheGraph for the address
  return runQuery<NamesQueryResponse>(theGraph.ensSubgraph, query, {})
}

/*
 * Sets the query for retrieving all emotes and runs it
 */
async function runQueryForAllNames(query: any, id: string, theGraph: TheGraphComponent) {
  // Set the query for the full request
  query = QUERY_NAMES.replace('$owner', id.toLowerCase())

  // Query owned names from TheGraph for the address
  return (await runQuery<NamesQueryResponse>(theGraph.ensSubgraph, query, {})).nfts.map(transformNameToResponseSchema)
}
