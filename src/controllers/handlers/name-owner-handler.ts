import { HandlerContextWithPath, NameOwner } from '../../types'

const DCL_NAME_SUFFIX = /\.dcl\.eth$/

export async function nameOwnerHandler(
  context: HandlerContextWithPath<'nameOwnerFetcher' | 'logs', '/names/:name/owner'>
): Promise<{ status: 200 | 404; body?: NameOwner }> {
  const { name } = context.params
  const { nameOwnerFetcher } = context.components

  const dclName = name.trim().toLowerCase().replace(DCL_NAME_SUFFIX, '')
  if (!dclName) {
    return {
      status: 404
    }
  }

  const { elements } = await nameOwnerFetcher.fetchOwnedElements(dclName)
  if (elements.length === 0 || !elements[0].owner) {
    return {
      status: 404
    }
  }

  return {
    status: 200,
    body: elements[0]
  }
}
