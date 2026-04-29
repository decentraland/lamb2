import { test } from '../components'

jest.mock('@dcl/crypto', () => {
  const actual = jest.requireActual('@dcl/crypto')
  return {
    ...actual,
    Authenticator: {
      ...actual.Authenticator,
      validateSignature: jest.fn(),
      ownerAddress: jest.fn()
    }
  }
})

import { Authenticator, AuthLinkType } from '@dcl/crypto'

test('validate-signature-handler: POST /crypto/validate-signature', function ({ components }) {
  const ownerAddress = '0x0000000000000000000000000000000000000001'
  const authChain = [{ type: AuthLinkType.SIGNER, payload: ownerAddress, signature: '' }]
  const validateSignatureMock = Authenticator.validateSignature as jest.Mock
  const ownerAddressMock = Authenticator.ownerAddress as jest.Mock

  beforeEach(() => {
    validateSignatureMock.mockReset()
    ownerAddressMock.mockReset()
  })

  describe('when signedMessage is missing', () => {
    it('responds 400 via the error middleware', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authChain })
      })

      expect(r.status).toBe(400)
      const body = await r.json()
      expect(body).toMatchObject({ error: 'Bad request', message: expect.any(String) })
    })
  })

  describe('when the body is malformed JSON', () => {
    it('responds 400 via the schema-validator middleware', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid'
      })

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ ok: false, message: expect.any(String) })
    })
  })

  describe('when Content-Type is not application/json', () => {
    it('responds 4xx (rejected before reaching the handler)', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ signedMessage: 'hello', authChain })
      })

      // The WKC HTTP server returns 415 (Unsupported Media Type) before our
      // schema-validator middleware would return 400. Either is acceptable
      // — the contract is that the request never reaches the handler.
      expect(r.status).toBeGreaterThanOrEqual(400)
      expect(r.status).toBeLessThan(500)
    })
  })

  describe('when the body fails schema validation', () => {
    it('responds 400 when authChain is missing', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedMessage: 'hello' })
      })

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ ok: false, data: expect.any(Array) })
    })

    it('responds 400 when authChain is not an array', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedMessage: 'hello', authChain: 'not-an-array' })
      })

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ ok: false, data: expect.any(Array) })
    })

    it('responds 400 when an authChain entry has a non-string signature', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signedMessage: 'hello',
          authChain: [{ type: AuthLinkType.SIGNER, payload: ownerAddress, signature: 42 }]
        })
      })

      expect(r.status).toBe(400)
      expect(await r.json()).toMatchObject({ ok: false, data: expect.any(Array) })
    })
  })

  describe('when the signature is valid', () => {
    beforeEach(() => {
      validateSignatureMock.mockResolvedValueOnce({ ok: true, message: undefined })
      ownerAddressMock.mockReturnValueOnce(ownerAddress)
    })

    it('responds 200 with the recovered owner address', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedMessage: 'hello', authChain })
      })

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({ valid: true, ownerAddress })
    })
  })

  describe('when the signature is invalid', () => {
    beforeEach(() => {
      validateSignatureMock.mockResolvedValueOnce({ ok: false, message: 'invalid signature' })
    })

    it('responds 200 with valid:false and the error message', async () => {
      const { localFetch } = components

      const r = await localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedMessage: 'hello', authChain })
      })

      expect(r.status).toBe(200)
      expect(await r.json()).toEqual({ valid: false, error: 'invalid signature' })
    })
  })
})
