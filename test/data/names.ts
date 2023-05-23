import { NameFromQuery } from '../../src/logic/fetch-elements/fetch-names'

export function generateNames(quantity: number): NameFromQuery[] {
  const generatedNames: NameFromQuery[] = []
  for (let i = 0; i < quantity; i++) {
    generatedNames.push({
      id: 'id-' + i,
      name: 'name-' + i,
      contractAddress: 'contractAddress-' + i,
      tokenId: 'tokenId-' + i,
      activeOrder: {
        price: i
      }
    })
  }

  return generatedNames
}
