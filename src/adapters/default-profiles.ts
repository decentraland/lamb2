import { Profile } from '@dcl/catalyst-api-specs/lib/client'
import { IBaseComponent } from '@well-known-components/interfaces'

export type DefaultProfilesComponent = IBaseComponent & {
  getProfile(id: string): Profile | undefined
}

const defaultProfiles: Record<string, Profile> = {
  default1: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sweater',
            'dcl://base-avatars/f_jeans',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/f_eyes_00',
            'dcl://base-avatars/f_eyebrows_00',
            'dcl://base-avatars/f_mouth_00'
          ],
          snapshots: {
            face: 'QmZbyGxDnZ4PaMVX7kpA2NuGTrmnpwTJ8heKKTSCk4GRJL',
            body: 'https://peer.decentraland.org/content/contents/QmaQvcBWg57Eqf5E9R3Ts1ttPKKLhKueqdyhshaLS1tu2g',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default2: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sport_purple_tshirt',
            'dcl://base-avatars/f_roller_leggings',
            'dcl://base-avatars/sport_black_shoes',
            'dcl://base-avatars/hair_coolshortstyle',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'Qmc3FbXg9BEH6H71TuELn9qVvsU86EaneMqYbeojE8ZdG3',
            body: 'https://peer.decentraland.org/content/contents/QmWhbfcBb7yRgXVbjS5fN98FhY2KQRydthVv2XcoaNavR3',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default3: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_striped_shirt',
            'dcl://base-avatars/elegant_blue_trousers',
            'dcl://base-avatars/f_m_sandals',
            'dcl://base-avatars/modern_hair',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'QmX2QCMjitWGhGmkgiqtA1tHz69zK44xAHkWz5bjNwkhHT',
            body: 'https://peer.decentraland.org/content/contents/QmUc8WrXhkEjXyzFyzKNFNCEatn3fiyoursXeEfi4HQmPa',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default4: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/colored_sweater',
            'dcl://base-avatars/f_brown_trousers',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/two_tails',
            'dcl://base-avatars/square_earring',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'Qme7PhmJuHEh5sQDzC8xHEpN7h8jKoQNN86ZacY3pfScz3',
            body: 'https://peer.decentraland.org/content/contents/QmfXHadqcC9uU2Szo7kCb7eCUYQ3YaLQubBuJr789MPPVN',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default5: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_blue_jacket',
            'dcl://base-avatars/f_capris',
            'dcl://base-avatars/ruby_blue_loafer',
            'dcl://base-avatars/pony_tail',
            'dcl://base-avatars/pearls_earring',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmVZ5KBsikcPyccf55Fn2BPeReGBPqB4WDmrPsyaFAefbb',
            body: 'https://peer.decentraland.org/content/contents/QmUTEyiAKACBzcMMceH3FhcP462SUoGjcLU4B7bu5dGVCt',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default6: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/f_white_shirt',
            'dcl://base-avatars/distressed_black_Jeans',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/hair_punk',
            'dcl://base-avatars/punk_piercing',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmYGZqA2Ny23BNHCs4iyVThaLF7HYXTZvFXqt1usLKbyBT',
            body: 'https://peer.decentraland.org/content/contents/QmWSbmF6grkcShZN3zu1fZiEEr6eNGGBfxeFrA5m2y2W4J',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default7: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_pride_t_shirt',
            'dcl://base-avatars/f_red_comfy_pants',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/f_glasses_fashion',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmPdTU7tvXGc3ZQcZe6CnnPJg68pUMiqkhXbgRir4kuip4',
            body: 'https://peer.decentraland.org/content/contents/QmW8mZfG2abPbCba5fuXP848gLXHpk6a4a5ukVhAmQTWwa',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default8: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/light_green_shirt',
            'dcl://base-avatars/f_red_modern_pants',
            'dcl://base-avatars/pink_blue_socks',
            'dcl://base-avatars/double_bun',
            'dcl://base-avatars/thunder_02_earring',
            'dcl://base-avatars/f_eyes_06'
          ],
          snapshots: {
            face: 'QmUZ8mczjrJbFHtUiiFQvkhbFzZrSxaYkF6Dr7qUkdGxwQ',
            body: 'https://peer.decentraland.org/content/contents/QmcbLtwDzjGkkTyAyGU3NtnDQhhrnjdpHM9UtoW19m5vy9',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default9: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_simple_yellow_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/pink_sleepers',
            'dcl://base-avatars/cornrows',
            'dcl://base-avatars/green_stone_tiara',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'QmZ3HbVnuefHJST1crtPXp6zpM7vRAh2XPnJDVondAKGNw',
            body: 'https://peer.decentraland.org/content/contents/QmWuspyfjriiBW9PLnePNEVvXF1wtq68JdK5jNshp3AL8A',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default10: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_elegant_jacket',
            'dcl://base-avatars/f_country_pants',
            'dcl://base-avatars/ruby_red_loafer',
            'dcl://base-avatars/curly_hair',
            'dcl://base-avatars/black_sun_glasses',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmSH1iEbQuXm3SrvMBkQTbkSYbSc7CsUYC5QJALzz5U1oF',
            body: 'https://peer.decentraland.org/content/contents/QmZXcHs4G4zigjfnJCvtjW5qrK2Gtdc9bWeR2FJFhgkFno',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default11: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.9137254953384399,
              g: 0.5098039507865906,
              b: 0.20392157137393951
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/simple_blue_tshirt',
            'dcl://base-avatars/f_african_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/00_EmptyEarring',
            'dcl://base-avatars/f_mouth_07'
          ],
          snapshots: {
            face: 'QmfJvMmPHm2YEak58fCQfThCVBydrF35gzbW5YtYaN2XYw',
            body: 'https://peer.decentraland.org/content/contents/QmSbZ4HQJbi9mDBXcMBfrMhPWXYcDG8twRqn3krzqMeT2D',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default12: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/baggy_pullover',
            'dcl://base-avatars/f_stripe_white_pants',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/hair_undere',
            'dcl://base-avatars/green_feather_earring',
            'dcl://base-avatars/f_eyes_10'
          ],
          snapshots: {
            face: 'QmP6ao5sgc51QiNMZ3ArV8a6w4cHdZoCMbWM89j8xXiEoq',
            body: 'https://peer.decentraland.org/content/contents/QmeE1rgqdfVrY32gbbjcrmupLJvq6iBgtwZCt1vudcQgwK',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default13: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_simple_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/pompous',
            'dcl://base-avatars/retro_sunglasses',
            'dcl://base-avatars/f_eyebrows_05'
          ],
          snapshots: {
            face: 'QmSgrUhFyFWW9bKEEkQTkLQSqHrS66D1rMUSxboEXMZfCC',
            body: 'https://peer.decentraland.org/content/contents/QmPyE9ZT5U3H96Ch6iDhBFRQSagsMiQzGzV84R8LhDZJfk',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default14: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2823529541492462,
              g: 0.8627451062202454,
              b: 0.4588235318660736
            }
          },
          wearables: [
            'dcl://base-avatars/school_shirt',
            'dcl://base-avatars/f_school_skirt',
            'dcl://base-avatars/Moccasin',
            'dcl://base-avatars/hair_anime_01',
            'dcl://base-avatars/f_eyes_08',
            'dcl://base-avatars/blue_star_earring'
          ],
          snapshots: {
            face: 'Qmb3SAZuKe7viexVuEzCpVdmfnHc8pNffD2dmiv9TTnmsJ',
            body: 'https://peer.decentraland.org/content/contents/QmeEmYCkVvGCmxptFimVgiEtgDXD19T5fvUshURsBgt6rH',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default15: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.21176470816135406,
              g: 0.14901961386203766,
              b: 0.14901961386203766
            }
          },
          wearables: [
            'dcl://base-avatars/roller_outfit',
            'dcl://base-avatars/f_short_colored_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/hair_stylish_hair',
            'dcl://base-avatars/pink_gem_earring',
            'dcl://base-avatars/f_eyebrows_04'
          ],
          snapshots: {
            face: 'QmPYs2JUnmhxxgqY5TaUpW6AUDcRRRWGqW8B8euArRxBsZ',
            body: 'https://peer.decentraland.org/content/contents/QmViXznW3uzcA5Q52RZteYZVQskULVqnYzt4koD3i6eqQ6',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default16: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_pink_simple_tshirt',
            'dcl://base-avatars/f_diamond_leggings',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/Thunder_earring',
            'dcl://base-avatars/f_mouth_07'
          ],
          snapshots: {
            face: 'QmexvEFaWMFT5p7TmBmnFTfEpkoAoLfYximjx9dYSqA3Nd',
            body: 'https://peer.decentraland.org/content/contents/QmU1KSQV15GYBVgkJKX5gSA2UpNkzjoEeLUFWGwEgoin9S',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default17: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sweater',
            'dcl://base-avatars/f_jeans',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/f_eyes_00',
            'dcl://base-avatars/f_eyebrows_00',
            'dcl://base-avatars/f_mouth_00'
          ],
          snapshots: {
            face: 'QmZEfygbTwMsTufY7GyyFUuVqiHcoLiRYXBHNdYJsWw9f6',
            body: 'https://peer.decentraland.org/content/contents/QmeFuxqL4xYHKRk7ogL4za8pniudiALFr4RqFaqVcgZgbo',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default18: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sport_purple_tshirt',
            'dcl://base-avatars/f_roller_leggings',
            'dcl://base-avatars/sport_black_shoes',
            'dcl://base-avatars/hair_coolshortstyle',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'QmesGWGXXnAA1XsNjYwGavRThHjdHkGSPS1fgPzo2HJH66',
            body: 'https://peer.decentraland.org/content/contents/QmYCv3PeRSUYPkqwdVPwWpgTFBSNHVBkWNedH5pPte6Ssp',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default19: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_striped_shirt',
            'dcl://base-avatars/elegant_blue_trousers',
            'dcl://base-avatars/f_m_sandals',
            'dcl://base-avatars/modern_hair',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'QmPNgECVpXBG5BkSeYNeWQ1kUJEpAVtsTc21WYYyiAHKaK',
            body: 'https://peer.decentraland.org/content/contents/QmaHWB3BAzPEDvAz1S1WGLU8w6QZ3bNf4YHhwm8YjNeuEc',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default20: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/colored_sweater',
            'dcl://base-avatars/f_brown_trousers',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/two_tails',
            'dcl://base-avatars/square_earring',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'QmaNYCgdzGAXxxEeqJE8yBMzqceez3NaD27VPP4AfCv2UQ',
            body: 'https://peer.decentraland.org/content/contents/QmZhamNBDKA5Ad8sMKHPSsKJ99ujcig9ybanpENjgV1Gz8',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default21: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_blue_jacket',
            'dcl://base-avatars/f_capris',
            'dcl://base-avatars/ruby_blue_loafer',
            'dcl://base-avatars/pony_tail',
            'dcl://base-avatars/pearls_earring',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmQEGLeiLQSvJd6wD3sMPcVKYdLRWYuh6GfftaA92NybNp',
            body: 'https://peer.decentraland.org/content/contents/QmZb4cYgo7gMpAJpAmJf1djc2dbrTqzQvZ77zN8yBfNX4F',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default22: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/f_white_shirt',
            'dcl://base-avatars/distressed_black_Jeans',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/hair_punk',
            'dcl://base-avatars/punk_piercing',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmZJyUrU9j8uENuux34LaWYRb4r3K7qyNMNVrujmcST4tu',
            body: 'https://peer.decentraland.org/content/contents/QmYLAivPA5Fg7kr9jXK1Fid5q7kF1ziafgWffqM3Zasu9n',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default23: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_pride_t_shirt',
            'dcl://base-avatars/f_red_comfy_pants',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/f_glasses_fashion',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmXrTnZaTdntmeSA5zMe6ofDkTRE97v52rhh4RdChFVNEC',
            body: 'https://peer.decentraland.org/content/contents/QmPQM8duNdFwBnf4V2bMp27sAQYCuZEe3rML1rhuhcYLeN',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default24: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/light_green_shirt',
            'dcl://base-avatars/f_red_modern_pants',
            'dcl://base-avatars/pink_blue_socks',
            'dcl://base-avatars/double_bun',
            'dcl://base-avatars/thunder_02_earring',
            'dcl://base-avatars/f_eyes_06'
          ],
          snapshots: {
            face: 'QmZAiFKeBznoPkJTyiYj5BXA55LEAHdJkNengRB1SySGN5',
            body: 'https://peer.decentraland.org/content/contents/Qme6uHKYJmDNy9nAWnYvUHEc3vw94pWnV16FWB162MHf3E',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default25: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_simple_yellow_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/pink_sleepers',
            'dcl://base-avatars/cornrows',
            'dcl://base-avatars/green_stone_tiara',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'QmRhiamfkxnNUeV8cZd3tNQYfpTa7CnXoqRE2NqkkHZM16',
            body: 'https://peer.decentraland.org/content/contents/QmNYpYdSFV7GhuPBoqJGKdghPK8kkNFVUXcShfuWhKwJQF',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default26: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_elegant_jacket',
            'dcl://base-avatars/f_country_pants',
            'dcl://base-avatars/ruby_red_loafer',
            'dcl://base-avatars/curly_hair',
            'dcl://base-avatars/black_sun_glasses',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmZXRnKQgjojNdZxpvjL53U1q2QJFzib5xDAZ4uYDTLTdA',
            body: 'https://peer.decentraland.org/content/contents/QmataMEo7M9AkuMGfnz77tA2ACJscs1m5YRKAGiZ1vY2Zb',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default27: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.9137254953384399,
              g: 0.5098039507865906,
              b: 0.20392157137393951
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/simple_blue_tshirt',
            'dcl://base-avatars/f_african_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/00_EmptyEarring',
            'dcl://base-avatars/f_mouth_07'
          ],
          snapshots: {
            face: 'QmPxhNLsbVmbxKRRZNcFgq88bxKvXB9LiSWmvefxxicR3c',
            body: 'https://peer.decentraland.org/content/contents/QmQfMEk5cVdaLjhjq2qFB97PbArFJcSmEdHjb9cU9Yn3Ai',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default28: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/baggy_pullover',
            'dcl://base-avatars/f_stripe_white_pants',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/hair_undere',
            'dcl://base-avatars/green_feather_earring',
            'dcl://base-avatars/f_eyes_10'
          ],
          snapshots: {
            face: 'QmdZzG5QHgyWaw7gezgZ6CLLs5z3PRfya7E1ugJ3pqcSYu',
            body: 'https://peer.decentraland.org/content/contents/QmV7YkF4EZ8FWiniAqYrhYfqXF2A5gdfihiYBpjCzSXnBL',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default29: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_simple_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/pompous',
            'dcl://base-avatars/retro_sunglasses',
            'dcl://base-avatars/f_eyebrows_05'
          ],
          snapshots: {
            face: 'QmcSU2poxLeJ8oA3DdKWDr7iyQ6usbvZKoM6sK998pYdnK',
            body: 'https://peer.decentraland.org/content/contents/QmWAUBFot7sTohiYrhQ56W1SpnJ4NyyCcA5T4iKP2B68td',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default30: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2823529541492462,
              g: 0.8627451062202454,
              b: 0.4588235318660736
            }
          },
          wearables: [
            'dcl://base-avatars/school_shirt',
            'dcl://base-avatars/f_school_skirt',
            'dcl://base-avatars/Moccasin',
            'dcl://base-avatars/hair_anime_01',
            'dcl://base-avatars/f_eyes_08',
            'dcl://base-avatars/blue_star_earring'
          ],
          snapshots: {
            face: 'QmRtnDxw7cgyN7ccN11zBYx4DQ9ag43njJ3hbxrPuUPobu',
            body: 'https://peer.decentraland.org/content/contents/Qmagbniw5LFmrMGbrCSRNiSXojxRfGs4QnDCqJXx8PaNSQ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default31: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.21176470816135406,
              g: 0.14901961386203766,
              b: 0.14901961386203766
            }
          },
          wearables: [
            'dcl://base-avatars/roller_outfit',
            'dcl://base-avatars/f_short_colored_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/hair_stylish_hair',
            'dcl://base-avatars/pink_gem_earring',
            'dcl://base-avatars/f_eyebrows_04'
          ],
          snapshots: {
            face: 'QmUCRrQAA3PCSNd1VFwkA4erQSQCJKXh1EEB63qcjnBsaS',
            body: 'https://peer.decentraland.org/content/contents/QmUQVcWebqmPSDxsHnKZ6BTPpjQJEjcnxes7gviUHX6Yab',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default32: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_pink_simple_tshirt',
            'dcl://base-avatars/f_diamond_leggings',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/Thunder_earring',
            'dcl://base-avatars/f_mouth_07'
          ],
          snapshots: {
            face: 'QmSD44MdnBWo8Ube2mFfmdSjSGtXRESZ9eJQA3fMbbCmGf',
            body: 'https://peer.decentraland.org/content/contents/QmWq3fyA5ZzyJG1QepK4gVdoqKR5ttRvbJmU5ZzKcXF3JS',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default33: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sweater',
            'dcl://base-avatars/f_jeans',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/f_eyes_00',
            'dcl://base-avatars/f_eyebrows_00',
            'dcl://base-avatars/f_mouth_00'
          ],
          snapshots: {
            face: 'QmTQ42Jhztwm6QjdxyvQ16aP8QoCSP7NQVkWUEpesgVMLT',
            body: 'https://peer.decentraland.org/content/contents/Qmayo9soJkiqSSUBVdE6EY14osgQLMRbsrGaCCq9CNV7Te',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default34: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sport_purple_tshirt',
            'dcl://base-avatars/f_roller_leggings',
            'dcl://base-avatars/sport_black_shoes',
            'dcl://base-avatars/hair_coolshortstyle',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'Qma5dU5BivsUNJJmkfM7Tyhe1sti24erUZXMFjSPCVFPp8',
            body: 'https://peer.decentraland.org/content/contents/QmXTF6BEKL6nsdegDjjZHqAbRjyvwLCYQwshEFGYhx7vFu',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default35: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_striped_shirt',
            'dcl://base-avatars/elegant_blue_trousers',
            'dcl://base-avatars/f_m_sandals',
            'dcl://base-avatars/modern_hair',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'Qmdbd4Yg2wSshtepw5371x9EsB4DNkNGF8vMx2tVe31Wku',
            body: 'https://peer.decentraland.org/content/contents/QmUmJQHjNUurKqsJYBEtFykdhQun14h1BgEGUhRhjG31i6',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default36: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/colored_sweater',
            'dcl://base-avatars/f_brown_trousers',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/two_tails',
            'dcl://base-avatars/square_earring',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'Qmd5B8aRyZmiRSMEn25ZXj3Dq8ReHA6Gwo7iakfhA4WUii',
            body: 'https://peer.decentraland.org/content/contents/QmNgGJnC2YjA3gq6B7ah5TLkrLMTZTGgK8sGWaTQs1pRd1',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default37: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_blue_jacket',
            'dcl://base-avatars/f_capris',
            'dcl://base-avatars/ruby_blue_loafer',
            'dcl://base-avatars/pony_tail',
            'dcl://base-avatars/pearls_earring',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmfX2rpwQztV3xVeBm3xHdkW9vJVVoijirtcDRNuvBnFAm',
            body: 'https://peer.decentraland.org/content/contents/QmS6PM9US1nr8ptA7ev11oMxR4d29qBqmVpuQKttSR5fLG',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default38: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/f_white_shirt',
            'dcl://base-avatars/distressed_black_Jeans',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/hair_punk',
            'dcl://base-avatars/punk_piercing',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmZ9f22bSf89jYKNTtKnQucUAr5svMcWTmFemgpPZ7vZkk',
            body: 'https://peer.decentraland.org/content/contents/QmPXkZR2mq3UFzib85eesKzLfEcPhS6JapGd48CPmabukC',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default39: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_pride_t_shirt',
            'dcl://base-avatars/f_red_comfy_pants',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/f_glasses_fashion',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmabMEHPTaor5KqyJ92SBQA8YzzB2s2kXCFp9QoXd7mWMu',
            body: 'https://peer.decentraland.org/content/contents/QmZ61EySbzy2kvgFyFeoxdnQy6AdRxa9yi7mEwJsHRcZWC',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default40: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/light_green_shirt',
            'dcl://base-avatars/f_red_modern_pants',
            'dcl://base-avatars/pink_blue_socks',
            'dcl://base-avatars/double_bun',
            'dcl://base-avatars/thunder_02_earring',
            'dcl://base-avatars/f_eyes_06'
          ],
          snapshots: {
            face: 'QmQr2PiRJEgPsM9FWLt37RbXBBou4v3uprmX7J2wm7Z2vs',
            body: 'https://peer.decentraland.org/content/contents/QmTMeTRfyg9faN6hp1w3FRBrqat684WfJjbKnX8amhqyRS',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default41: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_simple_yellow_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/pink_sleepers',
            'dcl://base-avatars/cornrows',
            'dcl://base-avatars/green_stone_tiara',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'QmXXEgWvE2oH9BhGZi3GxeHq9Y367BM62xy2e5BdrGgEpi',
            body: 'https://peer.decentraland.org/content/contents/QmXxjBjYSG4NNHLYdgktioVGfmxcnPQ3X52YmTKSB6rqas',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default42: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_elegant_jacket',
            'dcl://base-avatars/f_country_pants',
            'dcl://base-avatars/ruby_red_loafer',
            'dcl://base-avatars/curly_hair',
            'dcl://base-avatars/black_sun_glasses',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmcMN22FhwxMFsiQeqpYNn9w1Hkgq1AVhc6u1V1ENaxd4X',
            body: 'https://peer.decentraland.org/content/contents/Qmcpybq1QqpN6jz3ZjdoQxAy3NXyTBdCupuKTHm3xxFroy',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default43: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.9137254953384399,
              g: 0.5098039507865906,
              b: 0.20392157137393951
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/simple_blue_tshirt',
            'dcl://base-avatars/f_african_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/00_EmptyEarring',
            'dcl://base-avatars/f_mouth_07'
          ],
          snapshots: {
            face: 'QmaUD5Ke4zhHE4rjZfPabGNXU27MUvEe63ZrF3XN3D9Lqp',
            body: 'https://peer.decentraland.org/content/contents/QmZQz5mwi21qv1XtaYHJrDjjM2A8SGAkZ8b4S9RqLSS5uQ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default44: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/baggy_pullover',
            'dcl://base-avatars/f_stripe_white_pants',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/hair_undere',
            'dcl://base-avatars/green_feather_earring',
            'dcl://base-avatars/f_eyes_10'
          ],
          snapshots: {
            face: 'QmW6zc8oguAifU9XpEpuj6oN7SCmaJ4Dupk7KJWvJe8rvs',
            body: 'https://peer.decentraland.org/content/contents/QmS9rsZB6y9iYQdemUi8FBemTdigtZ3dkozAXgkZuKfitM',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default45: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_simple_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/pompous',
            'dcl://base-avatars/retro_sunglasses',
            'dcl://base-avatars/f_eyebrows_05'
          ],
          snapshots: {
            face: 'QmUeofgAXsTuwX96KvB4ihdcJm5B3FMyNghDjqG1ycDeSS',
            body: 'https://peer.decentraland.org/content/contents/Qmcx8j1bcvPT5mfb5ztQRYcFCqrSgNS3Tsr8VsrJE3owDA',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default46: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2823529541492462,
              g: 0.8627451062202454,
              b: 0.4588235318660736
            }
          },
          wearables: [
            'dcl://base-avatars/school_shirt',
            'dcl://base-avatars/f_school_skirt',
            'dcl://base-avatars/Moccasin',
            'dcl://base-avatars/hair_anime_01',
            'dcl://base-avatars/f_eyes_08',
            'dcl://base-avatars/blue_star_earring'
          ],
          snapshots: {
            face: 'QmcqYTHKGfqRV71gu6mU5qqqGydyQSCqMmDVEvQMoVy3LJ',
            body: 'https://peer.decentraland.org/content/contents/QmaTwomjFBd8zSUm8moypLcvbiFBJRCeKGxpD3TYppCQ53',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default47: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.21176470816135406,
              g: 0.14901961386203766,
              b: 0.14901961386203766
            }
          },
          wearables: [
            'dcl://base-avatars/roller_outfit',
            'dcl://base-avatars/f_short_colored_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/hair_stylish_hair',
            'dcl://base-avatars/pink_gem_earring',
            'dcl://base-avatars/f_eyebrows_04'
          ],
          snapshots: {
            face: 'QmWTGR58MuSvSc4U9baqvs4EchuaidQUHeubySnCzKaDHS',
            body: 'https://peer.decentraland.org/content/contents/QmUHxSLSVaP3jAYRE6wABvXsj9mWkAzi5K53LdWwCj8d88',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default48: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_pink_simple_tshirt',
            'dcl://base-avatars/f_diamond_leggings',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/Thunder_earring',
            'dcl://base-avatars/f_mouth_07'
          ],
          snapshots: {
            face: 'QmaE7xb8G9whh62QqZAFCLDq6rWCeverDkjcZ7McqntUnt',
            body: 'https://peer.decentraland.org/content/contents/QmYonxWUEaNZWVVNnykQsDfj5uuwokWVpBj6AtoEPYiU69',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default49: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sweater',
            'dcl://base-avatars/f_jeans',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/f_eyes_00',
            'dcl://base-avatars/f_eyebrows_00',
            'dcl://base-avatars/f_mouth_00'
          ],
          snapshots: {
            face: 'QmVfUr7oNyERYREMD2YBD44NFCvQ6eWZfmwNofPggVCNsL',
            body: 'https://peer.decentraland.org/content/contents/QmRy1ngviWh2fPRvwoH6LhukSVALQYPPRq2MfUsCjhJgYW',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default50: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sport_purple_tshirt',
            'dcl://base-avatars/f_roller_leggings',
            'dcl://base-avatars/sport_black_shoes',
            'dcl://base-avatars/hair_coolshortstyle',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'QmdmkTpbJCrAnjMxjfnHSUfkvGnGV8c1scGrMUPM6bzsK2',
            body: 'https://peer.decentraland.org/content/contents/QmbdtcFvbeEJBb9usDyV44JCXkHtEVPkgXxQAzyZgDDEyf',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default51: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_striped_shirt',
            'dcl://base-avatars/elegant_blue_trousers',
            'dcl://base-avatars/f_m_sandals',
            'dcl://base-avatars/modern_hair',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'QmWVRfqPSPchEZE1KogecDbAKNyZAhLFwTCPWx15URFNCE',
            body: 'https://peer.decentraland.org/content/contents/QmcFXYJC4mcpBx3y864eJBxUTKsfzkobc9JAs3ypAqoi7E',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default52: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/colored_sweater',
            'dcl://base-avatars/f_brown_trousers',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/two_tails',
            'dcl://base-avatars/square_earring',
            'dcl://base-avatars/f_mouth_08'
          ],
          snapshots: {
            face: 'QmXVQ9EdCtpPVme3dNxRiygVcgZts6k1nyBiKfdSxj3Ewv',
            body: 'https://peer.decentraland.org/content/contents/QmNSxCVyDpNfUmTeoDP2M2EVgNSiU32c8kAUuevQHraFUv',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default53: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_blue_jacket',
            'dcl://base-avatars/f_capris',
            'dcl://base-avatars/ruby_blue_loafer',
            'dcl://base-avatars/pony_tail',
            'dcl://base-avatars/pearls_earring',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmdQWuwEaKBC5wWnBmxAM3WYqS76qok2MDNzM8kq6rRhV5',
            body: 'https://peer.decentraland.org/content/contents/QmX4A53xvxYW1cZeqGrRWyBqng7rpxJhovrj25jsqHyaAC',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default54: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/f_white_shirt',
            'dcl://base-avatars/distressed_black_Jeans',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/hair_punk',
            'dcl://base-avatars/punk_piercing',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmQ4FyBfMcKomBEijeXoqj1ftgSeDz2wzuMX6Mkdq9Wqbh',
            body: 'https://peer.decentraland.org/content/contents/QmaaMWxT2zHaU3qwRrQRW7guKexcjt8ccXMYR5fsFDkrpZ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default55: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_pride_t_shirt',
            'dcl://base-avatars/f_red_comfy_pants',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/f_glasses_fashion',
            'dcl://base-avatars/f_mouth_05'
          ],
          snapshots: {
            face: 'QmRKrr4h24Wx9MSzSfydYE6nQtRGEFc7bZ9JKcdcU8hu59',
            body: 'https://peer.decentraland.org/content/contents/Qmev3wzMh4tNrDHH5UqXPMGyRW6oG8JCbJWVDoPUxAzqWd',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default56: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/light_green_shirt',
            'dcl://base-avatars/f_red_modern_pants',
            'dcl://base-avatars/pink_blue_socks',
            'dcl://base-avatars/double_bun',
            'dcl://base-avatars/thunder_02_earring',
            'dcl://base-avatars/f_eyes_06'
          ],
          snapshots: {
            face: 'QmSqZ2npVD4RLdqe17FzGCFcN29RfvmqmEd2FcQUctxaKk',
            body: 'https://peer.decentraland.org/content/contents/QmSav1o6QK37Jj1yhbmhYk9MJc6c2H5DWbWzPVsg9JLYfF',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default57: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_simple_yellow_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/pink_sleepers',
            'dcl://base-avatars/cornrows',
            'dcl://base-avatars/green_stone_tiara',
            'dcl://base-avatars/f_mouth_04'
          ],
          snapshots: {
            face: 'QmcWWdxpfGesCEQrDrdPZsyEHh2H4pLDeiyzpxwMLFD88C',
            body: 'https://peer.decentraland.org/content/contents/QmVRmsN11oHhjk6XiKkdT14kajHJQi31zaHxrFgtX8ksDT',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default58: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_elegant_jacket',
            'dcl://base-avatars/f_country_pants',
            'dcl://base-avatars/ruby_red_loafer',
            'dcl://base-avatars/curly_hair',
            'dcl://base-avatars/black_sun_glasses',
            'dcl://base-avatars/f_eyebrows_02'
          ],
          snapshots: {
            face: 'QmeKdHJQfs251VqcM4G1oKWHhHJisqictMKNhk2N3pJKq4',
            body: 'https://peer.decentraland.org/content/contents/Qmdr77dyTt5LsqbvxxAVxot8Yd4UBMfd2P8Ze4q757wfyt',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default59: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.9137254953384399,
              g: 0.5098039507865906,
              b: 0.20392157137393951
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/simple_blue_tshirt',
            'dcl://base-avatars/f_african_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/00_EmptyEarring',
            'dcl://base-avatars/f_mouth_07'
          ],
          snapshots: {
            face: 'Qmd6BjEp1c5F51i8CTyaFF93Fb2qjKnFRBQpRWg7r5eMf4',
            body: 'https://peer.decentraland.org/content/contents/QmPyKPnH31tsGuh2UkhcU4f9UHJ3HqeZK2oRACDUWFRo1o',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default60: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/baggy_pullover',
            'dcl://base-avatars/f_stripe_white_pants',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/hair_undere',
            'dcl://base-avatars/green_feather_earring',
            'dcl://base-avatars/f_eyes_10'
          ],
          snapshots: {
            face: 'QmTL6U5GZ3Jte213cgMRVvCijJkRcLzZG3uHT3wb8L5NE7',
            body: 'https://peer.decentraland.org/content/contents/QmT7D9iqowFphxkqnKPbiycs9PcTEwVMmDDm5EHhkjyX6w',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default61: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_simple_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/pompous',
            'dcl://base-avatars/retro_sunglasses',
            'dcl://base-avatars/f_eyebrows_05'
          ],

          snapshots: {
            face: 'QmaFri6xkZ6fjC3c39ZZrjtCMSLSeW8y453RY7T1eZmJbT',
            body: 'https://peer.decentraland.org/content/contents/QmYUgXm378MKxKzrvvQyJQyB89sx1EBxhZ9qsLimbrAY2B',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default62: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2823529541492462,
              g: 0.8627451062202454,
              b: 0.4588235318660736
            }
          },
          wearables: [
            'dcl://base-avatars/school_shirt',
            'dcl://base-avatars/f_school_skirt',
            'dcl://base-avatars/Moccasin',
            'dcl://base-avatars/hair_anime_01',
            'dcl://base-avatars/f_eyes_08',
            'dcl://base-avatars/blue_star_earring'
          ],

          snapshots: {
            face: 'QmR7xicJxa4Aoqr7AjbD2TzKKsnwVLYoWS4MgfM6SWNGWX',
            body: 'https://peer.decentraland.org/content/contents/QmNrL2JvcxmnGCHw859TBK8yChxqvhm9oiX3nELJJaHLNV',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default63: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.21176470816135406,
              g: 0.14901961386203766,
              b: 0.14901961386203766
            }
          },
          wearables: [
            'dcl://base-avatars/roller_outfit',
            'dcl://base-avatars/f_short_colored_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/hair_stylish_hair',
            'dcl://base-avatars/pink_gem_earring',
            'dcl://base-avatars/f_eyebrows_04'
          ],

          snapshots: {
            face: 'QmdKsjsV7Pg9Rs1mPkrMAi4WuKP37giZW8cqWzWKUuWVPX',
            body: 'https://peer.decentraland.org/content/contents/QmPzc82kHemjS7kCuJtS5c4yn9841M8HfNUqcoehzFPFWv',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default64: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_pink_simple_tshirt',
            'dcl://base-avatars/f_diamond_leggings',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/Thunder_earring',
            'dcl://base-avatars/f_mouth_07'
          ],

          snapshots: {
            face: 'QmZA8dGk6Ln79iNc8A9EKE8WpGp3ruU6B6hieakVVoZVXi',
            body: 'https://peer.decentraland.org/content/contents/QmZ4QGtbqgVbrKHg74y7wu2DLP98JowXLqXCqECRRqQBN2',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default65: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sweater',
            'dcl://base-avatars/f_jeans',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/f_eyes_00',
            'dcl://base-avatars/f_eyebrows_00',
            'dcl://base-avatars/f_mouth_00'
          ],

          snapshots: {
            face: 'QmdB7ZcChD8c39Tp9W46ErVK2AMUbXbUcHphfaK3737gdj',
            body: 'https://peer.decentraland.org/content/contents/QmUHsP2v1E9qxio1hxHwpB3SqTS24UG4gFmZAUdrMdxPpg',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default66: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/f_sport_purple_tshirt',
            'dcl://base-avatars/f_roller_leggings',
            'dcl://base-avatars/sport_black_shoes',
            'dcl://base-avatars/hair_coolshortstyle',
            'dcl://base-avatars/f_mouth_08'
          ],

          snapshots: {
            face: 'QmSPtw6HT9AERKkygF3sc6zumBdF3AxXvTEFk2PVJMdQcQ',
            body: 'https://peer.decentraland.org/content/contents/QmQMX6FVB3XeBYBXWTvo684rkVrkBSXECVpcrcMdtuoNkJ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default67: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_striped_shirt',
            'dcl://base-avatars/elegant_blue_trousers',
            'dcl://base-avatars/f_m_sandals',
            'dcl://base-avatars/modern_hair',
            'dcl://base-avatars/f_mouth_04'
          ],

          snapshots: {
            face: 'QmaAXX4YNg5aqsrxN1jtzCGDvUYjngp8kG3CeBSjzDmbyW',
            body: 'https://peer.decentraland.org/content/contents/QmZxWk6z9VEG466hL23sUqr9hKwmQsDASVGipWH61NxWe7',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default68: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/colored_sweater',
            'dcl://base-avatars/f_brown_trousers',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/two_tails',
            'dcl://base-avatars/square_earring',
            'dcl://base-avatars/f_mouth_08'
          ],

          snapshots: {
            face: 'QmU7FsryePgq4RXsrEYcRFhDuEMzeK5mJekxVtu7m7hy93',
            body: 'https://peer.decentraland.org/content/contents/QmfVT92sQnRHDtH7NeXtM72LMf5FWywvzuH1MAgeNdD1sH',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default69: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_blue_jacket',
            'dcl://base-avatars/f_capris',
            'dcl://base-avatars/ruby_blue_loafer',
            'dcl://base-avatars/pony_tail',
            'dcl://base-avatars/pearls_earring',
            'dcl://base-avatars/f_mouth_05'
          ],

          snapshots: {
            face: 'QmX272NSUsTxeiwxRZLaMpdmvfyoBivG61qNKEfz6f4qkR',
            body: 'https://peer.decentraland.org/content/contents/Qmd6LRVAicwqS67AuSKMBQy5k9CM4uUFcCeX7nNE5Z4cDF',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default70: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/f_white_shirt',
            'dcl://base-avatars/distressed_black_Jeans',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/hair_punk',
            'dcl://base-avatars/punk_piercing',
            'dcl://base-avatars/f_eyebrows_02'
          ],

          snapshots: {
            face: 'QmWn1RcGsdiUmt85mHMHtPSTTKKbFdofriy3KCBYJ9jsC9',
            body: 'https://peer.decentraland.org/content/contents/QmSm6zrCvCFxMCvx512i91aQgnwa7Z6PEx3ei6JADPAs7s',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default71: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_pride_t_shirt',
            'dcl://base-avatars/f_red_comfy_pants',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/f_glasses_fashion',
            'dcl://base-avatars/f_mouth_05'
          ],

          snapshots: {
            face: 'QmddmUTtef4GDkt4Lqp8ZfikvPiehBFa128vdM2NsBtUf2',
            body: 'https://peer.decentraland.org/content/contents/Qmcb3HZ9h4zL4cYZA6Q1tPdmeKHKqYG4DpuQ5BnEp9ndwv',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default72: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/light_green_shirt',
            'dcl://base-avatars/f_red_modern_pants',
            'dcl://base-avatars/pink_blue_socks',
            'dcl://base-avatars/double_bun',
            'dcl://base-avatars/thunder_02_earring',
            'dcl://base-avatars/f_eyes_06'
          ],

          snapshots: {
            face: 'QmYQuW4QKbGNZxTgAE1SBFhvqksTkVfnKj6jKJHox8i5vF',
            body: 'https://peer.decentraland.org/content/contents/QmSaxoB2GoJbQ4f5tHpMG48T8RcLBsdCJCeyrHP8K1scbQ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default73: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_simple_yellow_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/pink_sleepers',
            'dcl://base-avatars/cornrows',
            'dcl://base-avatars/green_stone_tiara',
            'dcl://base-avatars/f_mouth_04'
          ],

          snapshots: {
            face: 'QmXK2xuVDFJrUEcVz2cdxjtDt3D88dEUGrq2yqhWKpj6b7',
            body: 'https://peer.decentraland.org/content/contents/QmbgM8bhnSvVHma4VgD2Fu1hAS551FXQxNa1kSuwzcaBvF',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default74: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_elegant_jacket',
            'dcl://base-avatars/f_country_pants',
            'dcl://base-avatars/ruby_red_loafer',
            'dcl://base-avatars/curly_hair',
            'dcl://base-avatars/black_sun_glasses',
            'dcl://base-avatars/f_eyebrows_02'
          ],

          snapshots: {
            face: 'Qme3e1eQhyE6ZazvKBWHgAJXdUTbKusQ36LsJqCS4sdUAc',
            body: 'https://peer.decentraland.org/content/contents/QmQRXf7Dc17pHHHw7GBeoKzrU82921pGachErEqU2f5Gr4',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default75: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.9137254953384399,
              g: 0.5098039507865906,
              b: 0.20392157137393951
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/simple_blue_tshirt',
            'dcl://base-avatars/f_african_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/shoulder_hair',
            'dcl://base-avatars/00_EmptyEarring',
            'dcl://base-avatars/f_mouth_07'
          ],

          snapshots: {
            face: 'QmZCQ53udWNfLGGiBaGCSinTKBBmGa7hzp9r5EVL99Euij',
            body: 'https://peer.decentraland.org/content/contents/Qmb2D89h9USojjgcvV6RE33FNXBNExxxSNjXDPUG7AK44g',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default76: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/baggy_pullover',
            'dcl://base-avatars/f_stripe_white_pants',
            'dcl://base-avatars/bun_shoes',
            'dcl://base-avatars/hair_undere',
            'dcl://base-avatars/green_feather_earring',
            'dcl://base-avatars/f_eyes_10'
          ],

          snapshots: {
            face: 'QmNr8YEVZS9V1At9NcDSCu8G2ULqMGk3Kr4iFGSg5Usv11',
            body: 'https://peer.decentraland.org/content/contents/QmSKf8YBpZRcffYTD7q8HiqMWttQgu77jELG88Vxh3qzeB',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default77: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/f_red_simple_tshirt',
            'dcl://base-avatars/f_short_blue_jeans',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/pompous',
            'dcl://base-avatars/retro_sunglasses',
            'dcl://base-avatars/f_eyebrows_05'
          ],

          snapshots: {
            face: 'QmT5MiRnC5FwXVZT1H3BpFi5gESCQL7wy5RZZC8aUtE2xm',
            body: 'https://peer.decentraland.org/content/contents/QmaQner1L8Kde6SyvovMtKcYnffQxxXMEaduoNt2fJfJbL',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default78: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.2823529541492462,
              g: 0.8627451062202454,
              b: 0.4588235318660736
            }
          },
          wearables: [
            'dcl://base-avatars/school_shirt',
            'dcl://base-avatars/f_school_skirt',
            'dcl://base-avatars/Moccasin',
            'dcl://base-avatars/hair_anime_01',
            'dcl://base-avatars/f_eyes_08',
            'dcl://base-avatars/blue_star_earring'
          ],

          snapshots: {
            face: 'QmPiUsGWvYY1Cn5vdDpYYfBE4Nr1X8F9hPPoeh1rugyXok',
            body: 'https://peer.decentraland.org/content/contents/QmWUb54YR3pavyqktAag9nVBRudGPrpnsY1z8ftk45VMDP',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default79: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.21176470816135406,
              g: 0.14901961386203766,
              b: 0.14901961386203766
            }
          },
          wearables: [
            'dcl://base-avatars/roller_outfit',
            'dcl://base-avatars/f_short_colored_leggins',
            'dcl://base-avatars/sport_colored_shoes',
            'dcl://base-avatars/hair_stylish_hair',
            'dcl://base-avatars/pink_gem_earring',
            'dcl://base-avatars/f_eyebrows_04'
          ],

          snapshots: {
            face: 'QmYQWwJ3JxQPipXEtazLD1sXNxUGAqLZfzaaae6RHFaVAP',
            body: 'https://peer.decentraland.org/content/contents/QmXh1JygJZkagGjX297erc2u2CqXB6DBGZtggf52pDkajQ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default80: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/f_pink_simple_tshirt',
            'dcl://base-avatars/f_diamond_leggings',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/standard_hair',
            'dcl://base-avatars/Thunder_earring',
            'dcl://base-avatars/f_mouth_07'
          ],

          snapshots: {
            face: 'QmcEcs4XTamHQVfeiJSJr84jKsV7rkYpA1XsbNCFWM65Ns',
            body: 'https://peer.decentraland.org/content/contents/QmaJJU2dyirwWMjVpv587evG7hHkYmdYfffZgZQL3fQosD',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default81: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/green_hoodie',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/casual_hair_01',
            'dcl://base-avatars/beard'
          ],

          snapshots: {
            face: 'QmXKWWxn8VpgL6UcN7BXZo3qcx6dhJK2fM5zecfX1TETdq',
            body: 'https://peer.decentraland.org/content/contents/QmdFRT8A2uqQEJWB1vEoLEKJcpHpBxECHSDAApXTeC8wSD',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default82: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/yellow_tshirt',
            'dcl://base-avatars/soccer_pants',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/granpa_beard'
          ],

          snapshots: {
            face: 'Qmbh7dxjhjoNupRJH5ky2jzpjRjUTQe9DeK16KZ5DAheGN',
            body: 'https://peer.decentraland.org/content/contents/QmUFwc5ArzavLvvyecjhtPVFQHvJ89Bcmyc4gm5xd3mz4z',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default83: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/kilt',
            'dcl://base-avatars/m_mountainshoes.glb',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/full_beard'
          ],

          snapshots: {
            face: 'QmXvrZ6KkXo6TW7nFF4AFdSuEtSAHsDnoSKt27Px9VmjD6',
            body: 'https://peer.decentraland.org/content/contents/QmTVUnMwjna2wBmLQ5fCaNDHwLWBQo4W23s6LfYn8No2rD',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default84: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/sleeveless_punk_shirt',
            'dcl://base-avatars/trash_jean',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/punk',
            'dcl://base-avatars/horseshoe_beard',
            'dcl://base-avatars/Thunder_earring'
          ],

          snapshots: {
            face: 'QmSqQTccoxmQKzb5xpYkzb2P965X5GA2mEkZSEWfCSTsDn',
            body: 'https://peer.decentraland.org/content/contents/QmbaXz9JSJQWWf9sT74uUHf2zAbwMHnQhWNTAtvuyThiBL',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default85: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/striped_pijama',
            'dcl://base-avatars/pijama_pants',
            'dcl://base-avatars/bear_slippers',
            'dcl://base-avatars/semi_bold',
            'dcl://base-avatars/mouth_04',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmRHDY7mXPK88g3h5HJVQERbsfEkd5EBnbXhFMYb8rVreJ',
            body: 'https://peer.decentraland.org/content/contents/QmSDJ66cWBUEwLYmvn4c9w8M13JmGYSKxkgzPXuv3rQ8EA',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default86: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/red_square_shirt',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/slicked_hair',
            'dcl://base-avatars/eyes_08',
            'dcl://base-avatars/punk_piercing'
          ],

          snapshots: {
            face: 'QmagJfW1Gdx3Z2Xw1Qg4NFsxErfbMNfZozaqc3xZyJy9KT',
            body: 'https://peer.decentraland.org/content/contents/QmP5HWNMg1LcFcaMLbjr1ubNRbCuA8ruqyCtzW4JtBy2KV',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default87: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/semi_afro',
            'dcl://base-avatars/mouth_05',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmQzJ9ue74p1s9jvse91v94UXeyEue4bjWKRYw1yBP9jw3',
            body: 'https://peer.decentraland.org/content/contents/QmVhAaL4CpcLz6JeURQWkKY5XpfTr755dBfRe3xmhDSiEQ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default88: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/green_square_shirt',
            'dcl://base-avatars/oxford_pants',
            'dcl://base-avatars/sport_blue_shoes',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/mouth_03',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmZzdUKTuv7hCdEgfoxdxdguVAPWJ41MMJp4Zc2WH7J7Rg',
            body: 'https://peer.decentraland.org/content/contents/QmYVsuYptFNmLZKuRXZqEKTis77hGCqZ7JnwgVALHjrsSg',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default89: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/red_tshirt',
            'dcl://base-avatars/striped_swim_suit',
            'dcl://base-avatars/m_greenflipflops',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/handlebar',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'Qmapa3vn9WzeJ3fq2YTNdJA4d9MqE1xGeDcrzAGtvDcBdR',
            body: 'https://peer.decentraland.org/content/contents/QmbUTf78Z44ND4hjvWCMuR47mC7wjX2HdEHQuem5DoyqvH',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default90: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/pride_tshirt',
            'dcl://base-avatars/basketball_shorts',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/french_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmQi1xWEywZBzW8tDEeuun8WjjofvhZ73CV7hcSb3RSaWn',
            body: 'https://peer.decentraland.org/content/contents/QmPYsXYTuy8iywxhu4hrGJUgKbsXK7cV9pgwXZREYCo5K1',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default91: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/puffer_jacket_hoodie',
            'dcl://base-avatars/hip_hop_joggers',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/tall_front_01',
            'dcl://base-avatars/eyes_11',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmYFSHyMW1ezYvENaaUSCJCPMFZp33ZsHrt9h7UALjHgjQ',
            body: 'https://peer.decentraland.org/content/contents/QmWbAxywFYwDCut3d8As3s6jVBsUCrm4my2PLDtEH8Be1n',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default92: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater_02',
            'dcl://base-avatars/comfortablepants',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/00_bald',
            'dcl://base-avatars/beard',
            'dcl://base-avatars/blue_bandana'
          ],

          snapshots: {
            face: 'QmbakR9jntQwfx3eAnBq2b5v9rxWAEe2WyVjktVxCjnuTK',
            body: 'https://peer.decentraland.org/content/contents/QmPjAWfnv5N5Yj99A2gtmSkn18qfDx8wQZWPhs9ktBVFrR',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default93: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater',
            'dcl://base-avatars/swim_short',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/cool_hair',
            'dcl://base-avatars/old_mustache_beard',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmX24j5zgSnZTr6KHB6pgoyTsyQhgaXUHw1F2jBqRLCQ6D',
            body: 'https://peer.decentraland.org/content/contents/QmeSQUP5JGuajuB8nnrW4KbnXMJeAP4XB1W8Lrxb7da66S',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default94: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/soccer_shirt',
            'dcl://base-avatars/jean_shorts',
            'dcl://base-avatars/m_feet_soccershoes',
            'dcl://base-avatars/rasta',
            'dcl://base-avatars/short_boxed_beard',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmTeBxxSiw3htpgGtAEem2va2nQJf5mGMdeibC1DHbrT2Q',
            body: 'https://peer.decentraland.org/content/contents/QmPWGP6Mxxq7YADxHRzmWvoWzWH3q1SxJuyEUp2nVcwrLC',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default95: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/moptop',
            'dcl://base-avatars/lincoln_beard',
            'dcl://base-avatars/matrix_sunglasses'
          ],

          snapshots: {
            face: 'Qmd1ghTaRx3D7EHSmjWfAapzKw5HHD6ujASGyTxmVc1d67',
            body: 'https://peer.decentraland.org/content/contents/QmbEpc5y8V44FsNVgeZLkahKAKBtPA1xA8ZrBA8SSQvd4r',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default96: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.4901960790157318,
              g: 0.364705890417099,
              b: 0.27843138575553894
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/striped_shirt_01',
            'dcl://base-avatars/cargo_shorts',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/chin_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmeqHNjVnwYL8drc9HARcvArMSv8WHWCgkipu1drqC5nZn',
            body: 'https://peer.decentraland.org/content/contents/Qmd5f9UT4boYj6HWReEG9D7Bwt9YAyxKjRJ1mWkSg6CVbB',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default97: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/green_hoodie',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/casual_hair_01',
            'dcl://base-avatars/beard'
          ],

          snapshots: {
            face: 'QmPGErFMTjgjEmyuR9TPeifuaQSLiTSSkdaCkCMwUvcMX2',
            body: 'https://peer.decentraland.org/content/contents/QmWds85TdWnjCRjyZ9gKbWPJqhVccauhWQQQEmaAmHpBwT',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default98: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/yellow_tshirt',
            'dcl://base-avatars/soccer_pants',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/granpa_beard'
          ],

          snapshots: {
            face: 'QmSTAzcyrvWCujvsXh7TfE5h94psehYdbjjW6tJU7RcyeC',
            body: 'https://peer.decentraland.org/content/contents/QmSfF5hs3rbm99ubPmhC85xkTYeKS8ERrkehsmPSD4YgYV',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default99: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/kilt',
            'dcl://base-avatars/m_mountainshoes.glb',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/full_beard'
          ],

          snapshots: {
            face: 'QmYk9zrgXyyRP2WGwoC3Lgc6tVu51xdGwSwei9NK7tGeAE',
            body: 'https://peer.decentraland.org/content/contents/QmRPRk1TjyVhzA6WNqu9G5QvsBRULgV1aXrzkUJ5WzWmUg',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default100: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/sleeveless_punk_shirt',
            'dcl://base-avatars/trash_jean',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/punk',
            'dcl://base-avatars/horseshoe_beard',
            'dcl://base-avatars/Thunder_earring'
          ],

          snapshots: {
            face: 'QmQcu5tkpvAWA5h3xEvtTLzGNokb7rwTtF1gN6eQpZFjf4',
            body: 'https://peer.decentraland.org/content/contents/Qmf4d6juXuNrLMNvBmrTfRiNjvhbGgKcy7UTc1aExapwve',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default101: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/striped_pijama',
            'dcl://base-avatars/pijama_pants',
            'dcl://base-avatars/bear_slippers',
            'dcl://base-avatars/semi_bold',
            'dcl://base-avatars/mouth_04',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmY4LYCtU8baz7s48RQerBQ9YpEAsxBMpi3J8DB2bDRf6z',
            body: 'https://peer.decentraland.org/content/contents/QmRxSsnXu73BrMh23vKrZ4NFouucMgmbH434chd6gz23bj',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default102: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/red_square_shirt',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/slicked_hair',
            'dcl://base-avatars/eyes_08',
            'dcl://base-avatars/punk_piercing'
          ],

          snapshots: {
            face: 'QmZsq73GapurYQA3QskiqYPRj1PSbbUUtWMVYD9hWhboW1',
            body: 'https://peer.decentraland.org/content/contents/QmSb66wpB8zGQHvmbQNEufFGPHFWBsZhU8Eg8SCf2KUX1s',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default103: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/semi_afro',
            'dcl://base-avatars/mouth_05',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmWn4GQZeHBqEo8ap8XPGmBo7pggkE3sSjAMSJKngNn2py',
            body: 'https://peer.decentraland.org/content/contents/Qmc2knC12f3R1RktGJPA3ehhRhh23nCBZFrWmyKNdEAMHw',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default104: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/green_square_shirt',
            'dcl://base-avatars/oxford_pants',
            'dcl://base-avatars/sport_blue_shoes',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/mouth_03',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmbtxVmY2fjJaTkUi2kbQbKPv8XajtpkCDzCBzxJ3UFQHR',
            body: 'https://peer.decentraland.org/content/contents/QmajvasF2zPj1LkLUucEzwzDJrukDv1hEuiLji1V1fB5gW',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default105: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/red_tshirt',
            'dcl://base-avatars/striped_swim_suit',
            'dcl://base-avatars/m_greenflipflops',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/handlebar',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmcWFr8sBFUEkcTZ9yGxLchgQ95NC4bXB3jTM2E2mfEmfp',
            body: 'https://peer.decentraland.org/content/contents/QmQr28Lt3PAsawxuKHbPgryJzZpaMD8VnRUHJ5HBQyJqKG',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default106: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/pride_tshirt',
            'dcl://base-avatars/basketball_shorts',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/french_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmSAVx5tt92DRuS2nCG8B9jAiD7ZhsjBFLbxDYMvzLUYrg',
            body: 'https://peer.decentraland.org/content/contents/Qmc5k9CbDw17pTVsSSyzCLmyqqwQDuHJGzXcJa3bmV6xon',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default107: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/puffer_jacket_hoodie',
            'dcl://base-avatars/hip_hop_joggers',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/tall_front_01',
            'dcl://base-avatars/eyes_11',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmYBjecBZ43Uyq7Koz2e9pYMwBdiqzsAQin1S2tfrz427K',
            body: 'https://peer.decentraland.org/content/contents/QmX8CK7NYPwpwVNJfpX4GgWfbHwRpxqqh3aNTSSoH1Prmj',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default108: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater_02',
            'dcl://base-avatars/comfortablepants',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/00_bald',
            'dcl://base-avatars/beard',
            'dcl://base-avatars/blue_bandana'
          ],

          snapshots: {
            face: 'QmeTm34yas5tzwMue5tb76uUUMP92pRudy2E7VzVUewF1V',
            body: 'https://peer.decentraland.org/content/contents/QmWZy6Z5QoMVTQPc2Qsss3pm7yFmbmjrxfKizWaJztMoMw',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default109: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater',
            'dcl://base-avatars/swim_short',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/cool_hair',
            'dcl://base-avatars/old_mustache_beard',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmbpvkMUBD14R7e57C4LRoY3Gbxv3g773zgYCtkurs2X7q',
            body: 'https://peer.decentraland.org/content/contents/QmUi9VCwioFxS6ZHJVY7zrbpN6HwvQRJMHhjGaKUi9YPtr',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default110: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/soccer_shirt',
            'dcl://base-avatars/jean_shorts',
            'dcl://base-avatars/m_feet_soccershoes',
            'dcl://base-avatars/rasta',
            'dcl://base-avatars/short_boxed_beard',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmSUJtKFpoFtCQ4ssJtbwBE8edjHJTzDAKY3ew7ZRKBuTG',
            body: 'https://peer.decentraland.org/content/contents/QmUS7g25QwJgo3ehhaFs7JQ8qPrs1AN9U7rRLXPbUbiPZ2',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default111: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/moptop',
            'dcl://base-avatars/lincoln_beard',
            'dcl://base-avatars/matrix_sunglasses'
          ],

          snapshots: {
            face: 'QmcecVUdNrgDSb1KMYw1DQDT7XXmdZLccrHg3mp5EGPvYo',
            body: 'https://peer.decentraland.org/content/contents/QmRx45CT7FfQA6hrBfHqBxqZfbBZQW7RUPFcpEbS49JvHf',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default112: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.32156863808631897,
              g: 0.1725490242242813,
              b: 0.10980392247438431
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/striped_shirt_01',
            'dcl://base-avatars/cargo_shorts',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/chin_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmUNiFsUY1SQdfHsfoDEMv9oPwt3ZuJK9QyYX5pfom2Qy9',
            body: 'https://peer.decentraland.org/content/contents/QmW9nVwzENaPRd7RcB6eMUXb79wUCeRtsNqwM37n7dGx1t',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default113: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/green_hoodie',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/casual_hair_01',
            'dcl://base-avatars/beard'
          ],

          snapshots: {
            face: 'QmeLTsRbiPpgW5ir1q1Ny3dG5znDGRSvWZCBuMgkxV7us9',
            body: 'https://peer.decentraland.org/content/contents/QmdsXBCTMvVGK5vtqyaHmukKJbcxNzDrne3gP9dHJpBJXa',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default114: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/yellow_tshirt',
            'dcl://base-avatars/soccer_pants',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/granpa_beard'
          ],

          snapshots: {
            face: 'QmYG7AxpwRy7E1TYyuefgTxZgJQRwp4MUtysMkrpYtBHg6',
            body: 'https://peer.decentraland.org/content/contents/QmbNDQtyiwTfURV283HryFhZYuTmUUMEVk6s4AwA6EN8Ls',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default115: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/kilt',
            'dcl://base-avatars/m_mountainshoes.glb',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/full_beard'
          ],

          snapshots: {
            face: 'QmWSYRBMDyfkzz5BV5VonT9Q6k73igtyd3oQ4xLjULYBED',
            body: 'https://peer.decentraland.org/content/contents/QmThynF2qwTtU2QbGsDTbxtJ5gDaTsPBCstSriRpnjq2ag',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default116: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/sleeveless_punk_shirt',
            'dcl://base-avatars/trash_jean',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/punk',
            'dcl://base-avatars/horseshoe_beard',
            'dcl://base-avatars/Thunder_earring'
          ],

          snapshots: {
            face: 'QmSfZ7mCyd5NUx7FnmRJ4FbyMkKvXXmDAe1YDT2KbenTnV',
            body: 'https://peer.decentraland.org/content/contents/Qmf3Md7ZYmLmkV8vVDcCGUd6FGjqtbJaFcdQtPjx3Q9Zzr',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default117: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/striped_pijama',
            'dcl://base-avatars/pijama_pants',
            'dcl://base-avatars/bear_slippers',
            'dcl://base-avatars/semi_bold',
            'dcl://base-avatars/mouth_04',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmbWGC8opmy929FAVQaMmxoFJcn8zwW3FnnF8zZEy33kB2',
            body: 'https://peer.decentraland.org/content/contents/QmeqKGvSXdivp5UMcxcEad13D91XET3D8ktmzN12bfYuMm',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default118: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/red_square_shirt',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/slicked_hair',
            'dcl://base-avatars/eyes_08',
            'dcl://base-avatars/punk_piercing'
          ],

          snapshots: {
            face: 'QmfGBvQ5Kvm8hZHhZp4HvciJHzvBMTDieLUVU7DHGMjPEX',
            body: 'https://peer.decentraland.org/content/contents/Qma4TXvQzFGiit4FZmB9Uwq4ToNANiyzR7sMd5qbDRQMmK',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default119: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/semi_afro',
            'dcl://base-avatars/mouth_05',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmZprjmZMPo3ttgre8srBRvpNQYm99LAagqYBvVQdjisMT',
            body: 'https://peer.decentraland.org/content/contents/QmT9hZzLzsd6jrceA433m6Y2AzBJyt752dtCwTUG4TetFM',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default120: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/green_square_shirt',
            'dcl://base-avatars/oxford_pants',
            'dcl://base-avatars/sport_blue_shoes',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/mouth_03',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmTi3CEfftfgvJ9Dd6sdUAEyosB4ew5JYsnkxYn1HNq3WL',
            body: 'https://peer.decentraland.org/content/contents/QmVMDmUThSvNzD2wwbhxKBwZx9QwrTqPKj5e1P2cXhz5Mc',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default121: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/red_tshirt',
            'dcl://base-avatars/striped_swim_suit',
            'dcl://base-avatars/m_greenflipflops',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/handlebar',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmWQSLQbcdpqHNhNqax89NuqxumuaLhHoUtCdSphrLsH8X',
            body: 'https://peer.decentraland.org/content/contents/QmbEAbZ3bDVV5uaPHiv2Ch71cL4hdQY74FSrQZKhFqEmmU',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default122: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/pride_tshirt',
            'dcl://base-avatars/basketball_shorts',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/french_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'Qma5o14fX1WxhEGFKheiLoL1XCWtZsnkumJhCTJWR5aTGr',
            body: 'https://peer.decentraland.org/content/contents/QmNcqY1DpqLuVSsApCrnGJymLZrvi7b3BULAPg1eF5Vkwn',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default123: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/puffer_jacket_hoodie',
            'dcl://base-avatars/hip_hop_joggers',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/tall_front_01',
            'dcl://base-avatars/eyes_11',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmUhicTkZ4bxq1znXEBNwVsAt9FhYGw52WACJpHzQUSDZP',
            body: 'https://peer.decentraland.org/content/contents/QmSAFbcpzsDXX8ZpwVQiPm7Yhhi7Vbtsd1rkt6qGrsb1ks',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default124: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater_02',
            'dcl://base-avatars/comfortablepants',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/00_bald',
            'dcl://base-avatars/beard',
            'dcl://base-avatars/blue_bandana'
          ],

          snapshots: {
            face: 'QmXinN41RnghnSDXufLGRKh6K4W52cjgSw5xbmzUMTAZCe',
            body: 'https://peer.decentraland.org/content/contents/QmbktbhRpo9Ch9HHELpUmnQujmNsHKyWky9E8s7aWPoSN7',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default125: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater',
            'dcl://base-avatars/swim_short',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/cool_hair',
            'dcl://base-avatars/old_mustache_beard',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmV4eYRh61LUyuLQm1DNUKcb5pU2qwPbDEvTr9bR7rvMiG',
            body: 'https://peer.decentraland.org/content/contents/QmTTL7v4XrsVJyhmjLhipgPCTARbcei8pLsUmZzVDvKBL9',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default126: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/soccer_shirt',
            'dcl://base-avatars/jean_shorts',
            'dcl://base-avatars/m_feet_soccershoes',
            'dcl://base-avatars/rasta',
            'dcl://base-avatars/short_boxed_beard',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmVjDr5jKEsEWkfJgdPZRPc9FfivYDzNpZmU9s1NJE5XR9',
            body: 'https://peer.decentraland.org/content/contents/QmTcu5uyGZg5JTVoSBraKgSfb2PeBkb5uEifWUC9rLX5wh',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default127: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/moptop',
            'dcl://base-avatars/lincoln_beard',
            'dcl://base-avatars/matrix_sunglasses'
          ],

          snapshots: {
            face: 'QmaedSCHNVopAC9LHVjMMCj9ajT6TVtfAFdy3UeSGQaV2m',
            body: 'https://peer.decentraland.org/content/contents/QmemHCCV5Z7qnc8AijkPb7f1yqN7v6i6aePR2jBvCd7Bvt',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default128: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.800000011920929,
              g: 0.6078431606292725,
              b: 0.46666666865348816
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/striped_shirt_01',
            'dcl://base-avatars/cargo_shorts',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/chin_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmctLSTHwh3ay7fgSw73xw9VAahiiVR4225wPDyHfRixht',
            body: 'https://peer.decentraland.org/content/contents/QmRUUpLsBaUN7gyTEf1ASMGzUQHgH5Z8hQGxGPN1FLDq5M',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default129: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/green_hoodie',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/casual_hair_01',
            'dcl://base-avatars/beard'
          ],

          snapshots: {
            face: 'QmesGQn6x7vDHWTsjepzf4rehqm41dVJq38D7cQNBQCPaX',
            body: 'https://peer.decentraland.org/content/contents/QmNwwAUjppvvbvdUVeTMjVutkAgk89QtKZh3Xr4up6A7fe',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default130: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/yellow_tshirt',
            'dcl://base-avatars/soccer_pants',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/granpa_beard'
          ],

          snapshots: {
            face: 'QmYYTiE6Jita1bPnrZ7QyX84TsB3DhquCBjYc3L4KJ5fPH',
            body: 'https://peer.decentraland.org/content/contents/QmRUKT5MzBxYSwfvgzfE6aWFdx4hqPwvjqwdXR2xc4rP48',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default131: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/kilt',
            'dcl://base-avatars/m_mountainshoes.glb',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/full_beard'
          ],

          snapshots: {
            face: 'QmSSjraMoaoUERp87tZcMyad7RAZPZ5D9w5oRuMCqXVhxz',
            body: 'https://peer.decentraland.org/content/contents/Qmd1H6eQj7togcBxzBiE6QUPaVQBsx6zUX8XBYBRkZpry3',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default132: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/sleeveless_punk_shirt',
            'dcl://base-avatars/trash_jean',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/punk',
            'dcl://base-avatars/horseshoe_beard',
            'dcl://base-avatars/Thunder_earring'
          ],

          snapshots: {
            face: 'QmYHv6pT5w4RZjyFojprjkMrKgsLbU5HxTAeggTEKEwe4q',
            body: 'https://peer.decentraland.org/content/contents/QmR4ajrgsoHDGACen8M6PAi9mn4fhBQ6RwqmCyNi2GWJG7',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default133: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/striped_pijama',
            'dcl://base-avatars/pijama_pants',
            'dcl://base-avatars/bear_slippers',
            'dcl://base-avatars/semi_bold',
            'dcl://base-avatars/mouth_04',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmSmyuyKgE8RThvU9Yuv3YCk45rbnAZvefqkT2BRcEB51c',
            body: 'https://peer.decentraland.org/content/contents/QmTTG3hLM7nXuqYuLQ714yMFehzbfTYrbQRhzadBXr8Bao',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default134: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/red_square_shirt',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/slicked_hair',
            'dcl://base-avatars/eyes_08',
            'dcl://base-avatars/punk_piercing'
          ],

          snapshots: {
            face: 'QmPfTTj8CPWiYEEEV6Zo3Fh6PWimA8wCmNZbthXEZytMQ5',
            body: 'https://peer.decentraland.org/content/contents/QmWD4QkdNCT6uXVNPrCAAUJKbvo9iJoXFoTwopJc89jYaR',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default135: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/semi_afro',
            'dcl://base-avatars/mouth_05',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmXADVFHhHXMjGoP21zKmbJ6icwthSGVrHjqYzat7Kazm4',
            body: 'https://peer.decentraland.org/content/contents/QmeLYzkw1fi6ssgBNAtR3NEUo5fqrBmL3pYznUh7xVSsfJ',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default136: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/green_square_shirt',
            'dcl://base-avatars/oxford_pants',
            'dcl://base-avatars/sport_blue_shoes',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/mouth_03',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmXra1w433FdMHGh4Uoi9xnTz5JBRxQ8DdtkyHbDJcCAhG',
            body: 'https://peer.decentraland.org/content/contents/QmeZAvYihWq6dsWnL7rX38CfMwHNSNyxoo9ujxaRfLh9Hs',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default137: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/red_tshirt',
            'dcl://base-avatars/striped_swim_suit',
            'dcl://base-avatars/m_greenflipflops',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/handlebar',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmQXyguSvhPoAZcPrgwnTG563zRAUPKmub915duDeWiiN1',
            body: 'https://peer.decentraland.org/content/contents/QmWRuMypcYYBV5oRUPnEEEXE3WQQvxNxdq2MNRTR8LsYhq',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default138: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/pride_tshirt',
            'dcl://base-avatars/basketball_shorts',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/french_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmbtEyLyfTSNVhV7kA3auLK5fukdof5Xgzmcp1Dg83fKsd',
            body: 'https://peer.decentraland.org/content/contents/QmbJfjr19us2RKfVbGGcdXd1zucpqaB9uyqFWZQFw5ULym',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default139: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/puffer_jacket_hoodie',
            'dcl://base-avatars/hip_hop_joggers',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/tall_front_01',
            'dcl://base-avatars/eyes_11',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmQpvVbT2PHy9a85XDnwWM5y7KUaMwZkvV9pn1MtWXEgxW',
            body: 'https://peer.decentraland.org/content/contents/QmcFP8V9uKU8Yn1P35M6HJ8Bpnxs3aCRxKJzXsziC2GRZk',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default140: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater_02',
            'dcl://base-avatars/comfortablepants',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/00_bald',
            'dcl://base-avatars/beard',
            'dcl://base-avatars/blue_bandana'
          ],

          snapshots: {
            face: 'QmbrJ7aFPAmLTiccsC7fkV3MXCQGa3skatMgiQ1jL5zQAo',
            body: 'https://peer.decentraland.org/content/contents/QmSuERKCwihr94GG4WSSudTQ8LoTJdLGVkfBDB7nAcQmar',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default141: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater',
            'dcl://base-avatars/swim_short',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/cool_hair',
            'dcl://base-avatars/old_mustache_beard',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmQcpBv1KfZnRcHWrWBuPabnmfRwwBNL5tgBGgLF6PzUBU',
            body: 'https://peer.decentraland.org/content/contents/QmTE7kHJ2LzV2VPT4VJj7SctTkeXmGqkti1HbKcLSdhGbe',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default142: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/soccer_shirt',
            'dcl://base-avatars/jean_shorts',
            'dcl://base-avatars/m_feet_soccershoes',
            'dcl://base-avatars/rasta',
            'dcl://base-avatars/short_boxed_beard',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmRWET1oCrikDUZzcct5qC97ZEkktPkVKnk56GsUK4FXtE',
            body: 'https://peer.decentraland.org/content/contents/QmWYyJ46F6xZznFvaoYfkxf9aWEiG2p4SfKLqLZWmPRxuM',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default143: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/moptop',
            'dcl://base-avatars/lincoln_beard',
            'dcl://base-avatars/matrix_sunglasses'
          ],

          snapshots: {
            face: 'QmX1scbudZxcdXfc8e8nLpe4QFtfu7MHXf8pwuST1LyPt6',
            body: 'https://peer.decentraland.org/content/contents/QmUNgE5o4YpMtyTxW8inahuLkydGoBmp9NZwX4ugtuNW7D',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default144: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 0.9490196108818054,
              g: 0.7607843279838562,
              b: 0.6470588445663452
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/striped_shirt_01',
            'dcl://base-avatars/cargo_shorts',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/chin_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmTheaTVtXW9derVBQ4ZcKonTQEdx87sR2EiGBbr87iRHM',
            body: 'https://peer.decentraland.org/content/contents/QmUvp7htYbkktmr343UJodRY5YUFncaa9N99LWnCvUrE8M',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default145: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/green_hoodie',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/casual_hair_01',
            'dcl://base-avatars/beard'
          ],

          snapshots: {
            face: 'Qmahy18CPNwMELGjCuhZaJmH3ToDuYsAXknDrzLpM6UtQx',
            body: 'https://peer.decentraland.org/content/contents/QmQwdb1RvzASJRKzhj5PJna1jckjcTHgWwY5LfJwMQFTsn',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default146: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5960784554481506,
              g: 0.37254902720451355,
              b: 0.21568627655506134
            }
          },
          eyes: {
            color: {
              r: 0.686274528503418,
              g: 0.772549033164978,
              b: 0.7803921699523926
            }
          },
          wearables: [
            'dcl://base-avatars/yellow_tshirt',
            'dcl://base-avatars/soccer_pants',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/granpa_beard'
          ],

          snapshots: {
            face: 'QmVfRLVQippBtdCL6g9oqEQc17bk66Cmj9NqeFVSAJvVC7',
            body: 'https://peer.decentraland.org/content/contents/QmdFwqbJqPrnFvUmREYwPtMmd4bdDPjyv3rhc1zSqWKTA2',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default147: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/kilt',
            'dcl://base-avatars/m_mountainshoes.glb',
            'dcl://base-avatars/keanu_hair',
            'dcl://base-avatars/full_beard'
          ],

          snapshots: {
            face: 'QmPAJTRrs1doh9ysEmJQczcHX27ZxpvWRrbMh1wMndag5K',
            body: 'https://peer.decentraland.org/content/contents/QmP5CmufgHfTS7d4gt2XHmRjN2oRELFqv8Cazd835rRQkK',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default148: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/sleeveless_punk_shirt',
            'dcl://base-avatars/trash_jean',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/punk',
            'dcl://base-avatars/horseshoe_beard',
            'dcl://base-avatars/Thunder_earring'
          ],

          snapshots: {
            face: 'QmSjMWHjFFb7XoL3JhTtKoNZrjGTURXAggHc9BesM2BotL',
            body: 'https://peer.decentraland.org/content/contents/QmS55f4SmEqLjn7aoppn8wRSV8znEiKFYBc7Q8iv8og6Jp',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default149: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.9254902005195618,
              g: 0.9098039269447327,
              b: 0.886274516582489
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/striped_pijama',
            'dcl://base-avatars/pijama_pants',
            'dcl://base-avatars/bear_slippers',
            'dcl://base-avatars/semi_bold',
            'dcl://base-avatars/mouth_04',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmVQeRJSa83aUHGQy3uTx3EtSfPHq3q5vgsjA5WiVEgBkM',
            body: 'https://peer.decentraland.org/content/contents/QmXsAiXzeh4JHsmfuBkJzDZ3yYAvUE38Mcxg2BFHqVE1Hy',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default150: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 1,
              g: 0.7450980544090271,
              b: 0.1568627506494522
            }
          },
          eyes: {
            color: {
              r: 0.125490203499794,
              g: 0.7019608020782471,
              b: 0.9647058844566345
            }
          },
          wearables: [
            'dcl://base-avatars/red_square_shirt',
            'dcl://base-avatars/brown_pants',
            'dcl://base-avatars/sneakers',
            'dcl://base-avatars/slicked_hair',
            'dcl://base-avatars/eyes_08',
            'dcl://base-avatars/punk_piercing'
          ],

          snapshots: {
            face: 'QmUmvJSDHAWRWGB7CMAysEjfW8HXABuyZwPhxDFyzmNjso',
            body: 'https://peer.decentraland.org/content/contents/Qmag2BJiQf89rUSwpqnnM8C1R4XZzoXSykNAicYZswBM2B',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default151: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.5254902243614197,
              g: 0.3803921639919281,
              b: 0.25882354378700256
            }
          },
          wearables: [
            'dcl://base-avatars/turtle_neck_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/semi_afro',
            'dcl://base-avatars/mouth_05',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmdirgxR9EmGPRKuVgiSAmbDSFTE3aek2Uo6eVQwz48TfD',
            body: 'https://peer.decentraland.org/content/contents/QmR7oCSGiGDxbVM6SucAAwvwrTxFAWTr6CsuHcdp9GQXvL',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default152: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/green_square_shirt',
            'dcl://base-avatars/oxford_pants',
            'dcl://base-avatars/sport_blue_shoes',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/mouth_03',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'QmSrDfSuzHXhE6XsYKoHqzHJDjnoSggw7Q275RgTiQfhma',
            body: 'https://peer.decentraland.org/content/contents/QmPf8DvyQk4SoJ2A2jknLMNUxHYM4PSTchRVPAEGrEsncn',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default153: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.5490196347236633,
              g: 0.125490203499794,
              b: 0.0784313753247261
            }
          },
          eyes: {
            color: {
              r: 0.7490196228027344,
              g: 0.6196078658103943,
              b: 0.3529411852359772
            }
          },
          wearables: [
            'dcl://base-avatars/red_tshirt',
            'dcl://base-avatars/striped_swim_suit',
            'dcl://base-avatars/m_greenflipflops',
            'dcl://base-avatars/casual_hair_02',
            'dcl://base-avatars/handlebar',
            'dcl://base-avatars/toruspiercing'
          ],

          snapshots: {
            face: 'Qmd913o4ePL55dEoUJjGhCYtxL6EQNyATvpRF7Qfjis79s',
            body: 'https://peer.decentraland.org/content/contents/Qmdahb2tNw8rs6DtQwnn9HBVHf3m8CgdKPsDozBuZvRwaW',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default154: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.2235294133424759,
              g: 0.48627451062202454,
              b: 0.6901960968971252
            }
          },
          wearables: [
            'dcl://base-avatars/pride_tshirt',
            'dcl://base-avatars/basketball_shorts',
            'dcl://base-avatars/moccasin',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/french_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmfBjApPCBiiMqGmaXvjvY5Cb51Z9awYsH9UxfjHm3e4Ko',
            body: 'https://peer.decentraland.org/content/contents/QmZv2P41mc6HiFXa6WfgLARjijdDjo3EA5p4aNcbQTmaq6',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default155: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.35686275362968445,
              g: 0.1921568661928177,
              b: 0.05882352963089943
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/puffer_jacket_hoodie',
            'dcl://base-avatars/hip_hop_joggers',
            'dcl://base-avatars/citycomfortableshoes',
            'dcl://base-avatars/tall_front_01',
            'dcl://base-avatars/eyes_11',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmQ6TLMcznLxHHXzkT24p6mdgfHsx4e27LEQJjzzhoZQoP',
            body: 'https://peer.decentraland.org/content/contents/QmUNxjQdgxW5uJmDigs5Cg5J2rS4Xwq563zPFzB1FMBhE1',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default156: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.23529411852359772,
              g: 0.12941177189350128,
              b: 0.04313725605607033
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater_02',
            'dcl://base-avatars/comfortablepants',
            'dcl://base-avatars/Espadrilles',
            'dcl://base-avatars/00_bald',
            'dcl://base-avatars/beard',
            'dcl://base-avatars/blue_bandana'
          ],

          snapshots: {
            face: 'QmNX6PEzTPMJAqdQ6URhDQdT8NGLtHrXZbqFCAe73ZyAKf',
            body: 'https://peer.decentraland.org/content/contents/QmfPaDd81Qx1BpbpiFhHKhjM6D7SsFUi83wWuRarw7489a',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default157: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.23137255012989044,
              g: 0.6235294342041016,
              b: 0.3137255012989044
            }
          },
          wearables: [
            'dcl://base-avatars/m_sweater',
            'dcl://base-avatars/swim_short',
            'dcl://base-avatars/crocs',
            'dcl://base-avatars/cool_hair',
            'dcl://base-avatars/old_mustache_beard',
            'dcl://base-avatars/black_sun_glasses'
          ],

          snapshots: {
            face: 'QmZHav6AT7A66cd9KGj9tALqS88s35aZGkj97K1cAuox1G',
            body: 'https://peer.decentraland.org/content/contents/QmSJA7535efnobhUdadmCELvFJYKipdExFk7J5NEXqojdM',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default158: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.10980392247438431,
              g: 0.10980392247438431,
              b: 0.10980392247438431
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/soccer_shirt',
            'dcl://base-avatars/jean_shorts',
            'dcl://base-avatars/m_feet_soccershoes',
            'dcl://base-avatars/rasta',
            'dcl://base-avatars/short_boxed_beard',
            'dcl://base-avatars/golden_earring'
          ],

          snapshots: {
            face: 'QmUwvMqkohbD4m2gTvXMThZgkun1P18YNY3jqAJSK2QFyQ',
            body: 'https://peer.decentraland.org/content/contents/QmVSmhF6RWJhdXYf7W23UmYLWqftczkj9BQzn4uzUpre2Z',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default159: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.9803921580314636,
              g: 0.8235294222831726,
              b: 0.5058823823928833
            }
          },
          eyes: {
            color: {
              r: 0.529411792755127,
              g: 0.501960813999176,
              b: 0.47058823704719543
            }
          },
          wearables: [
            'dcl://base-avatars/elegant_sweater',
            'dcl://base-avatars/brown_pants_02',
            'dcl://base-avatars/classic_shoes',
            'dcl://base-avatars/moptop',
            'dcl://base-avatars/lincoln_beard',
            'dcl://base-avatars/matrix_sunglasses'
          ],

          snapshots: {
            face: 'Qmd6wZntDiJvg2RReaSXhS3T9qYHuquzSipDCVBL2eLbwT',
            body: 'https://peer.decentraland.org/content/contents/QmUyzPHUKQJWJmU9PFa8XRrse8fvNZ1vr5VympZs4MJ7r7',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  },
  default160: {
    avatars: [
      {
        name: '',
        description: '',
        avatar: {
          bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
          skin: {
            color: {
              r: 1,
              g: 0.8941176533699036,
              b: 0.7764706015586853
            }
          },
          hair: {
            color: {
              r: 0.48235294222831726,
              g: 0.2823529541492462,
              b: 0.0941176488995552
            }
          },
          eyes: {
            color: {
              r: 0.37254902720451355,
              g: 0.2235294133424759,
              b: 0.19607843458652496
            }
          },
          wearables: [
            'dcl://base-avatars/striped_shirt_01',
            'dcl://base-avatars/cargo_shorts',
            'dcl://base-avatars/comfy_sport_sandals',
            'dcl://base-avatars/hair_oldie',
            'dcl://base-avatars/chin_beard',
            'dcl://base-avatars/00_EmptyEarring'
          ],

          snapshots: {
            face: 'QmW4UumpkSCtEwiHBV2YGQrH78h2GxP1ZMksxr7U6R2u8L',
            body: 'https://peer.decentraland.org/content/contents/QmNzZt5157zjxHaVMdwQPaybg9D8P5rFWiu5FLAktBtwR2',
            face256: 'https://peer.decentraland.org/content/contents/undefined'
          }
        },
        hasClaimedName: false
      }
    ]
  }
}

export async function createDefaultProfilesComponent(): Promise<DefaultProfilesComponent> {
  function getProfile(id: string): Profile | undefined {
    return defaultProfiles[id]
  }

  return {
    getProfile
  }
}
