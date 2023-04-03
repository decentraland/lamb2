import { paginationObject } from "../../src/logic/pagination"

describe('paginationObject should', () => {
    const BASE_URL = 'https://host/users/0x000/wearables'
    const sut = paginationObject

    test('return values from query-string as expected (pageSize & pageNum)', () => {
        const url = BASE_URL + '?pageSize=10&pageNum=2'
        const { pageSize, pageNum } = sut(new URL(url))

        expect(pageSize).toBe(10)
        expect(pageNum).toBe(2)
    })

    test('return calculated value offset as expected', () => {
        const url = BASE_URL + '?pageSize=10&pageNum=3'
        const { offset } = sut(new URL(url))

        expect(offset).toBe(20)
    })

    test('return calculated value limit as expected', () => {
        const url = BASE_URL + '?pageSize=11&pageNum=2'
        const { offset } = sut(new URL(url))

        expect(offset).toBe(11)
    })
})