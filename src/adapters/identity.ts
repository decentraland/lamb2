import EthCrypto from 'eth-crypto'
import { IBaseComponent } from '@well-known-components/interfaces'

export type IdentityComponent = IBaseComponent & {
  getPublicKey(): string
  getAddress(): string
  sign(message: string): string
}

export function createIdentityComponent(): IdentityComponent {
  const identity = EthCrypto.createIdentity()

  function getAddress(): string {
    return identity.address
  }

  function getPublicKey(): string {
    return identity.publicKey
  }

  function sign(message: string): string {
    return EthCrypto.sign(identity.privateKey, EthCrypto.hash.keccak256(message))
  }

  return {
    getAddress,
    getPublicKey,
    sign
  }
}
