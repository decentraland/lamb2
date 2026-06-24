import { computeAddress } from '@dcl/crypto/dist/crypto'
import { randomBytes } from 'crypto'
import secp256k1 from 'secp256k1'

export function generateRandomAddress(): string {
  let privKey: Uint8Array
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  // Generate the uncompressed (65-byte) public key — @dcl/crypto's computeAddress
  // rejects the 33-byte compressed form.
  const pubKey = secp256k1.publicKeyCreate(privKey, false)
  return computeAddress(pubKey)
}
