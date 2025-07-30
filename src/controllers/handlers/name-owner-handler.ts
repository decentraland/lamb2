import { HandlerContextWithPath, NameOwner } from '../../types'

export async function nameOwnerHandler(
  context: HandlerContextWithPath<'nameOwnerFetcher' | 'logs', '/users/names/:name/owner'>
): Promise<{ status: 200; body: NameOwner }> {
  const { name } = context.params
  const { nameOwnerFetcher } = context.components

  const page = await nameOwnerFetcher.fetchOwnedElements(name)
  return {
    status: 200,
    body: page[0]
  }
}
