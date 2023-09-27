import { computeAddress } from '@dcl/crypto/dist/crypto'
import { createIdentityComponent } from '../src/adapters/identity'

export function generateRandomAddress(): string {
  const pubKey = createIdentityComponent().getPublicKey()
  return computeAddress(Buffer.from(pubKey, 'hex'))
}
