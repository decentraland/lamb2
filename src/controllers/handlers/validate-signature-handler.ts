import { Authenticator, ValidationResult } from '@dcl/crypto'
import { AuthChain } from '@dcl/schemas'
import { Schema } from 'ajv'
import { HandlerContextWithPath, InvalidRequestError } from '../../types'

// EIP-1654 chains in practice are 2-5 links long; capping defends the shared
// l1Provider against amplified eth_call traffic on this unauthenticated endpoint.
// Enforced post-validation in the handler because it is policy, not schema.
const MAX_AUTH_CHAIN_LENGTH = 10

// Schema consumed by the schemaValidator middleware wired in routes.ts.
// Once the middleware passes, the body is guaranteed to satisfy this shape.
export const validateSignatureBodySchema: Schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    timestamp: { type: 'string' },
    signedMessage: { type: 'string' },
    authChain: AuthChain.schema
  },
  required: ['authChain']
}

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

  // Schema and parsing already enforced by the schemaValidator middleware.
  const body = (await context.request.json()) as ValidateSignatureBody

  if (body.authChain.length === 0 || body.authChain.length > MAX_AUTH_CHAIN_LENGTH) {
    throw new InvalidRequestError(`'authChain' length must be between 1 and ${MAX_AUTH_CHAIN_LENGTH}`)
  }

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
