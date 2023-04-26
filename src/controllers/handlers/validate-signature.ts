import { Authenticator, ValidationResult } from '@dcl/crypto'
import { ErrorResponse, HandlerContextWithPath } from '../../types'

export type ValidateSignatureResponse = {
  status: 200
  body: {
    valid: boolean
    ownerAddress: string | undefined
    error: string | undefined
  }
}

export async function validateSignatureHandler(
  context: HandlerContextWithPath<'ethereumProvider', '/validate-signature'>
): Promise<ValidateSignatureResponse | ErrorResponse> {
  const { ethereumProvider } = context.components

  const body = await context.request.json()
  const { timestamp, signedMessage, authChain } = body

  const finalAuthority: string | undefined = signedMessage ?? timestamp
  if (!finalAuthority) {
    return {
      status: 400,
      body: {
        error: `Expected 'signedMessage' property to be set`
      }
    }
  }

  if (!authChain) {
    return {
      status: 400,
      body: {
        error: `Expected 'authChain' property to be set`
      }
    }
  }

  if (!Authenticator.isValidAuthChain(authChain)) {
    return {
      status: 400,
      body: {
        error: `Invalid authChain`
      }
    }
  }

  const result: ValidationResult = await Authenticator.validateSignature(finalAuthority, authChain, ethereumProvider)

  return {
    status: 200,
    body: {
      valid: result.ok,
      ownerAddress: result.ok ? Authenticator.ownerAddress(authChain) : undefined,
      error: result.message
    }
  }
}
