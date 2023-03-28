import { createLogComponent } from "@well-known-components/logger"
import { createElementsFetcherComponent } from "../../../src/adapters/elements-fetcher"

it('when fetch successes, it returns the elements', async () => {
  const logs = await createLogComponent({})
  const expectedElements = [1, 2, 3]
  const expectedAddress = 'anAddress'
  const fetcher = createElementsFetcherComponent<number>({ logs }, async (address: string) => {
    return expectedElements
  })
  const elements = await fetcher.fetchOwnedElements(expectedAddress)

  expect(elements).toEqual(expectedElements)
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
  const fetcher = createElementsFetcherComponent<number>({ logs }, async (address: string) => {
    return elementsByAddress[address]
  })

  expect(await fetcher.fetchOwnedElements(addressA)).toEqual(elementsA)
  expect(await fetcher.fetchOwnedElements(addressB)).toEqual(elementsB)
})

it('when fetches fail and there is no stale value, it throws error', async () => {
  const logs = await createLogComponent({})
  const expectedAddress = 'anAddress'
  const fetcher = createElementsFetcherComponent<number>({ logs }, async (address: string) => {

    throw new Error('an error happenned')
  })

  await expect(fetcher.fetchOwnedElements(expectedAddress)).rejects.toThrowError(`Cannot fetch elements for ${expectedAddress}`)

})

it('result is cached (no case sensitive)', async () => {
  const logs = await createLogComponent({})
  const expectedAddress = 'anAddress'
  let i = 0
  const fetcher = createElementsFetcherComponent<number>({ logs }, async (address: string) => {
    if (i === 0) {
      i++
      return [0]
    }
    return [1]
  })

  expect(await fetcher.fetchOwnedElements(expectedAddress)).toEqual([0])
  expect(await fetcher.fetchOwnedElements(expectedAddress.toUpperCase())).toEqual([0])

})
