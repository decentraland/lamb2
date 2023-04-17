import { createLowerCaseKeysMap } from "../../../src/adapters/lowercase-keys-map"

it('sets value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysMap<number>()
  lowercaseKeysCache.set('NuMbEr1', 1)
  expect(lowercaseKeysCache.get('number1')).toEqual(1)
})

it('gets value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysMap<number>()
  lowercaseKeysCache.set('number1', 1)
  expect(lowercaseKeysCache.get('NuMbEr1')).toEqual(1)
})

it('sets value and gets value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysMap<number>()
  lowercaseKeysCache.set('NuMbEr1', 1)
  expect(lowercaseKeysCache.get('NUMBER1')).toEqual(1)
})

it('sets value and has value in lowercase', async () => {
  const lowercaseKeysCache = createLowerCaseKeysMap<number>()
  lowercaseKeysCache.set('NuMbEr1', 1)
  expect(lowercaseKeysCache.has('NUMBER1')).toBeTruthy()
})
