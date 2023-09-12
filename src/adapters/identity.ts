import EthCrypto from 'eth-crypto'
import { IBaseComponent } from '@well-known-components/interfaces'

export type IdentityComponent = IBaseComponent & {
  getPublicKey(): string
  sign(message: string): string
}

export function createIdentityComponent(): IdentityComponent {
  const identity = EthCrypto.createIdentity()

  function getPublicKey(): string {
    return identity.publicKey
  }

  function sign(message: string): string {
    return EthCrypto.sign(identity.privateKey, EthCrypto.hash.keccak256(message))
  }

  return {
    getPublicKey,
    sign
  }
}
