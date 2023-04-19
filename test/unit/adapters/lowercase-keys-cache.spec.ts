import { createLowerCaseKeysCache } from '../../../src/adapters/lowercase-keys-cache'

it('sets value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysCache<number>({ max: 10, ttl: 1000 })
  lowercaseKeysCache.set('NuMbEr1', 1)
  expect(lowercaseKeysCache.get('number1')).toEqual(1)
})

it('gets value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysCache<number>({ max: 10, ttl: 1000 })
  lowercaseKeysCache.set('number1', 1)
  expect(lowercaseKeysCache.get('NuMbEr1')).toEqual(1)
})

it('sets value and gets value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysCache<number>({ max: 10, ttl: 1000 })
  lowercaseKeysCache.set('NuMbEr1', 1)
  expect(lowercaseKeysCache.get('NUMBER1')).toEqual(1)
})

it('sets value and has value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysCache<number>({ max: 10, ttl: 1000 })
  lowercaseKeysCache.set('NuMbEr1', 1)
  expect(lowercaseKeysCache.has('NUMBER1')).toBeTruthy()
})

it('fetches using key in lowercase', async () => {
  const key = 'LoWeRcAsE-key'
  const lowercaseKeysCache = createLowerCaseKeysCache<number>({
    max: 10,
    ttl: 1000,
    fetchMethod: (k: string) => {
      if (k === key.toLowerCase()) {
        return 1
      }
      return 0
    }
  })
  lowercaseKeysCache.set(key, 1)
  expect(lowercaseKeysCache.get(key)).toEqual(1)
})