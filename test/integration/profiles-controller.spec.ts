import { EntityType } from "@dcl/schemas"
import { test } from "../components"
import { Response } from "node-fetch"
import sinon from "sinon"

const profileEntityFull = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x1"],
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
        userId: "0x1",
        email: "",
        ethAddress: "0x1",
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

const profileEntityWithoutNFTs = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x2"],
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
        userId: "0x2",
        email: "",
        ethAddress: "0x2",
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

const profileEntityTwoEthWearables = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x3"],
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
        userId: "0x3",
        email: "",
        ethAddress: "0x3",
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

const profileEntityTwoMaticWearables = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x4"],
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
        userId: "0x4",
        email: "",
        ethAddress: "0x4",
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

const profileEntityWithClaimedName = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x5"],
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
        userId: "0x5",
        email: "",
        ethAddress: "0x5",
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

const profileEntityTwoTPWFromSameCollection = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x6"],
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
        userId: "0x6",
        email: "",
        ethAddress: "0x6",
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

const profileEntitySeveralTPWFromDifferentCollections = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x7"],
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
        userId: "0x7",
        email: "",
        ethAddress: "0x7",
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

const profileEntityFullB = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x1b"],
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
        userId: "0x1b",
        email: "",
        ethAddress: "0x1b",
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

const profileEntityFullAnother = {
  version: "v3",
  id: "an9d8fngnsd97sdfnsd9n0gsmw987rgsafdn8hsdtgyaerdhgah0rfg0ad9",
  type: EntityType.PROFILE,
  timestamp: 1662137617152,
  pointers: ["0x8"],
  content: [
    {
      file: "body.png",
      hash: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lue",
    },
    {
      file: "face256.png",
      hash: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2me",
    },
  ],
  metadata: {
    avatars: [
      {
        hasClaimedName: true,
        name: "testing",
        description: "",
        tutorialStep: 256,
        userId: "0x8",
        email: "",
        ethAddress: "0x8",
        version: 30,
        avatar: {
          bodyShape: "urn:decentraland:off-chain:base-avatars:BaseFemale",
          wearables: [
            "urn:decentraland:off-chain:base-avatars:eyebrows_01",
            "urn:decentraland:off-chain:base-avatars:long_hair",
            "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:6",
            "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:2",
            "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hat",
            "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_shirt",
            "urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:w3499wer-523f-403f-9730-f09c992f386f",
            "urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:12341234-9876-3434-3434-f9dfde9f9393",
          ],
          snapshots: {
            body: "bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lue",
            face256: "bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2me",
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

const profileEntityOldBodyshape = {
  version: "v3",
  id: "bafkreid2ltr77sewkzr4xz37pzyvcgzeljubecqworvsdbw7t5333h6q3a",
  type: EntityType.PROFILE,
  timestamp: 1662137617154,
  pointers: ["0x9"],
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
        userId: "0x9",
        email: "",
        ethAddress: "0x9",
        version: 30,
        avatar: {
          bodyShape: "dcl://base-avatars/BaseFemale",
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

const tpwResolverResponseFull = {
  address:"0x1",
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
  address:"0x7",
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
  address:"0x7",
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

const tpwResolverResponseFullAnother = {
  address:"0x8",
  assets:[
    {
      id:"ntr2-meta-3h74jg0g:12341234-1234-3434-3434-f9dfde9f9393",
      amount:1,
      urn:{decentraland:"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:w3499wer-523f-403f-9730-f09c992f386f"}
    },
    {
      id:"ntr2-meta-3h74jg0g:34564gf9-1234-3434-3434-f9dfde9f9393",
      amount:1,
      urn:{decentraland:"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:12341234-9876-3434-3434-f9dfde9f9393"}
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
    const { theGraph, fetch, content } = stubComponents
    const addresses = ["0x1"]

    content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityFull]))
    const wearablesQuery = "{\n        P0x1: nfts(where: { owner: \"0x1\", searchItemType_in: [\"wearable_v1\", \"wearable_v2\", \"smart_wearable_v1\", \"emote_v1\"], urn_in: [\"urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7\",\"urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1\",\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet\",\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand\",\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f\",\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393\"] }, first: 1000) {\n        urn\n        }\n    }"
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
        P0x1: [
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet"},
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand"}
        ]
    })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
        P0x1: [
          {urn: "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7"},
          {urn: "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1"}
        ]
    })
    
    const namesQuery = "{\n      P0x1: nfts(where: { owner: \"0x1\", category: ens, name_in: [\"cryptonico\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({P0x1: [ { name: 'cryptonico' } ]})
    
    const tpwQuery = "\nquery ThirdPartyResolver($id: String!) {\n  thirdParties(where: {id: $id, isApproved: true}) {\n    id\n    resolver\n  }\n}\n"
    const tpwId = "urn:decentraland:matic:collections-thirdparty:ntr1-meta"
    theGraph.thirdPartyRegistrySubgraph.query = sinon.stub().withArgs(tpwQuery, {tpwId}).resolves({
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ]
    })
    fetch.fetch
      .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x1/assets")
      .onCall(0).resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      .onCall(1).resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    sinon.assert.calledOnceWithMatch(content.fetchEntitiesByPointers, EntityType.PROFILE, addresses)
    // sinon.assert.calledOnceWithMatch(theGraph.collectionsSubgraph.query, wearablesQuery, {})
    // sinon.assert.calledOnceWithMatch(theGraph.maticCollectionsSubgraph.query, wearablesQuery, {})
    // sinon.assert.calledOnce(theGraph.collectionsSubgraph.query)

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x1")
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
    const addresses = ["0x2"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityWithoutNFTs]))
    const wearablesQuery = '{        P0x2: nfts(where: { owner: "0x2", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [] }, first: 1000) {        urn        }    }'
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
      P0x2: []
    })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
      P0x2: []
    })
    const namesQuery = "{\n      P0x2: nfts(where: { owner: \"0x2\", category: ens, name_in: [\"cryptonico#e602\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({
      P0x2: []
    })
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x2")
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
    const addresses = ["0x3"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityTwoEthWearables]))

    const wearablesQuery = "{\n        P0x3: nfts(where: { owner: \"0x3\", searchItemType_in: [\"wearable_v1\", \"wearable_v2\", \"smart_wearable_v1\", \"emote_v1\"], urn_in: [\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet\",\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand\"] }, first: 1000) {\n        urn\n        }\n    }"
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
      P0x3: [
        {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet"}
      ]
    })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
        P0x3: []
    })
    const namesQuery = "{\n      P0x3: nfts(where: { owner: \"0x3\", category: ens, name_in: [\"cryptonico#e602\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({
        P0x3: []
    })
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x3")
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
    const addresses = ["0x4"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityTwoMaticWearables]))
    const wearablesQuery = "{\n        P0x4: nfts(where: { owner: \"0x4\", searchItemType_in: [\"wearable_v1\", \"wearable_v2\", \"smart_wearable_v1\", \"emote_v1\"], urn_in: [\"urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7\",\"urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1\"] }, first: 1000) {\n        urn\n        }\n    }"
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
        P0x4: []
    })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
        P0x4: [
          {urn: "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1"}
        ]
    })
    const namesQuery = "{\n      P0x4: nfts(where: { owner: \"0x4\", category: ens, name_in: [\"cryptonico#e602\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({
        P0x4: []
    })
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x4")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1")
  })

  it("calling with a single profile address, owning claimed name", async () => {
    const { localFetch } = components
    const { theGraph } = stubComponents
    const addresses = ["0x5"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityWithClaimedName]))
    const wearablesQuery = '{        P0x5: nfts(where: { owner: "0x5", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [] }, first: 1000) {        urn        }    }'
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
      P0x5: []
    })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
      P0x5: []
    })
    const namesQuery = "{\n      P0x5: nfts(where: { owner: \"0x5\", category: ens, name_in: [\"cryptonico\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({
        P0x5: [ { name: 'cryptonico' },]
    })
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x5")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico")
    expect(responseObj[0].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })

  it("calling with a single profile address, two tpw wearables from same collection, one of them not owned", async () => {
    const { localFetch } = components
    const { theGraph, fetch } = stubComponents
    const addresses = ["0x6"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityTwoTPWFromSameCollection]))
    
    const wearablesQuery = "{\n        P0x6: nfts(where: { owner: \"0x6\", searchItemType_in: [\"wearable_v1\", \"wearable_v2\", \"smart_wearable_v1\", \"emote_v1\"], urn_in: [\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f\",\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393\"] }, first: 1000) {\n        urn\n        }\n    }"
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({ P0x6: [] })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({ P0x6: [] })
    
    const namesQuery = "{\n      P0x6: nfts(where: { owner: \"0x6\", category: ens, name_in: [\"cryptonico#e602\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({ P0x6: [] })

    const tpwQuery = "\nquery ThirdPartyResolver($id: String!) {\n  thirdParties(where: {id: $id, isApproved: true}) {\n    id\n    resolver\n  }\n}\n"
    const tpwId = "urn:decentraland:matic:collections-thirdparty:ntr1-meta"
    theGraph.thirdPartyRegistrySubgraph.query = sinon.stub().withArgs(tpwQuery, {tpwId}).resolves({
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ]
    })
    fetch.fetch
      .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x6/assets")
      .onCall(0).resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))
      .onCall(1).resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x6")
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
    const addresses = ["0x7"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntitySeveralTPWFromDifferentCollections]))
    const wearablesQuery = "{\n        P0x7: nfts(where: { owner: \"0x7\", searchItemType_in: [\"wearable_v1\", \"wearable_v2\", \"smart_wearable_v1\", \"emote_v1\"], urn_in: [\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f\",\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393\",\"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:12341234-1234-3434-3434-f9dfde9f9393\",\"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:34564gf9-1234-3434-3434-f9dfde9f9393\",\"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:9fg9h3jh-1234-3434-3434-f9dfde9f9393\"] }, first: 1000) {\n        urn\n        }\n    }"
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({ P0x7: [] })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({ P0x7: [] })
    
    const namesQuery = "{\n      P0x7: nfts(where: { owner: \"0x7\", category: ens, name_in: [\"cryptonico#e602\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({ P0x7: [] })

    const tpwQuery = "\nquery ThirdPartyResolver($id: String!) {\n  thirdParties(where: {id: $id, isApproved: true}) {\n    id\n    resolver\n  }\n}\n"
    const tpwId1 = "urn:decentraland:matic:collections-thirdparty:ntr1-meta"
    const tpwId2 = "urn:decentraland:matic:collections-thirdparty:ntr2-meta"
    theGraph.thirdPartyRegistrySubgraph.query = sinon.stub()
      .withArgs(tpwQuery, {tpwId1}).resolves({
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ]
      })
      .withArgs(tpwQuery, {tpwId2}).resolves({
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr2-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ]
      })
    fetch.fetch
      .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x7/assets")
      .onCall(0).resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))
      .onCall(1).resolves(new Response(JSON.stringify(tpwResolverResponseOwnOnlyOne)))
      .withArgs("https://api.swappable.io/api/v1/registry/ntr2-meta/address/0x7/assets")
      .onCall(0).resolves(new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection)))
      .onCall(1).resolves(new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection)))
      .onCall(2).resolves(new Response(JSON.stringify(tpwResolverResponseFromDifferentCollection)))
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x7")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual('cryptonico')
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseMale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(3)
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:12341234-1234-3434-3434-f9dfde9f9393")
    expect(responseObj[0].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-3h74jg0g:34564gf9-1234-3434-3434-f9dfde9f9393")
  })

  it("calling with two profile addresses, owning everything claimed", async () => {
    const { localFetch } = components
    const { theGraph, fetch } = stubComponents
    const addresses = ["0x1b", "0x8"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityFullB, profileEntityFullAnother]))
    const wearablesQuery = "{\n        P0x1b: nfts(where: { owner: \"0x1b\", searchItemType_in: [\"wearable_v1\", \"wearable_v2\", \"smart_wearable_v1\", \"emote_v1\"], urn_in: [\"urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7\",\"urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1\",\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet\",\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand\",\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:98ac122c-523f-403f-9730-f09c992f386f\",\"urn:decentraland:matic:collections-thirdparty:ntr1-meta:ntr1-meta-1ef79e7b:12341234-1234-3434-3434-f9dfde9f9393\"] }, first: 1000) {\n        urn\n        }\n    \n\n        P0x8: nfts(where: { owner: \"0x8\", searchItemType_in: [\"wearable_v1\", \"wearable_v2\", \"smart_wearable_v1\", \"emote_v1\"], urn_in: [\"urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:6\",\"urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:2\",\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hat\",\"urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_shirt\",\"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:w3499wer-523f-403f-9730-f09c992f386f\",\"urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:12341234-9876-3434-3434-f9dfde9f9393\"] }, first: 1000) {\n        urn\n        }\n    }"
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
        P0x1b: [
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_feet"},
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hand"}
        ],
        P0x8: [
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hat"},
          {urn: "urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_shirt"}
        ]
    })
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({
        P0x1b: [
          {urn: "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:7"},
          {urn: "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:1"}
        ],
        P0x8: [
          {urn: "urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:6"},
          {urn: "urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:2"}
        ]
    })
    const namesQuery = "{\n      P0x1b: nfts(where: { owner: \"0x1b\", category: ens, name_in: [\"cryptonico\"] }, first: 1000) {\n        name\n      }\n    \n\n      P0x8: nfts(where: { owner: \"0x8\", category: ens, name_in: [\"testing\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({
        P0x1b: [ { name: 'cryptonico' } ],
        P0x8: [ { name: 'testing' } ]
    })
    const tpwQuery = "\nquery ThirdPartyResolver($id: String!) {\n  thirdParties(where: {id: $id, isApproved: true}) {\n    id\n    resolver\n  }\n}\n"
    const tpwId = "urn:decentraland:matic:collections-thirdparty:ntr1-meta"
    theGraph.thirdPartyRegistrySubgraph.query = sinon.stub().withArgs(tpwQuery, {tpwId}).resolves({
        thirdParties: [
          {
            id: "urn:decentraland:matic:collections-thirdparty:ntr1-meta",
            resolver: "https://api.swappable.io/api/v1",
          },
        ]
    })
    fetch.fetch
      .withArgs("https://api.swappable.io/api/v1/registry/ntr1-meta/address/0x1b/assets")
      .onCall(0).resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      .onCall(1).resolves(new Response(JSON.stringify(tpwResolverResponseFull)))
      .withArgs("https://api.swappable.io/api/v1/registry/ntr2-meta/address/0x8/assets")
      .onCall(0).resolves(new Response(JSON.stringify(tpwResolverResponseFullAnother)))
      .onCall(1).resolves(new Response(JSON.stringify(tpwResolverResponseFullAnother)))
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(2)
    
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x1b")
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

    expect(responseObj[1].avatars.length).toEqual(1)
    expect(responseObj[1].avatars?.[0].hasClaimedName).toEqual(true)
    expect(responseObj[1].avatars?.[0].ethAddress).toEqual("0x8")
    expect(responseObj[1].avatars?.[0].name).toEqual("testing")
    expect(responseObj[1].avatars?.[0].unclaimedName).toBeUndefined()
    expect(responseObj[1].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseFemale")
    expect(responseObj[1].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lue")
    expect(responseObj[1].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2me")
    expect(responseObj[1].avatars?.[0].avatar.wearables.length).toEqual(6)
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0xa25c20f58ac447621a5f854067b857709cbd60eb:6")
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-v2:0x293d1ae40b28c39d7b013d4a1fe3c5a8c016bf19:2")
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain("urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_hat")
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain("urn:decentraland:ethereum:collections-v1:ethermon_wearables:ethermon_shirt")
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:w3499wer-523f-403f-9730-f09c992f386f")
    expect(responseObj[1].avatars?.[0].avatar.wearables).toContain("urn:decentraland:matic:collections-thirdparty:ntr2-meta:ntr2-meta-123v289a:12341234-9876-3434-3434-f9dfde9f9393")
  })
  
  it("calling with a single profile address with old body shape format", async () => {
    const { localFetch } = components
    const { theGraph } = stubComponents
    const addresses = ["0x9"]

    stubComponents.content.fetchEntitiesByPointers.withArgs(EntityType.PROFILE, addresses).resolves(await Promise.all([profileEntityOldBodyshape]))
    const wearablesQuery = '{        P0x9: nfts(where: { owner: "0x9", searchItemType_in: ["wearable_v1", "wearable_v2", "smart_wearable_v1", "emote_v1"], urn_in: [] }, first: 1000) {        urn        }    }'
    theGraph.collectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({P0x9: []})
    theGraph.maticCollectionsSubgraph.query = sinon.stub().withArgs(wearablesQuery, {}).resolves({P0x9: []})
    const namesQuery = "{\n      P0x9: nfts(where: { owner: \"0x2\", category: ens, name_in: [\"cryptonico#e602\"] }, first: 1000) {\n        name\n      }\n    }"
    theGraph.ensSubgraph.query = sinon.stub().withArgs(namesQuery, {}).resolves({P0x9: []})
    
    const response = await localFetch.fetch("/profiles", {method: 'post', body: JSON.stringify({ethAddresses:addresses})})

    expect(response.status).toEqual(200)
    const responseText = await response.text()
    const responseObj = JSON.parse(responseText)
    expect(responseObj.length).toEqual(1)
    expect(responseObj[0].avatars.length).toEqual(1)
    expect(responseObj[0].avatars?.[0].hasClaimedName).toEqual(false)
    expect(responseObj[0].avatars?.[0].ethAddress).toEqual("0x9")
    expect(responseObj[0].avatars?.[0].name).toEqual("cryptonico#e602")
    expect(responseObj[0].avatars?.[0].unclaimedName).toEqual("cryptonico")
    expect(responseObj[0].avatars?.[0].avatar.bodyShape).toEqual("urn:decentraland:off-chain:base-avatars:BaseFemale")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.body).toEqual("https://peer.decentraland.org/content/contents/bafkreicilawwtbjyf6ahyzv64ssoamdm73rif75qncee5lv6j3a3352lua")
    expect(responseObj[0].avatars?.[0].avatar.snapshots.face256).toEqual("https://peer.decentraland.org/content/contents/bafkreigi3yrgdhvjr2cqzxvfztnsubnll2cfdioo4vfzu6o6vibwoag2ma")
    expect(responseObj[0].avatars?.[0].avatar.wearables.length).toEqual(0)
  })
})