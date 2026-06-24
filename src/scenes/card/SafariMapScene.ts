import Phaser from 'phaser'
import { CardRunState, CARD_POOL } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'
import { loadPokeSprite, pokeSpriteKey } from '../../utils/PokeSprite'

const GRID_W = 20
const GRID_H = 12
const FOG_CLEAR = 5
const FOG_SIGNAL = 8
// Computed at runtime in create() to avoid circular init with GAME_W/GAME_H
let HUD_W = 0, TOP_H = 0, CELL = 0, GRID_OX = 0, GRID_OY = 0

function initLayout() {
  HUD_W = Math.round(GAME_W * 0.14)
  TOP_H = Math.round(GAME_H * 0.08)
  CELL = Math.floor(Math.min((GAME_W - HUD_W - 24) / GRID_W, (GAME_H - TOP_H - 24) / GRID_H))
  GRID_OX = HUD_W + 12
  GRID_OY = TOP_H + 12
}

type EType = 'wild' | 'tall_grass' | 'lake' | 'obstacle' | 'alpha'

interface SafariEntity {
  id: number
  type: EType
  gx: number
  gy: number
  icon: string
  label: string
  pokemonName?: string
  fleeIn?: number
  isAlpha?: boolean
  patrolDir?: number   // 0=N 1=E 2=S 3=W
  defeated?: boolean
  used?: boolean
  threatValue?: number
}

interface SafariState {
  entities: SafariEntity[]
  px: number
  py: number
  stamina: number
  maxStamina: number
  day: number
  threat: number
  actBossDefeated: boolean
  stepCount: number
  act: number
  nextId: number
  log: string[]
}

interface ZoneConfig {
  name: string; bg: string
  pokemons: string[]; rare: string[]; alphaName: string
  distIcon: string; distLabel: string
}

const ZONE: Record<1|2|3, ZoneConfig> = {
  1: {
    name: 'Safari Zona A — Selva',
    bg: '#081408',
    pokemons: ['Caterpie','Weedle','Pidgey','Rattata','Oddish','Paras','Venonat','Bellsprout'],
    rare: ['Scyther','Pinsir','Ditto'],
    alphaName: 'Beedrill Alfa',
    distIcon: '🌿', distLabel: 'Movimiento...',
  },
  2: {
    name: 'Safari Zona B — Montaña',
    bg: '#0a0a16',
    pokemons: ['Geodude','Machop','Onix','Mankey','Rhyhorn','Zubat','Slowpoke'],
    rare: ['Lapras','Snorlax'],
    alphaName: 'Golem Alfa',
    distIcon: '🪨', distLabel: 'Tremor...',
  },
  3: {
    name: 'Safari Zona C — Volcán',
    bg: '#160806',
    pokemons: ['Magmar','Growlithe','Ponyta','Charmeleon','Ninetales'],
    rare: ['Moltres','Arcanine'],
    alphaName: 'Arcanine Alfa',
    distIcon: '🔥', distLabel: 'Señal de calor...',
  },
}

function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

type Cell = [number, number]

// Hardcoded layouts matching each background image (grid 20×12)
const ZONE_LAKES: Record<1|2|3, Cell[]> = {
  1: [ // safari1: rectangular lake center-left
    [7,4],[8,4],[9,4],[10,4],
    [7,5],[8,5],[9,5],[10,5],
    [7,6],[8,6],[9,6],[10,6],
  ],
  2: [ // safari2: H-shaped lake center
    [8,4],[9,4],[10,4],
    [8,5],[9,5],[10,5],
    [8,6],[9,6],[10,6],
    [8,7],[9,7],[10,7],
  ],
  3: [ // safari3: two small lakes on left side
    [2,3],[3,3],[2,4],[3,4],[2,5],[3,5],
    [2,7],[3,7],[2,8],[3,8],[2,9],[3,9],
  ],
}

const ZONE_GRASS: Record<1|2|3, Cell[]> = {
  1: [ // safari1: scattered clusters matching the palm-grass patches
    [2,1],[3,1],[4,1],[5,1],  [10,1],[11,1],[12,1],[13,1],[14,1],
    [2,2],[3,2],              [12,2],[13,2],
    [2,3],[3,3],[4,3],[5,3],  [11,3],[12,3],[13,3],
    [2,4],[3,4],              [15,4],[16,4],
    [2,5],[3,5],              [15,5],[16,5],
    [3,8],[4,8],[5,8],[6,8],  [12,8],[13,8],[14,8],[15,8],
    [3,9],[4,9],[5,9],        [12,9],[13,9],[14,9],
    [4,10],[5,10],[6,10],[7,10],[8,10],[9,10],
  ],
  2: [ // safari2: right block + scattered left and bottom
    [11,1],[12,1],[13,1],[14,1],[15,1],[16,1],
    [12,2],[13,2],[14,2],[15,2],[16,2],
    [12,3],[13,3],[14,3],[15,3],
    [3,3],[4,3],[3,4],[4,4],[3,5],[4,5],
    [3,6],[4,6],[5,6],
    [5,2],[6,2],[7,2],
    [8,9],[9,9],[10,9],[11,9],[12,9],[13,9],
    [8,10],[9,10],[10,10],[13,10],[14,10],
  ],
  3: [ // safari3: right-center block + top strip + bottom
    [5,1],[6,1],[7,1],[8,1],[9,1],
    [12,3],[13,3],[14,3],[15,3],
    [12,4],[13,4],[14,4],[15,4],[16,4],[17,4],
    [12,5],[13,5],[14,5],[16,5],[17,5],
    [12,6],[13,6],[16,6],[17,6],
    [5,4],[6,4],[7,4],
    [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],
    [5,10],[6,10],[7,10],[8,10],
  ],
}

function generateSafari(act: 1 | 2 | 3): SafariState {
  const z = ZONE[act]
  const entities: SafariEntity[] = []
  let nextId = 0

  // Lakes — fixed positions matching bg image
  for (const [gx, gy] of ZONE_LAKES[act]) {
    entities.push({ id: nextId++, type: 'lake', gx, gy, icon: '🌊', label: 'Lago', threatValue: 0 })
  }

  // Tall grass — fixed positions matching bg image
  for (const [gx, gy] of ZONE_GRASS[act]) {
    entities.push({ id: nextId++, type: 'tall_grass', gx, gy, icon: '🌿', label: 'Pasto alto', threatValue: 0 })
  }


  const wildOccupied = new Set<string>()
  const freeWildCell = () => {
    let gx: number, gy: number, key: string
    let tries = 0
    do { gx = rnd(1, GRID_W - 2); gy = rnd(1, GRID_H - 2); key = `${gx},${gy}`; tries++ } while (wildOccupied.has(key) && tries < 50)
    wildOccupied.add(key)
    return { gx, gy }
  }

  // Wild pokemon (move, have flee timer)
  const wildCount = 10 + act * 2
  for (let i = 0; i < wildCount; i++) {
    const isRare = Math.random() < 0.15
    const name = isRare ? pick(z.rare) : pick(z.pokemons)
    const { gx, gy } = freeWildCell()
    entities.push({
      id: nextId++, type: 'wild', gx, gy,
      icon: isRare ? '⭐' : '🐾', label: name, pokemonName: name,
      fleeIn: rnd(5, 10), threatValue: isRare ? 12 : 8
    })
  }


  // Start: player near bottom-left, clear of obstacles
  return {
    entities,
    px: 2, py: GRID_H - 3,
    stamina: 12, maxStamina: 12,
    day: 1, threat: 0,
    actBossDefeated: false,
    stepCount: 0,
    act,
    nextId,
    log: [`Día 1 — ${z.name}`, 'Explora la zona y sobrevive.']
  }
}

export default class SafariMapScene extends Phaser.Scene {
  private run!: CardRunState
  private state!: SafariState

  private cellGraphics!: Phaser.GameObjects.Graphics
  private entityLayer!: Phaser.GameObjects.Container
  private spriteLayer!: Phaser.GameObjects.Container
  private playerSprite!: Phaser.GameObjects.Container
  private hudText!: Phaser.GameObjects.Text
  private topBar!: Phaser.GameObjects.Text
  private logTexts: Phaser.GameObjects.Text[] = []
  private logContainer!: Phaser.GameObjects.Container
  private threatBar!: Phaser.GameObjects.Graphics
  private staminaBar!: Phaser.GameObjects.Graphics
  private blocked = false
  private entitySpriteMap: Map<number, Phaser.GameObjects.Image> = new Map()

  constructor() { super('SafariMapScene') }

  preload() {
    for (let i = 1; i <= 4; i++) {
      if (!this.textures.exists(`safari_bg_${i}`)) {
        this.load.image(`safari_bg_${i}`, `/assets/locations/safari${i}.png`)
      }
    }
    if (!this.textures.exists('ash_trainer')) {
      this.load.image('ash_trainer', '/assets/trainers/red.png')
    }
  }

  create() {
    initLayout()
    this.entitySpriteMap = new Map()
    this.run = this.registry.get('cardRunState') as CardRunState
    if (!this.run) { this.scene.start('CardMenuScene'); return }

    // Restore or generate safari state
    const stored = this.registry.get('safariState') as SafariState | undefined
    const actRaw = Math.floor(this.run.floor / 3) + 1
    const act = (((actRaw - 1) % 3) + 1) as 1 | 2 | 3
    if (stored && stored.act === act) {
      this.state = stored
      // Mark defeated entity from last battle
      const defeatedId = this.registry.get('safariDefeatedEntityId') as number | undefined
      if (defeatedId !== undefined) {
        const e = this.state.entities.find(x => x.id === defeatedId)
        if (e) e.defeated = true
        this.registry.remove('safariDefeatedEntityId')
      }
    } else {
      this.state = generateSafari(act)
      this.registry.set('safariState', this.state)
    }

    const z = ZONE[this.state.act as 1 | 2 | 3]
    this.cameras.main.setBackgroundColor(z.bg)

    // Background image (covers grid area only, behind everything)
    const bgKey = `safari_bg_${this.state.act}`
    if (this.textures.exists(bgKey)) {
      const gridCX = GRID_OX + (GRID_W * CELL) / 2
      const gridCY = GRID_OY + (GRID_H * CELL) / 2
      const bg = this.add.image(gridCX, gridCY, bgKey)
      bg.setDisplaySize(GRID_W * CELL, GRID_H * CELL)
      bg.setAlpha(0.55)
    }

    this.drawGrid()
    this.entityLayer = this.add.container(0, 0)
    this.drawEntities()
    this.spriteLayer = this.add.container(0, 0)
    this.playerSprite = this.add.container(0, 0)
    this.drawPlayer()
    this.drawHUD()
    this.drawTopBar()
    this.drawLog()
    this.setupInput()
    this.blocked = false
    this.loadEntitySprites()
  }

  // ── Grid ──────────────────────────────────────────────────────────────────

  private cellXY(gx: number, gy: number) {
    return { x: GRID_OX + gx * CELL + CELL / 2, y: GRID_OY + gy * CELL + CELL / 2 }
  }

  private drawGrid() {
    this.cellGraphics = this.add.graphics()
    this.cellGraphics.lineStyle(1, 0x1a2a1a, 0.4)
    for (let x = 0; x <= GRID_W; x++) this.cellGraphics.strokeLineShape(new Phaser.Geom.Line(GRID_OX + x * CELL, GRID_OY, GRID_OX + x * CELL, GRID_OY + GRID_H * CELL))
    for (let y = 0; y <= GRID_H; y++) this.cellGraphics.strokeLineShape(new Phaser.Geom.Line(GRID_OX, GRID_OY + y * CELL, GRID_OX + GRID_W * CELL, GRID_OY + y * CELL))
    // border
    this.cellGraphics.lineStyle(2, 0x334433, 0.8)
    this.cellGraphics.strokeRect(GRID_OX, GRID_OY, GRID_W * CELL, GRID_H * CELL)
  }

  private refreshFog() {
    this.cellGraphics.clear()
    this.cellGraphics.lineStyle(1, 0x1a2a1a, 0.4)
    for (let x = 0; x <= GRID_W; x++) this.cellGraphics.strokeLineShape(new Phaser.Geom.Line(GRID_OX + x * CELL, GRID_OY, GRID_OX + x * CELL, GRID_OY + GRID_H * CELL))
    for (let y = 0; y <= GRID_H; y++) this.cellGraphics.strokeLineShape(new Phaser.Geom.Line(GRID_OX, GRID_OY + y * CELL, GRID_OX + GRID_W * CELL, GRID_OY + y * CELL))
    this.cellGraphics.lineStyle(2, 0x334433, 0.8)
    this.cellGraphics.strokeRect(GRID_OX, GRID_OY, GRID_W * CELL, GRID_H * CELL)

    // fog overlay per cell
    for (let gx = 0; gx < GRID_W; gx++) {
      for (let gy = 0; gy < GRID_H; gy++) {
        const dist = Math.abs(gx - this.state.px) + Math.abs(gy - this.state.py)
        if (dist > FOG_CLEAR) {
          const alpha = dist > FOG_SIGNAL ? 0.88 : 0.55
          this.cellGraphics.fillStyle(0x000000, alpha)
          this.cellGraphics.fillRect(GRID_OX + gx * CELL + 1, GRID_OY + gy * CELL + 1, CELL - 2, CELL - 2)
        }
      }
    }
  }

  // ── Entities ──────────────────────────────────────────────────────────────

  private drawEntities() {
    this.entityLayer.removeAll(true)
    const fs = Math.round(CELL * 0.45)
    const fsLabel = Math.round(CELL * 0.18)
    for (const e of this.state.entities) {
      if (e.defeated || e.used) continue
      if (e.type === 'tall_grass' || e.type === 'lake' || e.type === 'obstacle') continue
      const dist = Math.abs(e.gx - this.state.px) + Math.abs(e.gy - this.state.py)
      const { x, y } = this.cellXY(e.gx, e.gy)
      const c = this.add.container(x, y)
      // far entities dimmed but always visible
      const alpha = dist > FOG_CLEAR ? 0.45 : 1
      const iconTxt = this.add.text(0, -4, e.icon, { fontSize: `${fs}px` }).setOrigin(0.5).setAlpha(alpha)
      c.add(iconTxt)
      const labelStr = e.label
      const lbl = this.add.text(0, CELL * 0.36, labelStr, {
        fontFamily: '"Press Start 2P"', fontSize: `${fsLabel}px`,
        color: e.type === 'wild' ? '#aaffaa' : '#aaaacc'
      }).setOrigin(0.5).setAlpha(alpha)
      c.add(lbl)
      this.entityLayer.add(c)
    }
  }

  private drawPlayer() {
    this.playerSprite.removeAll(true)
    const { x, y } = this.cellXY(this.state.px, this.state.py)
    this.playerSprite.setPosition(x, y)
    const fs = Math.round(CELL * 0.5)
    const glow = this.add.graphics()
    glow.fillStyle(0xFFD700, 0.2)
    glow.fillCircle(0, 0, CELL * 0.45)
    this.playerSprite.add(glow)
    if (this.textures.exists('ash_trainer')) {
      const size = Math.round(CELL * 0.9)
      const p = this.add.image(0, -2, 'ash_trainer').setDisplaySize(size, size).setOrigin(0.5)
      this.playerSprite.add(p)
    } else {
      const p = this.add.text(0, -2, '🧍', { fontSize: `${fs}px` }).setOrigin(0.5)
      this.playerSprite.add(p)
    }
    const lbl = this.add.text(0, CELL * 0.38, 'TÚ', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(CELL * 0.18)}px`, color: '#FFD700'
    }).setOrigin(0.5)
    this.playerSprite.add(lbl)
  }

  // ── Pokemon Sprites ───────────────────────────────────────────────────────

  private loadEntitySprites() {
    for (const e of this.state.entities) {
      if (e.defeated || e.used) continue

      if ((e.type === 'wild' || e.type === 'alpha') && e.pokemonName) {
        const name = e.pokemonName
        const key = pokeSpriteKey(name)
        if (this.textures.exists(key)) {
          this.placeEntitySprite(e, key)
        } else {
          loadPokeSprite(this, name).then(ok => {
            if (ok && !e.defeated) this.placeEntitySprite(e, pokeSpriteKey(name))
          })
        }
      }

    }
  }

  private placeEntitySprite(e: SafariEntity, key: string) {
    if (this.entitySpriteMap.has(e.id)) return  // already placed
    const { x, y } = this.cellXY(e.gx, e.gy)
    const size = Math.round(CELL * 1.6)
    const img = this.add.image(x, y - Math.round(CELL * 0.05), key)
    img.setDisplaySize(size, size)
    this.children.bringToTop(img)
    try { this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST) } catch {}
    this.entitySpriteMap.set(e.id, img)
  }

  private updateEntitySpritePositions() {
    for (const e of this.state.entities) {
      const img = this.entitySpriteMap.get(e.id)
      if (!img) continue
      if (e.defeated || e.used) { img.destroy(); this.entitySpriteMap.delete(e.id); continue }
      const dist = Math.abs(e.gx - this.state.px) + Math.abs(e.gy - this.state.py)
      const { x, y } = this.cellXY(e.gx, e.gy)
      // tween to new position
      this.tweens.add({ targets: img, x, y: y - Math.round(CELL * 0.05), duration: 180, ease: 'Power1' })
      img.setAlpha(1)
    }
    // Load sprites for newly spawned entities
    this.loadEntitySprites()
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  private drawHUD() {
    const g = this.add.graphics()
    g.fillStyle(0x050d05, 0.92)
    g.fillRect(0, 0, HUD_W, GAME_H)
    g.lineStyle(1, 0x223322, 0.8)
    g.strokeRect(0, 0, HUD_W, GAME_H)

    const cx = HUD_W / 2
    const fs = Math.round(GAME_H * 0.016)
    const { act } = this.state
    const displayAct = Math.floor(this.run.floor / 3) + 1
    const actColors: Record<number, string> = { 1: '#88ff88', 2: '#8888ff', 3: '#ff8888', 4: '#dd88ff', 5: '#88ffee', 6: '#ffee88' }
    const actColor = actColors[displayAct] ?? '#ffffff'

    this.add.text(cx, GAME_H * 0.04, `ACTO ${displayAct}`, { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.75)}px`, color: actColor }).setOrigin(0.5)
    this.add.text(cx, GAME_H * 0.08, ZONE[act as 1|2|3].name.split('—')[0].trim(), {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.55)}px`, color: '#556655', wordWrap: { width: HUD_W - 8 }
    }).setOrigin(0.5)

    // HP
    this.add.text(cx, GAME_H * 0.16, '❤️ PS', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.65)}px`, color: '#888' }).setOrigin(0.5)
    this.add.text(cx, GAME_H * 0.21, `${this.run.playerHp}/${this.run.playerMaxHp}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.85)}px`,
      color: this.run.playerHp < this.run.playerMaxHp * 0.3 ? '#FF4444' : '#FF8888'
    }).setOrigin(0.5)

    // Stamina label
    this.add.text(cx, GAME_H * 0.30, '⚡ ENERGÍA', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.6)}px`, color: '#888' }).setOrigin(0.5)
    this.staminaBar = this.add.graphics()
    this.updateStaminaBar()

    // Threat label
    this.add.text(cx, GAME_H * 0.44, '☠ AMENAZA', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.6)}px`, color: '#888' }).setOrigin(0.5)
    this.threatBar = this.add.graphics()
    this.updateThreatBar()

    // Deck / Gold
    this.add.text(cx, GAME_H * 0.60, '🃏 MAZO', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.6)}px`, color: '#888' }).setOrigin(0.5)
    this.hudText = this.add.text(cx, GAME_H * 0.645, `${this.run.deck.length}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.85)}px`, color: '#aaddff'
    }).setOrigin(0.5)

    this.add.text(cx, GAME_H * 0.71, '💰 ORO', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.6)}px`, color: '#888' }).setOrigin(0.5)
    this.add.text(cx, GAME_H * 0.755, `${this.run.gold}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.85)}px`, color: '#FFD700'
    }).setOrigin(0.5)

    // Back button
    const btn = this.add.text(cx, GAME_H * 0.96, '← SALIR', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.65)}px`, color: '#666',
      backgroundColor: '#050d05', padding: { x: 8, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btn.on('pointerover', () => btn.setColor('#ff4444'))
    btn.on('pointerout', () => btn.setColor('#666666'))
    btn.on('pointerdown', () => { this.registry.remove('safariState'); this.scene.start('CardMenuScene') })
  }

  private updateStaminaBar() {
    this.staminaBar.clear()
    const bw = HUD_W * 0.76, bh = 10
    const bx = HUD_W * 0.12, by = GAME_H * 0.355
    this.staminaBar.fillStyle(0x113311).fillRect(bx, by, bw, bh)
    this.staminaBar.fillStyle(0x33cc33).fillRect(bx, by, bw * (this.state.stamina / this.state.maxStamina), bh)
    // numeric
    this.staminaBar.fillStyle(0)
  }

  private updateThreatBar() {
    this.threatBar.clear()
    const bw = HUD_W * 0.76, bh = 10
    const bx = HUD_W * 0.12, by = GAME_H * 0.495
    this.threatBar.fillStyle(0x330000).fillRect(bx, by, bw, bh)
    const pct = Math.min(1, this.state.threat / 100)
    const color = pct < 0.5 ? 0xaa4400 : pct < 0.8 ? 0xff6600 : 0xff0000
    this.threatBar.fillStyle(color).fillRect(bx, by, bw * pct, bh)
  }

  private drawTopBar() {
    const g = this.add.graphics()
    g.fillStyle(0x050d05, 0.88)
    g.fillRect(HUD_W, 0, GAME_W - HUD_W, TOP_H)
    const cx = HUD_W + (GAME_W - HUD_W) / 2
    const fs = Math.round(GAME_H * 0.018)
    const { act } = this.state
    const zoneName = ZONE[act as 1|2|3].name
    this.topBar = this.add.text(cx, TOP_H / 2, `Día ${this.state.day}  |  ${zoneName}  |  Pasos: ${this.state.stepCount}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color: '#aaccaa'
    }).setOrigin(0.5)
  }

  private drawLog() {
    const logX = HUD_W + 8, logY = GRID_OY + GRID_H * CELL + 4
    const logH = GAME_H - logY - 4
    if (logH < 20) return
    this.logContainer = this.add.container(0, 0)
    this.refreshLog()
  }

  private refreshLog() {
    if (!this.logContainer) return
    this.logContainer.removeAll(true)
    const logX = HUD_W + 8, logY = GRID_OY + GRID_H * CELL + 6
    const fs = Math.round(GAME_H * 0.014)
    const recent = this.state.log.slice(-3)
    recent.forEach((msg, i) => {
      const t = this.add.text(logX, logY + i * (fs + 4), `> ${msg}`, {
        fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color: i === recent.length - 1 ? '#ccffcc' : '#556655'
      })
      this.logContainer.add(t)
    })
  }

  private addLog(msg: string) {
    this.state.log.push(msg)
    if (this.state.log.length > 20) this.state.log.shift()
    this.refreshLog()
  }

  private refreshAll() {
    this.drawEntities()
    this.drawPlayer()
    this.refreshFog()
    this.updateStaminaBar()
    this.updateThreatBar()
    this.topBar.setText(`Día ${this.state.day}  |  ${ZONE[this.state.act as 1|2|3].name}  |  Pasos: ${this.state.stepCount}`)
    this.updateEntitySpritePositions()
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private setupInput() {
    const keys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Record<string, Phaser.Input.Keyboard.Key>

    const moveMap: [string[], number, number][] = [
      [['up', 'w'], 0, -1], [['down', 's'], 0, 1],
      [['left', 'a'], -1, 0], [['right', 'd'], 1, 0],
    ]
    moveMap.forEach(([ks, dx, dy]) => {
      ks.forEach(k => keys[k].on('down', () => this.tryMove(dx, dy)))
    })
    // Wait (space = rest = +3 stamina)
    keys['space'].on('down', () => this.doWait())

    // On-screen direction buttons
    const btnY = GRID_OY + GRID_H * CELL - Math.round(CELL * 1.6)
    const btnX = GRID_OX + GRID_W * CELL - Math.round(CELL * 3.5)
    const bSize = Math.round(CELL * 0.9)
    const dirs: [string, number, number][] = [['↑', 0, -1], ['↓', 0, 1], ['←', -1, 0], ['→', 1, 0]]
    const offsets: [number, number][] = [[bSize, 0], [bSize, bSize * 2], [0, bSize], [bSize * 2, bSize]]
    dirs.forEach(([icon, dx, dy], i) => {
      const [ox, oy] = offsets[i]
      const btn = this.add.text(btnX + ox, btnY + oy, icon, {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(bSize * 0.55)}px`,
        color: '#aaffaa', backgroundColor: '#0a1a0a', padding: { x: Math.round(bSize * 0.18), y: Math.round(bSize * 0.1) }
      }).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setBackgroundColor('#1a3a1a'))
      btn.on('pointerout', () => btn.setBackgroundColor('#0a1a0a'))
      btn.on('pointerdown', () => this.tryMove(dx, dy))
    })

    // Wait button
    const waitBtn = this.add.text(btnX + bSize * 3.2, btnY + bSize, 'Z', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(bSize * 0.45)}px`,
      color: '#aaaaff', backgroundColor: '#0a0a1a', padding: { x: Math.round(bSize * 0.18), y: Math.round(bSize * 0.1) }
    }).setInteractive({ useHandCursor: true })
    waitBtn.on('pointerdown', () => this.doWait())
  }

  // ── Turn Logic ────────────────────────────────────────────────────────────

  private isBlocked(gx: number, gy: number): boolean {
    return gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H
  }

  private hasWildAt(gx: number, gy: number, excludeId: number): boolean {
    return this.state.entities.some(e =>
      e.id !== excludeId && !e.defeated && !e.used &&
      (e.type === 'wild' || e.type === 'alpha') &&
      e.gx === gx && e.gy === gy
    )
  }

  private tryMove(dx: number, dy: number) {
    if (this.blocked) return
    const nx = this.state.px + dx, ny = this.state.py + dy
    if (this.isBlocked(nx, ny)) { this.addLog('Paso bloqueado.'); return }

    this.state.px = nx
    this.state.py = ny
    this.state.stamina = Math.max(0, this.state.stamina - 1)
    this.state.stepCount++

    this.worldTurn()
    this.checkInteraction()

    this.registry.set('safariState', this.state)
    this.refreshAll()
    if (this.state.stamina <= 0 && !this.blocked) this.forceBossFight()
  }

  private doWait() {
    if (this.blocked) return
    this.state.stamina = Math.min(this.state.maxStamina, this.state.stamina + 3)
    this.addLog('Descansas. +3 energía.')
    this.worldTurn()
    this.registry.set('safariState', this.state)
    this.refreshAll()
  }

  private worldTurn() {
  }

  private checkInteraction() {
    const { px, py } = this.state
    for (const e of this.state.entities) {
      if (e.defeated || e.used) continue
      if (e.gx !== px || e.gy !== py) continue

      if (e.type === 'wild' || e.type === 'alpha') {
        this.startWildEncounter(e); return
      }
    }
  }

  private forceBossFight() {
    if (this.blocked) return
    this.blocked = true
    const z = ZONE[this.state.act as 1|2|3]
    this.addLog(`Energia agotada. ¡${z.alphaName} aparece!`)

    // Flash screen red
    const flash = this.add.graphics()
    flash.fillStyle(0xff0000, 0.45).fillRect(0, 0, GAME_W, GAME_H)
    this.tweens.add({ targets: flash, alpha: 0, duration: 1000 })

    // Create alpha entity and trigger battle after short delay
    const alphaEntity: SafariEntity = {
      id: this.state.nextId++, type: 'alpha',
      gx: this.state.px, gy: this.state.py,
      icon: '👑', label: z.alphaName, pokemonName: z.alphaName,
      fleeIn: 999, isAlpha: true, threatValue: 0
    }
    this.time.delayedCall(1200, () => {
      const z2 = ZONE[this.state.act as 1|2|3]
      const act = this.state.act as 1 | 2 | 3
      const alphaFloors: Record<number, number> = { 1: 2, 2: 5, 3: 8 }
      this.run.floor = alphaFloors[act]
      this.registry.set('safariDefeatedEntityId', alphaEntity.id)
      this.registry.set('safariState', this.state)
      this.registry.set('cardRunState', this.run)
      this.registry.set('cardBattlePokemonName', z2.alphaName)
      this.registry.set('cardBattlePokemonAct', act)
      this.registry.set('cardBattleIsElite', false)
      this.registry.set('cardBattleIsBoss', true)
      this.scene.start('CardBattleScene')
    })
  }

  // ── Battles ───────────────────────────────────────────────────────────────

  private startWildEncounter(e: SafariEntity) {
    if (this.blocked) return
    this.blocked = true
    this.addLog(`¡${e.label} apareció!`)
    this.registry.set('safariDefeatedEntityId', e.id)
    this.registry.set('safariState', this.state)
    this.registry.set('cardRunState', this.run)
    this.registry.set('cardBattlePokemonName', e.pokemonName ?? null)
    this.registry.set('cardBattlePokemonAct', this.state.act)
    const isAlpha = e.type === 'alpha'
    const act = this.state.act as 1 | 2 | 3
    // set floor so battle/act transition logic works correctly
    if (isAlpha) {
      const alphaFloors: Record<number, number> = { 1: 2, 2: 5, 3: 8 }
      this.run.floor = alphaFloors[act]
      this.registry.set('cardRunState', this.run)
    }
    this.state.threat = Math.min(100, this.state.threat + (e.threatValue ?? 8))
    this.registry.set('cardBattleIsElite', isAlpha && act !== 3)
    this.registry.set('cardBattleIsBoss', isAlpha)
    this.scene.start('CardBattleScene')
  }

  private startTrainerBattle(e: SafariEntity) {
    if (this.blocked) return
    this.blocked = true
    e.defeated = true
    this.addLog(`¡Combate vs ${e.label}!`)
    this.registry.set('safariDefeatedEntityId', -1)  // -1 = no entity to remove
    this.registry.set('safariState', this.state)
    this.registry.set('cardRunState', this.run)
    this.state.threat = Math.min(100, this.state.threat + (e.threatValue ?? 5))
    this.registry.set('cardBattleIsElite', false)
    this.registry.set('cardBattleIsBoss', false)
    this.scene.start('CardBattleScene')
  }
}
