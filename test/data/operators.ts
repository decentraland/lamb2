import { OperatorFromQuery } from '../../src/logic/fetch-elements/fetch-permissions'

export function generateOperators(quantity: number): OperatorFromQuery[] {
  const generatedOperators: OperatorFromQuery[] = []
  for (let i = 0; i < quantity; i++) {
    generatedOperators.push({
      id: 'id-' + i,
      x: i.toString(),
      y: (i * 2).toString(),
      owner: {
        id: 'owner-' + i
      },
      updateOperator: 'updateOperator-' + i
    })
  }

  return generatedOperators
}
