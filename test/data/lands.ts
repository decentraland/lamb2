import { LANDFromQuery } from '../../src/logic/fetch-elements/fetch-lands'

export function generateLANDs(quantity: number): LANDFromQuery[] {
  const generatedLANDs: LANDFromQuery[] = []
  for (let i = 0; i < quantity; i++) {
    const isParcel = i % 2 == 0
    generatedLANDs.push({
      id: 'id-' + i,
      contractAddress: 'contractAddress-' + i,
      tokenId: 'tokenId-' + i,
      category: isParcel ? 'parcel' : 'estate',
      name: 'name-' + i,
      image: 'image-' + i,
      parcel: isParcel ? parcelInfoFor(i) : undefined,
      estate: isParcel ? undefined : estateInfoFor(i),
      activeOrder: {
        price: i
      }
    })
  }

  return generatedLANDs
}

function parcelInfoFor(i: number) {
  return {
    x: '0',
    y: '0',
    data: {
      description: 'i am a parcel ' + i
    }
  }
}

function estateInfoFor(i: number) {
  return {
    data: {
      description: 'i am a estate ' + i
    }
  }
}
