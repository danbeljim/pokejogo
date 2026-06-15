import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { POKEMON_LIST, createWildPokemon } from '../entities/PokemonFactory'

export interface RandomMethod {
  id: string
  name: string
  description: string
  assetUrl: string
  types: string[]
}

export const RANDOM_METHODS: RandomMethod[] = [
  {
    id: 'random-excavar',
    name: 'Excavar',
    description: 'Pokémon Roca/Tierra',
    assetUrl: '/assets/random/Excavar_LGPE.gif',
    types: ['rock', 'ground']
  },
  {
    id: 'random-supercana',
    name: 'Supercaña',
    description: 'Pokémon Agua',
    assetUrl: '/assets/random/Supercaña_DBPR.png',
    types: ['water']
  },
  {
    id: 'random-vuelo',
    name: 'Vuelo',
    description: 'Pokémon Volador',
    assetUrl: '/assets/random/Vuelo_HGSS.gif',
    types: ['flying']
  },
  {
    id: 'random-bosque',
    name: 'Bosque 🌲',
    description: 'Pokémon Planta/Bicho',
    assetUrl: '/assets/random/Excavar_LGPE.gif',
    types: ['grass', 'bug']
  },
  {
    id: 'random-cueva',
    name: 'Cueva Oscura 🕳️',
    description: 'Pokémon Veneno/Fantasma',
    assetUrl: '/assets/random/Vuelo_HGSS.gif',
    types: ['poison', 'ghost']
  },
  {
    id: 'random-volcan',
    name: 'Volcán 🌋',
    description: 'Pokémon Fuego/Roca',
    assetUrl: '/assets/random/Excavar_LGPE.gif',
    types: ['fire', 'rock']
  },
  {
    id: 'random-pantano',
    name: 'Pantano ☣️',
    description: 'Pokémon Veneno/Agua',
    assetUrl: '/assets/random/Supercaña_DBPR.png',
    types: ['poison', 'water']
  },
  {
    id: 'random-ruinas',
    name: 'Ruinas 🏛️',
    description: 'Pokémon Psíquico/Fantasma',
    assetUrl: '/assets/random/Vuelo_HGSS.gif',
    types: ['psychic', 'ghost']
  },
]

export interface RandomPickerData {
  playerTeam: Pokemon[]
  difficulty: number
  onComplete: (captureOptions?: Pokemon[]) => void
}

export default class RandomPickerScene extends Phaser.Scene {
  private pickerData!: RandomPickerData
  private overlay?: HTMLDivElement

  constructor() { super('RandomPickerScene') }

  init(pickerData: RandomPickerData) {
    this.pickerData = pickerData
  }

  create() {
    this.cameras.main.setBackgroundColor('#00000000')
    this.overlay = this.buildOverlay()
    document.body.appendChild(this.overlay)
  }

  private buildOverlay(): HTMLDivElement {
    const wrap = document.createElement('div')
    wrap.style.cssText = `
      position:fixed; inset:0; background:rgba(10,10,26,0.96);
      display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      z-index:9999; font-family:Arial,sans-serif;
      overflow-y:auto; padding:16px 0 24px;
    `

    const isMobile = window.innerWidth < 700
    const titleSize = isMobile ? '18px' : '28px'
    const titleMargin = isMobile ? '16px' : '40px'

    const title = document.createElement('h2')
    title.textContent = '¡Elige tu método de exploración!'
    title.style.cssText = `color:#AA44FF; margin-bottom:${titleMargin}; font-size:${titleSize}; text-align:center; padding:0 12px;`
    wrap.appendChild(title)

    const row = document.createElement('div')
    const cardW = isMobile ? `${Math.floor((window.innerWidth - 48) / 3)}px` : '200px'
    const gap = isMobile ? '8px' : '40px'
    row.style.cssText = `display:flex; gap:${gap}; flex-wrap:nowrap; justify-content:center; width:100%; padding:0 8px; box-sizing:border-box;`
    wrap.appendChild(row)

    const imgSize = isMobile ? '50px' : '140px'
    const nameSize = isMobile ? '11px' : '20px'
    const descSize = isMobile ? '9px' : '14px'
    const padding = isMobile ? '10px 6px' : '24px'

    const shown = [...RANDOM_METHODS].sort(() => Math.random() - 0.5).slice(0, 3)

    shown.forEach(method => {
      const card = document.createElement('div')
      card.style.cssText = `
        background:#1a0a2e; border:2px solid #AA44FF; border-radius:12px;
        padding:${padding}; width:${cardW}; text-align:center; cursor:pointer;
        transition:transform 0.15s, border-color 0.15s; box-sizing:border-box;
      `
      card.onmouseenter = () => { card.style.transform = 'scale(1.05)'; card.style.borderColor = '#FFD700' }
      card.onmouseleave = () => { card.style.transform = 'scale(1)'; card.style.borderColor = '#AA44FF' }

      const img = document.createElement('img')
      img.src = method.assetUrl
      img.style.cssText = `width:${imgSize}; height:${imgSize}; object-fit:contain; display:block; margin:0 auto ${isMobile ? '8px' : '16px'};`
      card.appendChild(img)

      const name = document.createElement('div')
      name.textContent = method.name
      name.style.cssText = `color:#ffffff; font-size:${nameSize}; font-weight:bold; margin-bottom:4px;`
      card.appendChild(name)

      const desc = document.createElement('div')
      desc.textContent = method.description
      desc.style.cssText = `color:#ccaaff; font-size:${descSize}; margin-bottom:${isMobile ? '10px' : '20px'};`
      card.appendChild(desc)

      const btn = document.createElement('button')
      btn.textContent = 'Elegir'
      btn.style.cssText = `
        background:#222; color:#FFD700; border:1px solid #FFD700;
        padding:${isMobile ? '6px 10px' : '8px 20px'}; font-size:${isMobile ? '12px' : '15px'};
        font-weight:bold; border-radius:6px; cursor:pointer; width:100%;
      `
      btn.onmouseenter = () => { btn.style.background = '#FFD700'; btn.style.color = '#000' }
      btn.onmouseleave = () => { btn.style.background = '#222'; btn.style.color = '#FFD700' }
      btn.onclick = () => this.pick(method)
      card.appendChild(btn)

      row.appendChild(card)
    })

    return wrap
  }

  private pick(method: RandomMethod) {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = undefined
    }

    const difficulty = this.pickerData.difficulty
    const level = Math.max(3, difficulty * 3 + Math.floor(Math.random() * 4))
    const pool = POKEMON_LIST.filter(p => method.types.includes(p.type))
    const seen = new Set<number>()
    const opts: Pokemon[] = []
    let tries = 0
    while (opts.length < 3 && tries < 50) {
      const entry = pool[Math.floor(Math.random() * pool.length)]
      if (entry && !seen.has(entry.dexId)) {
        seen.add(entry.dexId)
        opts.push(createWildPokemon(level, entry.dexId))
      }
      tries++
    }

    const cb = this.pickerData.onComplete
    this.scene.resume('GameScene')
    this.scene.stop()
    cb(opts.length > 0 ? opts : undefined)
  }

  // Limpiar overlay si la escena se destruye inesperadamente
  shutdown() {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = undefined
    }
  }
}
