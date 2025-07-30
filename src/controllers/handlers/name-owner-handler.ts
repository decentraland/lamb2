import { HandlerContextWithPath, NameOwner } from '../../types'

export async function nameOwnerHandler(
  context: HandlerContextWithPath<'nameOwnerFetcher' | 'logs', '/names/:name/owner'>
): Promise<{ status: 200 | 404; body?: NameOwner }> {
  const { name } = context.params
  const { nameOwnerFetcher } = context.components

  const dclName = name.endsWith('.dcl.eth') ? name.split('.dcl')[0] : name

  const page = await nameOwnerFetcher.fetchOwnedElements(dclName)
  if (page.length === 0 || !page[0].owner) {
    return {
      status: 404
    }
  }

  return {
    status: 200,
    body: page[0]
  }
}
