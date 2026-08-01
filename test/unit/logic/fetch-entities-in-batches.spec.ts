import { Entity, EntityType } from '@dcl/schemas'
import { ILoggerComponent } from '@well-known-components/interfaces'
import {
  MAX_CONCURRENT_POINTER_REQUESTS,
  MAX_POINTERS_PER_REQUEST,
  fetchEntitiesInBatches
} from '../../../src/logic/fetch-entities-in-batches'

function generateEntity(urn: string): Entity {
  return {
    version: 'v3',
    id: `entity-${urn}`,
    type: EntityType.WEARABLE,
    pointers: [urn],
    timestamp: 0,
    content: [],
    metadata: { id: urn }
  }
}

function generatePointers(quantity: number): string[] {
  return Array.from({ length: quantity }, (_, index) => `urn:wearable:${index}`)
}

let logger: ILoggerComponent.ILogger
let fetchBatch: jest.Mock

beforeEach(() => {
  logger = { log: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('when the pointers fit in a single batch', () => {
  let pointers: string[]
  let entities: Entity[]

  beforeEach(async () => {
    pointers = generatePointers(10)
    fetchBatch = jest.fn(async (batch: string[]) => batch.map(generateEntity))
    entities = await fetchEntitiesInBatches(pointers, fetchBatch, logger)
  })

  it('should issue a single request holding every pointer', () => {
    expect(fetchBatch).toHaveBeenCalledTimes(1)
    expect(fetchBatch).toHaveBeenCalledWith(pointers)
  })

  it('should return one entity per pointer', () => {
    expect(entities.map((entity) => entity.metadata.id)).toEqual(pointers)
  })
})

describe('when the pointers exceed the maximum per request', () => {
  let pointers: string[]
  let entities: Entity[]
  let requestedBatches: string[][]

  beforeEach(async () => {
    // The content server answers 400 above 1000 pointers, so a wallet this size used to
    // fail outright instead of being split.
    pointers = generatePointers(1939)
    fetchBatch = jest.fn(async (batch: string[]) => {
      if (batch.length > 1000) {
        throw new Error('Invalid JSON body: pointers must NOT have more than 1000 items')
      }
      return batch.map(generateEntity)
    })
    entities = await fetchEntitiesInBatches(pointers, fetchBatch, logger)
    requestedBatches = fetchBatch.mock.calls.map((call) => call[0])
  })

  it('should split the pointers into one request per batch', () => {
    expect(fetchBatch).toHaveBeenCalledTimes(Math.ceil(pointers.length / MAX_POINTERS_PER_REQUEST))
  })

  it('should keep every request within the maximum per request', () => {
    for (const batch of requestedBatches) {
      expect(batch.length).toBeLessThanOrEqual(MAX_POINTERS_PER_REQUEST)
    }
  })

  it('should request every pointer exactly once', () => {
    expect(requestedBatches.flat().sort()).toEqual([...pointers].sort())
  })

  it('should resolve every pointer', () => {
    expect(entities).toHaveLength(pointers.length)
  })
})

describe('and the batch count is above the concurrency limit', () => {
  let pointers: string[]
  let maxInFlight: number

  beforeEach(async () => {
    pointers = generatePointers(MAX_POINTERS_PER_REQUEST * (MAX_CONCURRENT_POINTER_REQUESTS + 3))
    let inFlight = 0
    maxInFlight = 0
    fetchBatch = jest.fn(async (batch: string[]) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setImmediate(resolve))
      inFlight--
      return batch.map(generateEntity)
    })
    await fetchEntitiesInBatches(pointers, fetchBatch, logger)
  })

  it('should never hold more requests in flight than the concurrency limit', () => {
    expect(maxInFlight).toBeLessThanOrEqual(MAX_CONCURRENT_POINTER_REQUESTS)
  })

  it('should still issue a request for every batch', () => {
    expect(fetchBatch).toHaveBeenCalledTimes(MAX_CONCURRENT_POINTER_REQUESTS + 3)
  })
})

describe('and one of the batches fails', () => {
  let pointers: string[]
  let entities: Entity[]

  beforeEach(async () => {
    pointers = generatePointers(MAX_POINTERS_PER_REQUEST * 2)
    fetchBatch = jest
      .fn()
      .mockRejectedValueOnce(new Error('content server unavailable'))
      .mockImplementation(async (batch: string[]) => batch.map(generateEntity))
    entities = await fetchEntitiesInBatches(pointers, fetchBatch, logger)
  })

  it('should return the entities resolved by the batches that succeeded', () => {
    expect(entities).toHaveLength(MAX_POINTERS_PER_REQUEST)
  })

  it('should log a warning naming the failure', () => {
    expect(logger.warn).toHaveBeenCalledWith('Failed to fetch a batch of entities', {
      pointers: MAX_POINTERS_PER_REQUEST,
      error: 'content server unavailable'
    })
  })
})

describe('when there are no pointers to resolve', () => {
  let entities: Entity[]

  beforeEach(async () => {
    fetchBatch = jest.fn()
    entities = await fetchEntitiesInBatches([], fetchBatch, logger)
  })

  it('should not issue any request', () => {
    expect(fetchBatch).not.toHaveBeenCalled()
  })

  it('should return no entities', () => {
    expect(entities).toEqual([])
  })
})
