const URL_CACHE = new Map<string, string | null>()

async function fetchSpriteUrl(name: string): Promise<string | null> {
  const key = name.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (URL_CACHE.has(key)) return URL_CACHE.get(key)!
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) { URL_CACHE.set(key, null); return null }
    const data = await res.json()
    const url: string | null = data.sprites?.front_default ?? null
    URL_CACHE.set(key, url)
    return url
  } catch {
    URL_CACHE.set(key, null)
    return null
  }
}

export function pokeSpriteKey(name: string): string {
  return `poke_${name.toLowerCase().replace(/[^a-z0-9-]/g, '')}`
}

function addCanvasTexture(scene: Phaser.Scene, key: string, img: HTMLImageElement): boolean {
  try {
    if (scene.textures.exists(key)) return true
    const w = img.naturalWidth || 96
    const h = img.naturalHeight || 96
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    scene.textures.addCanvas(key, canvas)
    try { scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST) } catch {}
    return true
  } catch {
    return false
  }
}

export async function loadPokeSprite(scene: Phaser.Scene, name: string): Promise<boolean> {
  const key = pokeSpriteKey(name)
  const url = await fetchSpriteUrl(name)
  if (!url) return false
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(addCanvasTexture(scene, key, img))
    img.onerror = () => resolve(false)
    img.src = url
  })
}

export async function loadPokeSprites(scene: Phaser.Scene, names: string[]): Promise<void> {
  const unique = [...new Set(names.map(n => n.toLowerCase().replace(/[^a-z0-9-]/g, '')))]
  await Promise.allSettled(unique.map(n => loadPokeSprite(scene, n)))
}

const ITEM_CACHE = new Map<string, string | null>()

async function fetchItemSpriteUrl(name: string): Promise<string | null> {
  const key = name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (ITEM_CACHE.has(key)) return ITEM_CACHE.get(key)!
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/item/${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) { ITEM_CACHE.set(key, null); return null }
    const data = await res.json()
    const url: string | null = data.sprites?.default ?? null
    ITEM_CACHE.set(key, url)
    return url
  } catch {
    ITEM_CACHE.set(key, null)
    return null
  }
}

export function itemSpriteKey(name: string): string {
  return `item_${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`
}

// Trainer label → PokeAPI sprites repo slug
const TRAINER_SLUG: Record<string, string> = {
  'Bug Catcher':  'bug-catcher',
  'Youngster':    'youngster',
  'Lass':         'lass',
  'Hiker':        'hiker',
  'Camper':       'camper',
  'Fire Trainer': 'cool-trainer-f',
  'Cooltrainer':  'cool-trainer',
  'Team Rocket':  'team-rocket-grunt-m',
}

const TRAINER_URL_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers'
const TRAINER_CACHE = new Map<string, string | null>()

export function trainerSpriteKey(label: string): string {
  return `trainer_${(TRAINER_SLUG[label] ?? label).replace(/[^a-z0-9-]/g, '-')}`
}

export async function loadTrainerSprite(scene: Phaser.Scene, label: string): Promise<boolean> {
  const slug = TRAINER_SLUG[label]
  if (!slug) return false
  const key = trainerSpriteKey(label)
  if (scene.textures.exists(key)) return true
  if (TRAINER_CACHE.has(slug)) {
    const url = TRAINER_CACHE.get(slug)
    if (!url) return false
    return new Promise(resolve => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(addCanvasTexture(scene, key, img))
      img.onerror = () => resolve(false)
      img.src = url
    })
  }
  const url = `${TRAINER_URL_BASE}/${slug}.png`
  TRAINER_CACHE.set(slug, url)
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(addCanvasTexture(scene, key, img))
    img.onerror = () => { TRAINER_CACHE.set(slug, null); resolve(false) }
    img.src = url
  })
}

export async function loadItemSprite(scene: Phaser.Scene, name: string): Promise<boolean> {
  const key = itemSpriteKey(name)
  const url = await fetchItemSpriteUrl(name)
  if (!url) return false
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(addCanvasTexture(scene, key, img))
    img.onerror = () => resolve(false)
    img.src = url
  })
}
