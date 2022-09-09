import { EntityType } from "@dcl/schemas"
import { test } from "../components"
import { Response } from "node-fetch"

const profileEntitiesResponseFull = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0xa87d168717538e86d71ac48baccaeb84162de602"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: true,
        name: "cryptonico",
        description: "",
        tutorialStep: 256,
        userId: "0xa87d168717538e86d71ac48baccaeb84162de602",
        email: "",
        ethAddress: "0xa87d168717538e86d71ac48baccaeb84162de602",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
          wearables: [
            "urn:decentraland:off-chain:base-avatars:eyebrows_00",
            "urn:decentraland:off-chain:base-avatars:short_hair",
            "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7",
            "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1",
            "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet",
            "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand",
            "urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f",
            "urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393",
          ],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
          },
          eyes: {
            color: {
              r: 0.37109375,
              g: 0.22265625,
              b: 0.1953125,
              a: 1,
            },
          },
          hair: {
            color: {
              r: 0.234375,
              g: 0.12890625,
              b: 0.04296875,
              a: 1,
            },
          },
          skin: {
            color: {
              r: 0.94921875,
              g: 0.76171875,
              b: 0.6484375,
              a: 1,
            },
          },
        },
        interests: [],
        hasConnectedWeb3: true,
      },
    ],
  },
}

const profileEntitiesResponseWithoutNFTs = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0xa87d168717538e86d71ac48baccaeb84162de602"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: false,
        name: "cryptonico#e602",
        description: "",
        tutorialStep: 256,
        userId: "0xa87d168717538e86d71ac48baccaeb84162de602",
        email: "",
        ethAddress: "0xa87d168717538e86d71ac48baccaeb84162de602",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
          wearables: [],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
          },
          eyes: {
            color: {
              r: 0.37109375,
              g: 0.22265625,
              b: 0.1953125,
              a: 1,
            },
          },
          hair: {
            color: {
              r: 0.234375,
              g: 0.12890625,
              b: 0.04296875,
              a: 1,
            },
          },
          skin: {
            color: {
              r: 0.94921875,
              g: 0.76171875,
              b: 0.6484375,
              a: 1,
            },
          },
        },
        interests: [],
        unclaimedName: "cryptonico",
        hasConnectedWeb3: true,
      },
    ],
  },
}

const profileEntitiesResponseTwoEthWearables = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0xa87d168717538e86d71ac48baccaeb84162de602"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: false,
        name: "cryptonico#e602",
        description: "",
        tutorialStep: 256,
        userId: "0xa87d168717538e86d71ac48baccaeb84162de602",
        email: "",
        ethAddress: "0xa87d168717538e86d71ac48baccaeb84162de602",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
          wearables: [
            "urn:decentraland:off-chain:base-avatars:eyebrows_00",
            "urn:decentraland:off-chain:base-avatars:short_hair",
            "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet",
            "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand",
          ],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
          },
          eyes: {
            color: {
              r: 0.37109375,
              g: 0.22265625,
              b: 0.1953125,
              a: 1,
            },
          },
          hair: {
            color: {
              r: 0.234375,
              g: 0.12890625,
              b: 0.04296875,
              a: 1,
            },
          },
          skin: {
            color: {
              r: 0.94921875,
              g: 0.76171875,
              b: 0.6484375,
              a: 1,
            },
          },
        },
        interests: [],
        unclaimedName: "cryptonico",
        hasConnectedWeb3: true,
      },
    ],
  },
}

const profileEntitiesResponseTwoMaticWearables = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0xa87d168717538e86d71ac48baccaeb84162de602"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: false,
        name: "cryptonico#e602",
        description: "",
        tutorialStep: 256,
        userId: "0xa87d168717538e86d71ac48baccaeb84162de602",
        email: "",
        ethAddress: "0xa87d168717538e86d71ac48baccaeb84162de602",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
          wearables: [
            "urn:decentraland:off-chain:base-avatars:eyebrows_00",
            "urn:decentraland:off-chain:base-avatars:short_hair",
            "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7",
            "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1"
          ],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
          },
          eyes: {
            color: {
              r: 0.37109375,
              g: 0.22265625,
              b: 0.1953125,
              a: 1,
            },
          },
          hair: {
            color: {
              r: 0.234375,
              g: 0.12890625,
              b: 0.04296875,
              a: 1,
            },
          },
          skin: {
            color: {
              r: 0.94921875,
              g: 0.76171875,
              b: 0.6484375,
              a: 1,
            },
          },
        },
        interests: [],
        unclaimedName: "cryptonico",
        hasConnectedWeb3: true,
      },
    ],
  },
}

const profileEntitiesResponseWithClaimedName = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0xa87d168717538e86d71ac48baccaeb84162de602"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: true,
        name: "cryptonico",
        description: "",
        tutorialStep: 256,
        userId: "0xa87d168717538e86d71ac48baccaeb84162de602",
        email: "",
        ethAddress: "0xa87d168717538e86d71ac48baccaeb84162de602",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
          wearables: [],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
          },
          eyes: {
            color: {
              r: 0.37109375,
              g: 0.22265625,
              b: 0.1953125,
              a: 1,
            },
          },
          hair: {
            color: {
              r: 0.234375,
              g: 0.12890625,
              b: 0.04296875,
              a: 1,
            },
          },
          skin: {
            color: {
              r: 0.94921875,
              g: 0.76171875,
              b: 0.6484375,
              a: 1,
            },
          },
        },
        interests: [],
        hasConnectedWeb3: true,
      },
    ],
  },
}

const profileEntitiesResponseTwoTPWFromSameCollection = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0xa87d168717538e86d71ac48baccaeb84162de602"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: false,
        name: "cryptonico#e602",
        description: "",
        tutorialStep: 256,
        userId: "0xa87d168717538e86d71ac48baccaeb84162de602",
        email: "",
        ethAddress: "0xa87d168717538e86d71ac48baccaeb84162de602",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
          wearables: [
            "urn:decentraland:off-chain:base-avatars:eyebrows_00",
            "urn:decentraland:off-chain:base-avatars:short_hair",
            "urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f",
            "urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393",
          ],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
          },
          eyes: {
            color: {
              r: 0.37109375,
              g: 0.22265625,
              b: 0.1953125,
              a: 1,
            },
          },
          hair: {
            color: {
              r: 0.234375,
              g: 0.12890625,
              b: 0.04296875,
              a: 1,
            },
          },
          skin: {
            color: {
              r: 0.94921875,
              g: 0.76171875,
              b: 0.6484375,
              a: 1,
            },
          },
        },
        interests: [],
        unclaimedName: "cryptonico",
        hasConnectedWeb3: true,
      },
    ],
  },
}

const profileEntitiesResponseSeveralTPWFromDifferentCollections = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0xa87d168717538e86d71ac48baccaeb84162de602"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: false,
        name: "cryptonico#e602",
        description: "",
        tutorialStep: 256,
        userId: "0xa87d168717538e86d71ac48baccaeb84162de602",
        email: "",
        ethAddress: "0xa87d168717538e86d71ac48baccaeb84162de602",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
          wearables: [
            "urn:decentraland:off-chain:base-avatars:eyebrows_00",
            "urn:decentraland:off-chain:base-avatars:short_hair",
            "urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f",
            "urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393",
            "urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:12341234-1234-3434-3434-f9dfde9f9393",
            "urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:34564gf9-1234-3434-3434-f9dfde9f9393",
            "urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:9fg9h3jh-1234-3434-3434-f9dfde9f9393",
          ],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma",
          },
          eyes: {
            color: {
              r: 0.37109375,
              g: 0.22265625,
              b: 0.1953125,
              a: 1,
            },
          },
          hair: {
            color: {
              r: 0.234375,
              g: 0.12890625,
              b: 0.04296875,
              a: 1,
            },
          },
          skin: {
            color: {
              r: 0.94921875,
              g: 0.76171875,
              b: 0.6484375,
              a: 1,
            },
          },
        },
        interests: [],
        unclaimedName: "cryptonico",
        hasConnectedWeb3: true,
      },
    ],
  },
}

const tpwResolverResponseFull = {
  address:"0xa87d168717538e86d71ac48baccaeb84162de602",
  assets:[
    {
      id:"ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f",
      amount:1,
      urn:{decentraland:"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f"}
    },
    {
      id:"ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393",
      amount:1,
      urn:{decentraland:"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393"}
    }
  ],
  total:2,
  page:1,
  next:""
}

const tpwResolverResponseOwnOnlyOne = {
  address:"0xa87d168717538e86d71ac48baccaeb84162de602",
  assets:[
    {
      id:"ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f",
      amount:1,
      urn:{decentraland:"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f"}
    }
  ],
  total:1,
  page:1,
  next:""
}

const tpwResolverResponseFromDifferentCollection = {
  address:"0xa87d168717538e86d71ac48baccaeb84162de602",
  assets:[
    {
      id:"ntr2-meta-3h74jg0g:12341234-1234-3434-3434-f9dfde9f9393",
      amount:1,
      urn:{decentraland:"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:12341234-1234-3434-3434-f9dfde9f9393"}
    },
    {
      id:"ntr2-meta-3h74jg0g:34564gf9-1234-3434-3434-f9dfde9f9393",
      amount:1,
      urn:{decentraland:"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:34564gf9-1234-3434-3434-f9dfde9f9393"}
    }
  ],
  total:1,
  page:1,
  next:""
}

test("integration tests for /profiles", function ({ components, stubComponents }) {
  it("calling without body should return 500", async () => {
    const { localFetch } = components

    const r = await localFetch.fetch("/profiles", {method: 'post'})

    expect(r.status).toEqual(500)
    expect(await r.text()).toEqual("")
  })

  it("calling with an empty body should return 500", async () => {
    const { localFetch } = components

    const r = await localFetch.fetch("/profiles", {method: 'post', body: ''})

    expect(r.status).toEqual(500)
    expect(await r.text()).toEqual("")
  })

  it("calling with body with empty object should return 400", async () => {
    const { localFetch } = components

    const r = await localFetch.fetch("/profiles", {method: 'post', body: '{}'})

    expect(r.status).toEqual(400)
    expect(await r.text()).toEqual("No profile ids were specified. Expected ethAddresses:string[] in body")
  })

  it("calling with an empty list", async () => {
    const { localFetch } = components

    const r = await localFetch.fetch("/profiles", {method: 'post', body: '{"ethAddresses":[]}'})

    expect(r.status).toEqual(200)
    expect(await r.text()).toEqual("[]")
  })

  it("calling with a single profile address, owning everything claimed", async () => {
    const { localFetch } = components
    const { theGraph, fetch } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseFull]))
    theGraph.collectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: [
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet"},
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand"}
        ]
      } as unknown as T
    }
    theGraph.maticCollectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: [
          {urn: "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7"},
          {urn: "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1"}
        ]
      } as unknown as T
    }
    theGraph.ensSubgraph.query = function <T>(query: string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: [ { name: 'cryptonico' } ]
      } as unknown as T
    }
    theGraph.thirdPartyRegistrySubgraph.query = function <T>(query: string) {
      return {
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ],
      } as unknown as T
    }
    fetch.fetch
    .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0xa87d168717538e86d71ac48baccaeb84162de602/assets")
    .onCall(0).resolves(
      new Response(JSON.stringify(tpwResolverResponseFull))
    )
    .onCall(1).resolves(
      new Response(JSON.stringify(tpwResolverResponseFull))
    )
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico")
    expect(responseObj[0].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(6)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393")
  })

  it("calling with a single profile address, owning everything claimed 22222222222223232332323233232232332", async () => {
    const { localFetch } = components
    const { fetch } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseFull]))

    fetch.fetch
    .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0xa87d168717538e86d71ac48baccaeb84162de602/assets")
    .onCall(0).resolves(
      new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne))
    )
    .onCall(1).resolves(
      new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne))
    )
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico")
    expect(responseObj[0].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(6)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393")
  })

  it("calling with a single profile address, without nfts", async () => {
    const { localFetch } = components
    const { theGraph } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseWithoutNFTs]))
    theGraph.collectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.maticCollectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.ensSubgraph.query = function <T>(query: string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual("cryptonico")
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it("calling with a single profile address, two eth wearables, one of them not owned", async () => {
    const { localFetch } = components
    const { theGraph } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseTwoEthWearables]))
    theGraph.collectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: [
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet"}
        ]
      } as unknown as T
    }
    theGraph.maticCollectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.ensSubgraph.query = function <T>(query: string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.thirdPartyRegistrySubgraph.query = function <T>(query: string) {
      return {
        thirdParties: [],
      } as unknown as T
    }
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet")
  })

  it("calling with a single profile address, two matic wearables, one of them not owned", async () => {
    const { localFetch } = components
    const { theGraph } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseTwoMaticWearables]))
    theGraph.collectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.maticCollectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: [
          {urn: "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1"}
        ]
      } as unknown as T
    }
    theGraph.ensSubgraph.query = function <T>(query: string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.thirdPartyRegistrySubgraph.query = function <T>(query: string) {
      return {
        thirdParties: [],
      } as unknown as T
    }
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1")
  })

  it("calling with a single profile address, with claimed name, owning more than one name", async () => {
    const { localFetch } = components
    const { theGraph } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseWithClaimedName]))
    theGraph.collectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.maticCollectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.ensSubgraph.query = function <T>(query: string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: [ 
          { name: 'extra_name1' },
          { name: 'cryptonico' },
          { name: 'extra_name2' }
        ]
      } as unknown as T
    }
    theGraph.thirdPartyRegistrySubgraph.query = function <T>(query: string) {
      return {
        thirdParties: [],
      } as unknown as T
    }
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico")
    expect(responseObj[0].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it("calling with a single profile address, two tpw wearables, one of them not owned", async () => {
    const { localFetch } = components
    const { theGraph, fetch } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseTwoTPWFromSameCollection]))
    theGraph.collectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.maticCollectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.ensSubgraph.query = function <T>(query: string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.thirdPartyRegistrySubgraph.query = function <T>(query: string) {
      return {
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ],
      } as unknown as T
    }
    fetch.fetch
    .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0xa87d168717538e86d71ac48baccaeb84162de602/assets")
    .onCall(0).resolves(
      new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne))
    )
    .onCall(1).resolves(
      new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne))
    )
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f")
  })

  it("calling with a single profile address, five tpw wearables from two different collections, two of them not owned", async () => {
    const { localFetch } = components
    const { theGraph, fetch } = stubComponents
    const addresses = ["0xA87D168717538e86D71aC48BACcaeb84162DE602"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitiesResponseTwoTPWFromSameCollection]))
    theGraph.collectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.maticCollectionsSubgraph.query = function <T>(query:string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.ensSubgraph.query = function <T>(query: string) {
      return {
        P0xa87d168717538e86d71ac48baccaeb84162de602: []
      } as unknown as T
    }
    theGraph.thirdPartyRegistrySubgraph.query = function <T>(query: string) {
      return {
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ],
      } as unknown as T
    }
    fetch.fetch
      .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0xa87d168717538e86d71ac48baccaeb84162de602/assets")
      .onCall(0).resolves(
        new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne))
      )
      .onCall(1).resolves(
        new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne))
      )
      .withArgs("https://api.swappable.io/api/v1/registry/ntr2-meta/address/0xa87d168717538e86d71ac48baccaeb84162de602/assets")
      .onCall(0).resolves(
        new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection))
      )
      .onCall(1).resolves(
        new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection))
      )
      .onCall(2).resolves(
        new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection))
      )
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0xa87d168717538e86d71ac48baccaeb84162de602")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(3)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f")
  })
})