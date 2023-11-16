import { computeAddress } from '@dcl/crypto/dist/crypto'
import { randomBytes } from 'crypto'
import secp256k1 from 'secp256k1'

export function generateRandomAddress(): string {
  let privKey: Uint8Array
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  const pubKey = secp256k1.publicKeyCreate(privKey)
  return computeAddress(pubKey)
}
