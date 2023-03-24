import { fetchAllNFTs } from "../../../../src/logic/fetch-elements/fetch-elements"

it('query is used to query the subgraph', async () => {
  const query = jest.fn().mockResolvedValue({ nfts: [] })
  const aQuery = 'aQuery'
  await fetchAllNFTs({ query }, 'aQuery', 'anAddress')
  expect(query).toBeCalledWith(aQuery, expect.anything())
})

it('owner address is passed as a variable as lowercase', async () => {
  const query = jest.fn().mockResolvedValue({ nfts: [] })
  const owner = 'anAddress'
  await fetchAllNFTs({ query }, 'aQuery', owner)
  expect(query).toBeCalledWith(expect.anything(), expect.objectContaining({
    owner: owner.toLowerCase(),
  }))
})

it('idFrom is passed as a variable as empty string in first iteration', async () => {
  const query = jest.fn().mockResolvedValue({ nfts: [] })
  await fetchAllNFTs({ query }, 'aQuery', 'anAddress')
  expect(query).toBeCalledWith(expect.anything(), expect.objectContaining({
    idFrom: '',
  }))
})

it('when there are no nfts in the graph results, it returns empty array', async () => {
  const query = jest.fn().mockResolvedValue({ nfts: [] })
  const nfts = await fetchAllNFTs({ query }, 'aQuery', 'anAddress')
  expect(nfts).toHaveLength(0)
})

it('when there are nfts in the graph results in first page, it returns the nfts', async () => {
  const expectedNFTs = [{ id: 'id1' }, { id: 'id2' }]
  const query = jest.fn().mockResolvedValue({ nfts: expectedNFTs })
  const nfts = await fetchAllNFTs<{ id: string }>({ query }, 'aQuery', 'anAddress')
  expect(nfts).toEqual(expectedNFTs)
})

it('when there are less than 1000 (first page) nfts in the graph results, it doesnt call again the graph', async () => {
  const nfts = [{ id: 'id1' }, { id: 'id2' }]
  const query = jest.fn().mockResolvedValue({ nfts: nfts })
  await fetchAllNFTs<{ id: string }>({ query }, 'aQuery', 'anAddress')
  expect(query).toBeCalledTimes(1)
})

it('when there are more than 1000 (first page) nfts in the graph results, it returns the nfts from all the pages', async () => {
  const expectedNFTs = []
  for (let i = 0; i < 1001; i++) {
    expectedNFTs.push({ id: `id-${i}` })
  }
  const query = jest.fn()
    .mockResolvedValueOnce({ nfts: expectedNFTs.slice(0, 1000) })
    .mockResolvedValueOnce({ nfts: expectedNFTs.slice(1000, 1001) })
  const nfts = await fetchAllNFTs<{ id: string }>({ query }, 'aQuery', 'anAddress')
  expect(nfts).toEqual(nfts)
  expect(query).toBeCalledTimes(2)
})

it('when there are more than 1000 (first page) nfts in the graph results, it calls the next page with the id of the last one of the previous page', async () => {
  const nfts = []
  for (let i = 0; i < 1001; i++) {
    nfts.push({ id: `id-${i}` })
  }
  const query = jest.fn()
    .mockResolvedValueOnce({ nfts: nfts.slice(0, 1000) })
    .mockResolvedValueOnce({ nfts: nfts.slice(1000, 1001) })
  await fetchAllNFTs<{ id: string }>({ query }, 'aQuery', 'anAddress')
  expect(query).toBeCalledWith(expect.anything(), expect.objectContaining({ idFrom: '' }))
  expect(query).toBeCalledWith(expect.anything(), expect.objectContaining({ idFrom: 'id-999' }))
})

it('when there the graph result nfts doesnt have id field, it fails', async () => {
  const expectedNFTs = []
  for (let i = 0; i < 1001; i++) {
    expectedNFTs.push({ notid: `notid-${i}` })
  }
  const query = jest.fn()
    .mockResolvedValueOnce({ nfts: expectedNFTs.slice(0, 1000) })
    .mockResolvedValueOnce({ nfts: expectedNFTs.slice(1000, 1001) })
  await expect(fetchAllNFTs<{ id: string }>({ query }, 'aQuery', 'anAddress')).rejects.toThrow(Error('Error getting id from last entity from previous page'))
})
