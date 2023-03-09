import { ContentComponent } from "../../src/ports/content";

export function createContentComponentMock(): ContentComponent {
    const getExternalContentServerUrl = jest.fn()
    const fetchEntitiesByPointers = jest.fn()
    
    return {
        getExternalContentServerUrl,
        fetchEntitiesByPointers
    }
}