import { TYPE_COLORS } from '../data/Types'
import { MOVES } from '../data/Moves'
import { calcStat, calcHp } from '../entities/Pokemon'
import './StarterMenu.css'

const BASE_STATS: Record<number, [number, number, number, number]> = {
  1:  [45, 49, 49, 45],
  4:  [39, 52, 43, 65],
  7:  [44, 48, 65, 43],
  25: [35, 55, 40, 90],
}

const PHYSICAL_TYPES = new Set(['normal', 'fighting', 'ground', 'rock', 'flying'])
const STAT_MAX = 32

interface StarterEntry {
  name: string
  dexId: number
  type: string
  moves: string[]
}

export class StarterMenu {
  private container: HTMLElement
  private onSelect: (dexId: number) => void

  constructor(starters: StarterEntry[], onSelect: (dexId: number) => void) {
    this.onSelect = onSelect
    this.container = document.createElement('div')
    this.container.className = 'starter-menu'
    this.render(starters)
    document.body.appendChild(this.container)
  }

  private render(starters: StarterEntry[]) {
    const title = document.createElement('div')
    title.className = 'starter-title'
    title.textContent = '¡Elige tu inicial!'
    this.container.appendChild(title)

    const grid = document.createElement('div')
    grid.className = 'starter-grid'

    starters.forEach(s => {
      grid.appendChild(this.buildCard(s))
    })

    this.container.appendChild(grid)
  }

  private buildCard(s: StarterEntry): HTMLElement {
    const lv = 5
    const bs = BASE_STATS[s.dexId] || [45, 50, 45, 45]
    const hp  = calcHp(bs[0], lv)
    const atk = calcStat(bs[1], lv)
    const def = calcStat(bs[2], lv)
    const spd = calcStat(bs[3], lv)
    const typeColor = TYPE_COLORS[s.type as keyof typeof TYPE_COLORS] || '#aaa'

    // Signature move = last move available at lv5 (max 2 for level < 10)
    const moveName = s.moves[Math.min(1, s.moves.length - 1)]
    const moveData = MOVES[moveName]
    const moveType = moveData?.type || s.type
    const movePwr  = moveData?.power || 40
    const moveTypeColor = TYPE_COLORS[moveType as keyof typeof TYPE_COLORS] || '#aaa'
    const category = PHYSICAL_TYPES.has(moveType) ? 'FÍSICO' : 'ESPECIAL'
    const catColor  = category === 'FÍSICO' ? '#c84800' : '#6848c0'

    const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.dexId}.png`

    const card = document.createElement('div')
    card.className = 'starter-card'
    card.style.setProperty('--type-color', typeColor)

    card.innerHTML = `
      <div class="sc-pokeball">
        <div class="sc-pokeball-top"></div>
        <div class="sc-pokeball-mid"></div>
        <div class="sc-pokeball-bot"></div>
        <div class="sc-pokeball-btn"></div>
      </div>

      <div class="sc-sprite-wrap">
        <img class="sc-sprite" src="${spriteUrl}" alt="${s.name}" draggable="false" />
      </div>

      <div class="sc-name">${s.name}</div>
      <div class="sc-level">Lv. ${lv}</div>

      <div class="sc-type-badge" style="background:${typeColor}">${s.type.toUpperCase()}</div>

      <div class="sc-stats">
        ${this.statRow('ATK', atk)}
        ${this.statRow('DEF', def)}
        ${this.statRow('HP',  hp)}
        ${this.statRow('VEL', spd)}
      </div>

      <div class="sc-move-box">
        <div class="sc-move-name">${moveData?.nameEs || moveName}</div>
        <div class="sc-move-tags">
          <span class="sc-move-type" style="background:${moveTypeColor}">${moveType.toUpperCase()}</span>
        </div>
        <div class="sc-move-pwr">${movePwr} FZA</div>
      </div>

      <button class="sc-btn">Elegir</button>
    `

    card.querySelector('.sc-btn')!.addEventListener('click', () => {
      setTimeout(() => this.onSelect(s.dexId), 150)
    })

    return card
  }

  private statRow(label: string, val: number): string {
    const pct = Math.min(100, Math.round((val / STAT_MAX) * 100))
    return `
      <div class="sc-stat-row">
        <span class="sc-stat-label">${label}</span>
        <div class="sc-stat-bar-bg">
          <div class="sc-stat-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="sc-stat-val">${val}</span>
      </div>
    `
  }

  public remove() {
    this.container.remove()
  }
}
