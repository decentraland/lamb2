import { createIdentity } from 'eth-crypto'

export function generateRandomAddress(): string {
  const identity = createIdentity()
  return identity.address
}
