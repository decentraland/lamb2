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

  const body = parseBody(await context.request.json())
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

function parseBody(raw: unknown): ValidateSignatureBody {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new InvalidRequestError('Request body must be a JSON object')
  }
  const body = raw as Record<string, unknown>
  if (!Array.isArray(body.authChain)) {
    throw new InvalidRequestError(`'authChain' must be an array`)
  }
  if (body.timestamp !== undefined && typeof body.timestamp !== 'string') {
    throw new InvalidRequestError(`'timestamp' must be a string`)
  }
  if (body.signedMessage !== undefined && typeof body.signedMessage !== 'string') {
    throw new InvalidRequestError(`'signedMessage' must be a string`)
  }
  return {
    timestamp: body.timestamp as string | undefined,
    signedMessage: body.signedMessage as string | undefined,
    authChain: body.authChain as AuthLink[]
  }
}
