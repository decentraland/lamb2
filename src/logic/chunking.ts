export function chunks<T>(items: T[], chunkSize: number): T[][] {
  if (items.length === 0) {
    return []
  }

  return items.reduce(
    (acc: T[][], curr: T) => {
      if (acc[acc.length - 1].length === chunkSize) {
        acc.push([curr])
      } else {
        acc[acc.length - 1].push(curr)
      }
      return acc
    },
    [[]]
  )
}
