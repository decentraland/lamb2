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
  const authChain = [{ type: AuthLinkType.SIGNER, payload: ownerAddress, signature: '' }]
  const validResult: ValidationResult = { ok: true, message: undefined }
  const invalidResult: ValidationResult = { ok: false, message: 'invalid signature' }

  let mockL1Provider: HTTPProvider
  let mockValidateSignature: jest.Mock
  let mockOwnerAddress: jest.Mock

  function makeRequest(body: unknown): Request {
    return new Request(new URL('http://localhost/crypto/validate-signature'), {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    })
  }

  beforeEach(() => {
    mockL1Provider = {} as HTTPProvider
    mockValidateSignature = Authenticator.validateSignature as jest.Mock
    mockOwnerAddress = Authenticator.ownerAddress as jest.Mock
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when neither signedMessage nor timestamp is provided', () => {
    let request: Request

    beforeEach(() => {
      request = makeRequest({ authChain })
    })

    it("should reject with a 'signedMessage required' InvalidRequestError without invoking the validator", async () => {
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(InvalidRequestError)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })
  })

  describe('when the authChain is empty', () => {
    let request: Request

    beforeEach(() => {
      request = makeRequest({ signedMessage: 'hello', authChain: [] })
    })

    it("should reject with a 'length must be between 1 and 10' error and skip the validator", async () => {
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/length must be between 1 and 10/)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })
  })

  describe('when the authChain exceeds the policy length cap', () => {
    let request: Request

    beforeEach(() => {
      const link = { type: 'SIGNER', payload: ownerAddress, signature: '' }
      request = makeRequest({ signedMessage: 'hello', authChain: Array(11).fill(link) })
    })

    it("should reject with a 'length must be between 1 and 10' error and skip the validator", async () => {
      await expect(
        validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })
      ).rejects.toThrow(/length must be between 1 and 10/)
      expect(mockValidateSignature).not.toHaveBeenCalled()
    })
  })

  describe('when signedMessage is provided', () => {
    let request: Request

    beforeEach(() => {
      request = makeRequest({ signedMessage: 'hello', authChain })
    })

    describe('and the signature is valid', () => {
      beforeEach(() => {
        mockValidateSignature.mockResolvedValueOnce(validResult)
        mockOwnerAddress.mockReturnValueOnce(ownerAddress)
      })

      it('should respond 200 with valid:true and the recovered owner address', async () => {
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

    describe('and the signature is invalid', () => {
      beforeEach(() => {
        mockValidateSignature.mockResolvedValueOnce(invalidResult)
      })

      it("should respond 200 with valid:false, no owner address, and the validator's error message", async () => {
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

  describe('when only timestamp is provided', () => {
    let request: Request

    beforeEach(() => {
      mockValidateSignature.mockResolvedValueOnce(validResult)
      mockOwnerAddress.mockReturnValueOnce(ownerAddress)
      request = makeRequest({ timestamp: '1700000000', authChain })
    })

    it('should pass the timestamp as the signed authority to the validator', async () => {
      await validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })

      expect(mockValidateSignature).toHaveBeenCalledWith('1700000000', authChain, mockL1Provider)
    })
  })

  describe('when both signedMessage and timestamp are provided', () => {
    let request: Request

    beforeEach(() => {
      mockValidateSignature.mockResolvedValueOnce(validResult)
      mockOwnerAddress.mockReturnValueOnce(ownerAddress)
      request = makeRequest({ signedMessage: 'msg', timestamp: '1700000000', authChain })
    })

    it('should prefer signedMessage over timestamp when calling the validator', async () => {
      await validateSignatureHandler({ components: { l1Provider: mockL1Provider }, request: request as any })

      expect(mockValidateSignature).toHaveBeenCalledWith('msg', authChain, mockL1Provider)
    })
  })
})
