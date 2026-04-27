import { Request } from 'node-fetch'
import { Authenticator, AuthLinkType, ValidationResult } from '@dcl/crypto'
import { validateSignatureHandler } from '../../src/controllers/handlers/validate-signature-handler'
import { InvalidRequestError } from '../../src/types'
import { HTTPProvider } from 'eth-connect'

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

describe('validate-signature-handler: POST /crypto/validate-signature', () => {
  const ownerAddress = '0x0000000000000000000000000000000000000001'
  const validResult: ValidationResult = { ok: true, message: undefined }
  const invalidResult: ValidationResult = { ok: false, message: 'invalid signature' }

  const authChain = [
    {
      type: AuthLinkType.SIGNER,
      payload: ownerAddress,
      signature: ''
    }
  ]

  let mockL1Provider: HTTPProvider
  let mockValidateSignature: jest.Mock
  let mockOwnerAddress: jest.Mock

  beforeEach(() => {
    mockL1Provider = {} as HTTPProvider
    mockValidateSignature = Authenticator.validateSignature as jest.Mock
    mockOwnerAddress = Authenticator.ownerAddress as jest.Mock
    mockValidateSignature.mockReset()
    mockOwnerAddress.mockReset()
  })

  function makeRequest(body: unknown) {
    return new Request(new URL('http://localhost/crypto/validate-signature'), {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    })
  }

  describe('when neither signedMessage nor timestamp is provided', () => {
    it('should throw InvalidRequestError', async () => {
      const request = makeRequest({ authChain })
      await expect(
        validateSignatureHandler({
          components: { l1Provider: mockL1Provider },
          request: request as any
        })
      ).rejects.toThrow(InvalidRequestError)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })
  })

  describe('when the request body is not a JSON object', () => {
    it('should throw InvalidRequestError for an array body', async () => {
      const request = makeRequest([1, 2, 3])
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/JSON object/)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })

    it('should throw InvalidRequestError for a null body', async () => {
      const request = makeRequest(null)
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/JSON object/)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })
  })

  describe('when authChain is missing or not an array', () => {
    it('should throw InvalidRequestError for a missing authChain', async () => {
      const request = makeRequest({ signedMessage: 'hello' })
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/authChain/)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })

    it('should throw InvalidRequestError when authChain is a string', async () => {
      const request = makeRequest({ signedMessage: 'hello', authChain: 'not-an-array' })
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/authChain/)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })
  })

  describe('when timestamp or signedMessage are present but not strings', () => {
    it('should throw InvalidRequestError when timestamp is a number', async () => {
      const request = makeRequest({ timestamp: 1700000000, authChain })
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/timestamp/)
    })

    it('should throw InvalidRequestError when signedMessage is an object', async () => {
      const request = makeRequest({ signedMessage: { not: 'a string' }, authChain })
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/signedMessage/)
    })
  })

  describe('when signedMessage is provided and the signature is valid', () => {
    beforeEach(() => {
      mockValidateSignature.mockResolvedValueOnce(validResult)
      mockOwnerAddress.mockReturnValueOnce(ownerAddress)
    })

    it('should return valid:true with the recovered owner address', async () => {
      const request = makeRequest({ signedMessage: 'hello', authChain })
      const response = await validateSignatureHandler({
        components: { l1Provider: mockL1Provider },
        request: request as any
      })

      expect(mockValidateSignature).toHaveBeenCalledWith('hello', authChain, mockL1Provider)
      expect(mockOwnerAddress).toHaveBeenCalledWith(authChain)
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ valid: true, ownerAddress, error: undefined })
    })
  })

  describe('when timestamp is used as the signed authority', () => {
    beforeEach(() => {
      mockValidateSignature.mockResolvedValueOnce(validResult)
      mockOwnerAddress.mockReturnValueOnce(ownerAddress)
    })

    it('should pass the timestamp as the message to validate', async () => {
      const request = makeRequest({ timestamp: '1700000000', authChain })
      await validateSignatureHandler({
        components: { l1Provider: mockL1Provider },
        request: request as any
      })

      expect(mockValidateSignature).toHaveBeenCalledWith('1700000000', authChain, mockL1Provider)
    })
  })

  describe('when both signedMessage and timestamp are provided', () => {
    beforeEach(() => {
      mockValidateSignature.mockResolvedValueOnce(validResult)
      mockOwnerAddress.mockReturnValueOnce(ownerAddress)
    })

    it('should prefer signedMessage over timestamp', async () => {
      const request = makeRequest({ signedMessage: 'msg', timestamp: '1700000000', authChain })
      await validateSignatureHandler({
        components: { l1Provider: mockL1Provider },
        request: request as any
      })

      expect(mockValidateSignature).toHaveBeenCalledWith('msg', authChain, mockL1Provider)
    })
  })

  describe('when the signature is invalid', () => {
    beforeEach(() => {
      mockValidateSignature.mockResolvedValueOnce(invalidResult)
    })

    it('should return valid:false with the error message and no owner address', async () => {
      const request = makeRequest({ signedMessage: 'hello', authChain })
      const response = await validateSignatureHandler({
        components: { l1Provider: mockL1Provider },
        request: request as any
      })

      expect(mockOwnerAddress).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(response.body).toEqual({ valid: false, ownerAddress: undefined, error: 'invalid signature' })
    })
  })
})
