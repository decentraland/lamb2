import { OperatorFromQuery } from '../../src/logic/fetch-elements/fetch-permissions'

export function generatePermissions(quantity: number): OperatorFromQuery[] {
  const generatedPermissions: OperatorFromQuery[] = []
  for (let i = 0; i < quantity; i++) {
    generatedPermissions.push({
      id: 'id-' + i,
      x: i.toString(),
      y: (i * 2).toString(),
      owner: {
        id: 'owner-' + i
      },
      updateOperator: 'updateOperator-' + i
    })
  }

  return generatedPermissions
}
