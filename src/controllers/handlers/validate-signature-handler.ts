import { Authenticator, ValidationResult } from '@dcl/crypto'
import { AuthChain } from '@dcl/schemas'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

// EIP-1654 chains in practice are 2-5 links long; capping defends the shared
// l1Provider against amplified eth_call traffic on this unauthenticated endpoint.
const MAX_AUTH_CHAIN_LENGTH = 10

type ValidateSignatureBody = {
  timestamp?: string
  signedMessage?: string
  authChain: AuthChain
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

  let raw: unknown
  try {
    raw = await context.request.json()
  } catch {
    throw new InvalidRequestError('Request body must be valid JSON')
  }

  const body = parseBody(raw)
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
  if (!AuthChain.validate(body.authChain)) {
    const detail = AuthChain.validate.errors?.[0]
    const message = detail ? `${detail.instancePath || 'authChain'} ${detail.message}` : 'invalid auth chain'
    throw new InvalidRequestError(`'authChain' is invalid: ${message}`)
  }
  if (body.authChain.length === 0 || body.authChain.length > MAX_AUTH_CHAIN_LENGTH) {
    throw new InvalidRequestError(`'authChain' length must be between 1 and ${MAX_AUTH_CHAIN_LENGTH}`)
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
    authChain: body.authChain
  }
}
