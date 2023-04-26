import { test } from '../components'
import { Authenticator, AuthIdentity } from '@dcl/crypto'
import { createUnsafeIdentity } from '@dcl/crypto/dist/crypto'

async function getSigner(): Promise<{
  address: string
  signer: (message: string) => Promise<string>
  ephemeralLifespanMinutes: number
}> {
  const account = createUnsafeIdentity()

  return {
    address: account.address.toLowerCase(),
    async signer(message) {
      return Authenticator.createSignature(account, message)
    },
    ephemeralLifespanMinutes: 365 * 24 * 60 * 99
  }
}

export async function createAuthIdentity(): Promise<AuthIdentity> {
  const ephemeral = createUnsafeIdentity()

  const { address, signer, ephemeralLifespanMinutes } = await getSigner()

  return Authenticator.initializeAuthChain(address, ephemeral, ephemeralLifespanMinutes, signer)
}

test('validate-signature-handler: POST /validate-signature should', function ({ components }) {
  it('return error when no signedMessage nor tiemstamp is provided', async () => {
    const { localFetch } = components

    const identity = await createAuthIdentity()
    const r = await localFetch.fetch(`/validate-signature`, {
      method: 'POST',
      body: JSON.stringify({ authChain: identity.authChain })
    })

    expect(r.status).toBe(400)

    const response = await r.json()
    expect(response.error).toBe(`Expected 'signedMessage' property to be set`)
  })

  it('return error when no authChain is provided', async () => {
    const { localFetch } = components

    const r = await localFetch.fetch(`/validate-signature`, {
      method: 'POST',
      body: JSON.stringify({ signedMessage: 'message' })
    })

    expect(r.status).toBe(400)

    const response = await r.json()
    expect(response.error).toBe(`Expected 'authChain' property to be set`)
  })

  it('return valid: false when signature is not valid', async () => {
    const { localFetch } = components

    const identity = await createAuthIdentity()
    const signedMessage = 'test'
    const r = await localFetch.fetch(`/validate-signature`, {
      method: 'POST',
      body: JSON.stringify({ signedMessage, authChain: identity.authChain })
    })

    const response = await r.json()
    expect(r.status).toBe(200)
    expect(response.valid).toBe(false)
  })

  it('return valid: true when signature is valid', async () => {
    const { localFetch } = components

    const identity = await createAuthIdentity()
    const message = 'test'
    const authChain = Authenticator.signPayload(identity, message)
    const r = await localFetch.fetch(`/validate-signature`, {
      method: 'POST',
      body: JSON.stringify({ signedMessage: message, authChain: authChain })
    })

    const response = await r.json()
    expect(r.status).toBe(200)
    expect(response.valid).toBe(true)
  })
})
