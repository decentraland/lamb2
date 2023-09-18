import { IBaseComponent } from '@well-known-components/interfaces'
import { hashV1 } from '@dcl/hashing'

export type HasherComponent = IBaseComponent & {
  hash(data: string): Promise<string>
}

export function createHasherComponent(): HasherComponent {
  const encoder = new TextEncoder()

  function hash(data: string): Promise<string> {
    return hashV1(encoder.encode(data))
  }

  return {
    hash
  }
}
