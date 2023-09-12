import Wallet from 'ethereumjs-wallet'

export function generateRandomAddress(): string {
  return Wallet.generate().getAddressString()
}
