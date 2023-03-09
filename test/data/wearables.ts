const TWO_DAYS = (2 * 24 * 60 * 60 * 1000)

export function generateWearables(quantity: number) {
    const generatedWearables = [];
    for (let i = 0; i < quantity; i++) {
        generatedWearables.push({
            urn: 'urn-' + i,
            id: 'id-' + i,
            tokenId: 'tokenId-' + i,
            category: 'category',
            transferredAt: Date.now() - TWO_DAYS,
            item: {
                rarity: 'unique',
                price: 100 + i
            }
        })
    }

    return generatedWearables
}