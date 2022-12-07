import { IBaseComponent } from "@well-known-components/interfaces";
import { AppComponents } from "../types";
import { ContentAPI, ContentClient } from 'dcl-catalyst-client'
import { EntityType } from "dcl-catalyst-commons";
import { Entity } from "@dcl/schemas";

export type ContentComponent = IBaseComponent & {
    getExternalContentServerUrl(): string
    fetchEntitiesByPointers(type: EntityType, pointers: string[]): Promise<Entity[]>
}

export async function createContentComponent(components: Pick<AppComponents, 'config'>): Promise<ContentComponent> {
    const contentServerURL = await getContentServerAddress(components)
    const contentClient: ContentAPI = new ContentClient({ contentUrl: contentServerURL })

    async function start() {}

    async function stop() {}

    function getExternalContentServerUrl(): string {
        return contentServerURL
    }

    function fetchEntitiesByPointers(type: EntityType, pointers: string[]) {
        return contentClient.fetchEntitiesByPointers(type, pointers)
    }

    return {
        start,
        stop,
        getExternalContentServerUrl,
        fetchEntitiesByPointers
    }
}

async function getContentServerAddress(components: Pick<AppComponents, 'config'>) {
    let configAddress: string = (await components.config.getString('CONTENT_SERVER_ADDRESS')) ?? 'http://content-server:6969'
    configAddress = configAddress.toLowerCase()
    if (!configAddress.startsWith('http')) {
      configAddress = 'http://' + configAddress
    }
    while (configAddress.endsWith('/')) {
      configAddress = configAddress.slice(0, -1)
    }
    return configAddress
}