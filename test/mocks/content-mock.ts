import { ContentClient } from "dcl-catalyst-client"

export function createContentClientMock(): Pick<ContentClient, 'fetchEntitiesByPointers'> {
    const fetchEntitiesByPointers = jest.fn()

    return {
        fetchEntitiesByPointers
    }
}
