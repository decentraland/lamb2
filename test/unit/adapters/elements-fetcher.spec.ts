import { createLogComponent } from '@well-known-components/logger'
import { createElementsFetcherComponent } from '../../../src/adapters/elements-fetcher'

it('when fetch successes, it returns the elements', async () => {
  const logs = await createLogComponent({})
  const expectedElements = [1, 2, 3]
  const expectedAddress = 'anAddress'
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      return {
        elements: expectedElements,
        totalAmount: expectedElements.length
      }
    }
  )
  const result = await fetcher.fetchOwnedElements(expectedAddress)

  expect(result.elements).toEqual(expectedElements)
  expect(result.totalAmount).toEqual(expectedElements.length)
})

it('it fetches the elements for the specified address', async () => {
  const logs = await createLogComponent({})
  const elementsA = [1, 2, 3]
  const elementsB = [4, 5, 6]
  const addressA = 'addressA'
  const addressB = 'addressB'
  const elementsByAddress = {
    addressa: elementsA,
    addressb: elementsB
  }
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      const elements = elementsByAddress[address]
      return {
        elements,
        totalAmount: elements.length
      }
    }
  )

  expect(await fetcher.fetchOwnedElements(addressA)).toEqual({ elements: elementsA, totalAmount: elementsA.length })
  expect(await fetcher.fetchOwnedElements(addressB)).toEqual({ elements: elementsB, totalAmount: elementsB.length })
})

it('when fetches fail and there is no stale value, it throws error', async () => {
  const logs = await createLogComponent({})
  const expectedAddress = 'anAddress'
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      throw new Error('an error happenned')
    }
  )

  await expect(fetcher.fetchOwnedElements(expectedAddress)).rejects.toThrowError(
    `Cannot fetch elements for ${expectedAddress}`
  )
})

it('result is cached (no case sensitive)', async () => {
  const logs = await createLogComponent({})
  const expectedAddress = 'anAddress'
  let i = 0
  const fetcher = createElementsFetcherComponent<number>(
    { logs, theGraph: null as any, marketplaceApiFetcher: null as any },
    async (_deps, address: string) => {
      if (i === 0) {
        i++
        return {
          elements: [0],
          totalAmount: 1
        }
      }
      return {
        elements: [1],
        totalAmount: 1
      }
    }
  )

  expect(await fetcher.fetchOwnedElements(expectedAddress)).toEqual({ elements: [0], totalAmount: 1 })
  expect(await fetcher.fetchOwnedElements(expectedAddress.toUpperCase())).toEqual({ elements: [0], totalAmount: 1 })
})
