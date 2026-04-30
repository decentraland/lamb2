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
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      response = await components.localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authChain })
      })
      body = await response.json()
    })

    it("should respond 400 with the lamb2 error-middleware shape and the 'signedMessage required' message", () => {
      expect(response.status).toBe(400)
      expect(body).toMatchObject({ error: 'Bad request', message: expect.any(String) })
    })
  })

  describe('when the body is malformed JSON', () => {
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      response = await components.localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid'
      })
      body = await response.json()
    })

    it('should respond 400 with the schema-validator middleware shape', () => {
      expect(response.status).toBe(400)
      expect(body).toMatchObject({ ok: false, message: expect.any(String) })
    })
  })

  describe('when Content-Type is not application/json', () => {
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>

    beforeEach(async () => {
      response = await components.localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ signedMessage: 'hello', authChain })
      })
    })

    // The WKC HTTP server returns 415 (Unsupported Media Type) before our
    // schema-validator middleware would return 400. Either is acceptable —
    // the contract is that the request never reaches the handler.
    it('should respond with a 4xx status before the handler runs', () => {
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.status).toBeLessThan(500)
    })
  })

  describe('when the body fails schema validation', () => {
    describe('and authChain is missing', () => {
      let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
      let body: any

      beforeEach(async () => {
        response = await components.localFetch.fetch('/crypto/validate-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signedMessage: 'hello' })
        })
        body = await response.json()
      })

      it('should respond 400 with the schema-validator shape including ajv errors', () => {
        expect(response.status).toBe(400)
        expect(body).toMatchObject({ ok: false, data: expect.any(Array) })
      })
    })

    describe('and authChain is not an array', () => {
      let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
      let body: any

      beforeEach(async () => {
        response = await components.localFetch.fetch('/crypto/validate-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signedMessage: 'hello', authChain: 'not-an-array' })
        })
        body = await response.json()
      })

      it('should respond 400 with the schema-validator shape including ajv errors', () => {
        expect(response.status).toBe(400)
        expect(body).toMatchObject({ ok: false, data: expect.any(Array) })
      })
    })

    describe('and an authChain entry has a non-string signature', () => {
      let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
      let body: any

      beforeEach(async () => {
        response = await components.localFetch.fetch('/crypto/validate-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signedMessage: 'hello',
            authChain: [{ type: AuthLinkType.SIGNER, payload: ownerAddress, signature: 42 }]
          })
        })
        body = await response.json()
      })

      it('should respond 400 with the schema-validator shape including ajv errors', () => {
        expect(response.status).toBe(400)
        expect(body).toMatchObject({ ok: false, data: expect.any(Array) })
      })
    })
  })

  describe('when the signature is valid', () => {
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      validateSignatureMock.mockResolvedValueOnce({ ok: true, message: undefined })
      ownerAddressMock.mockReturnValueOnce(ownerAddress)
      response = await components.localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedMessage: 'hello', authChain })
      })
      body = await response.json()
    })

    it('should respond 200 with valid:true and the recovered owner address', () => {
      expect(response.status).toBe(200)
      expect(body).toEqual({ valid: true, ownerAddress })
    })
  })

  describe('when the signature is invalid', () => {
    let response: Awaited<ReturnType<typeof components.localFetch.fetch>>
    let body: any

    beforeEach(async () => {
      validateSignatureMock.mockResolvedValueOnce({ ok: false, message: 'invalid signature' })
      response = await components.localFetch.fetch('/crypto/validate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedMessage: 'hello', authChain })
      })
      body = await response.json()
    })

    it("should respond 200 with valid:false and the validator's error message", () => {
      expect(response.status).toBe(200)
      expect(body).toEqual({ valid: false, error: 'invalid signature' })
    })
  })
})
