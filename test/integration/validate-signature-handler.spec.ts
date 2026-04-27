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
