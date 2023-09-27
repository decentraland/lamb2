import { IBaseComponent } from '@well-known-components/interfaces'
import { randomBytes } from 'crypto'
import secp256k1 from 'secp256k1'
import { sha3 } from 'eth-connect'

export type HashAndSignResult = {
  hash: string
  signedHash: string
}

export type IdentityComponent = IBaseComponent & {
  getPublicKey(): string
  hashAndSign(message: string): HashAndSignResult
}

export function createIdentityComponent(): IdentityComponent {
  let privKey: Uint8Array
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  const pubKey = secp256k1.publicKeyCreate(privKey)

  function getPublicKey(): string {
    return Buffer.from(pubKey).toString('hex')
  }

  function hashAndSign(message: string): HashAndSignResult {
    const hash = sha3(message)
    const signedHash = Buffer.from(secp256k1.ecdsaSign(Buffer.from(hash, 'hex'), privKey).signature).toString('hex')
    return { hash, signedHash }
  }

  return {
    getPublicKey,
    hashAndSign
  }
}
