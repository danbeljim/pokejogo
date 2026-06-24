const CACHE = new Map<string, string | null>()

async function tryTCGdex(pokemonName: string): Promise<string | null> {
  const res = await fetch(
    `https://api.tcgdex.net/v2/es/cards?name=${encodeURIComponent(pokemonName)}`,
    { signal: AbortSignal.timeout(5000) }
  )
  if (!res.ok) return null
  const data = await res.json()
  const card = Array.isArray(data) ? data[0] : null
  if (!card?.image) return null
  return `${card.image}/high.webp`
}

async function tryPokemonTCG(pokemonName: string): Promise<string | null> {
  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(pokemonName)}&pageSize=1&select=images`,
    { signal: AbortSignal.timeout(5000) }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.data?.[0]?.images?.large ?? data.data?.[0]?.images?.small ?? null
}

export async function fetchTCGCardImage(pokemonName: string): Promise<string | null> {
  const key = pokemonName.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (CACHE.has(key)) return CACHE.get(key)!
  try {
    const url = await tryTCGdex(pokemonName) ?? await tryPokemonTCG(pokemonName)
    CACHE.set(key, url)
    return url
  } catch {
    CACHE.set(key, null)
    return null
  }
}

export async function preloadTCGImages(pokemonNames: string[]): Promise<void> {
  await Promise.allSettled(pokemonNames.map(n => fetchTCGCardImage(n)))
}
