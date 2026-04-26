import { Authenticator, AuthLink, ValidationResult } from '@dcl/crypto'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

type ValidateSignatureBody = {
  timestamp?: string
  signedMessage?: string
  authChain: AuthLink[]
}

type ValidateSignatureResponse = {
  valid: boolean
  ownerAddress?: string
  error?: string
}

export async function validateSignatureHandler(
  context: Pick<HandlerContextWithPath<'l1Provider', '/crypto/validate-signature'>, 'components' | 'request'>
): Promise<{ status: 200; body: ValidateSignatureResponse }> {
  const { l1Provider } = context.components

  const body = (await context.request.json()) as ValidateSignatureBody
  const finalAuthority = body.signedMessage ?? body.timestamp
  if (!finalAuthority) {
    throw new InvalidRequestError(`Expected 'signedMessage' property to be set`)
  }

  const result: ValidationResult = await Authenticator.validateSignature(finalAuthority, body.authChain, l1Provider)

  return {
    status: 200,
    body: {
      valid: result.ok,
      ownerAddress: result.ok ? Authenticator.ownerAddress(body.authChain) : undefined,
      error: result.message
    }
  }
}
