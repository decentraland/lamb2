const TWO_DAYS = (2 * 24 * 60 * 60 * 1000)

export function generateEmotes(quantity: number) {
  const generatedEmotes = []
  for (let i = 0; i < quantity; i++) {
    generatedEmotes.push({
      urn: 'urn-' + i,
      id: 'id-' + i,
      tokenId: 'tokenId-' + i,
      category: 'emote',
      transferredAt: Date.now() - TWO_DAYS,
      item: {
        rarity: 'unique',
        price: 100 + i
      }
    })
  }

  return generatedEmotes
}

export function generateDefinitions(urns: string[]) {
  return urns.map((urn) => ({
    version: '1',
    id: urn,
    type: 'emote',
    pointers: ['0x0', '0x1'],
    timestamp: Date.now() - TWO_DAYS,
    content: [{
      file: 'file',
      hash: 'id'
    }],
    metadata: {
      id: urn,
      emoteDataADR74: {
        representations: [
          { contents: ['fileName'] }
        ]
      }
    }
  }))
}
