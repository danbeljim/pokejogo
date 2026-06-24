import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { spriteKey } from '../entities/PokemonFactory'
import { getMove } from '../data/Moves'
import { getEffectiveness, getEffectivenessLabel, TYPE_COLORS, TYPE_NAMES_ES } from '../data/Types'
import { Item } from '../data/Items'
import { getTraitById } from '../data/RoguelikeData'

export interface BattleData {
  playerTeam: Pokemon[]
  enemyTeam: Pokemon[]
  battleType: 'wild' | 'trainer' | 'boss'
  gymLeaderName?: string
  playerBag?: Item[]
  synergyBonuses?: { atk?: number; def?: number; spd?: number }
  battleSpeed?: 2 | 3
  backgroundKey?: string
  isDouble?: boolean
  onComplete: (won: boolean) => void
}

const XP_PER_LEVEL = 100
const XP_BASE = 50

export default class BattleScene extends Phaser.Scene {
  private battleData!: BattleData
  private playerPokemon!: Pokemon
  private enemyPokemon!: Pokemon
  private playerHpText?: Phaser.GameObjects.Text
  private enemyHpText?: Phaser.GameObjects.Text
  private playerHpBar?: Phaser.GameObjects.Graphics
  private enemyHpBar?: Phaser.GameObjects.Graphics
  private logText?: Phaser.GameObjects.Text
  private turnLock: boolean = false
  private playerIdx: number = 0
  private enemyIdx: number = 0
  private actionButtons: Phaser.GameObjects.Text[] = []
  private speedMul: number = 1
  private currentSprites: Phaser.GameObjects.Image[] = []
  private playerSpriteRef?: Phaser.GameObjects.Image
  private enemySpriteRef?: Phaser.GameObjects.Image
  private lastPlayerMove: string = ''
  private sashUsed: boolean = false
  private moveBtnGfx: Phaser.GameObjects.Graphics[] = []
  private moveBtnZones: Phaser.GameObjects.Zone[] = []
  private moveBtnIcons: Phaser.GameObjects.Image[] = []
  private enemyHpPanel?: Phaser.GameObjects.Graphics
  private playerHpPanel?: Phaser.GameObjects.Graphics
  private enemy2HpPanel?: Phaser.GameObjects.Graphics
  private player2HpPanel?: Phaser.GameObjects.Graphics

  // Double battle state
  private isDouble: boolean = false
  private dblEnemy2: Pokemon | null = null
  private dblPlayer2: Pokemon | null = null
  private dblPlayer2Idx: number = -1
  private playerSprite2?: Phaser.GameObjects.Image
  private enemySprite2?: Phaser.GameObjects.Image
  private player2HpText?: Phaser.GameObjects.Text
  private player2HpBar?: Phaser.GameObjects.Graphics
  private enemy2HpText?: Phaser.GameObjects.Text
  private enemy2HpBar?: Phaser.GameObjects.Graphics
  private targetButtons: Phaser.GameObjects.Text[] = []
  // Double input phases
  private dblPhase: 'p1' | 'p2' | 'resolving' = 'p1'
  private dblP1Move: string = ''
  private dblP1Target: Pokemon | null = null
  private dblP2Move: string = ''
  private dblP2Target: Pokemon | null = null

  // Layout anchors — computed in create()
  private W = 1600
  private H = 1000
  private cx = 800

  constructor() {
    super('BattleScene')
  }

  preload() {
    const typeIds: Record<string, number> = {
      normal: 1, fighting: 2, flying: 3, poison: 4, ground: 5,
      rock: 6, bug: 7, ghost: 8, fire: 10, water: 11, grass: 12,
      electric: 13, psychic: 14, ice: 15, dragon: 16
    }
    Object.entries(typeIds).forEach(([type, id]) => {
      const key = `type-icon-${type}`
      if (!this.textures.exists(key)) {
        this.load.image(key, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${id}.png`)
      }
    })
  }

  init(data: BattleData) {
    this.battleData = data
    this.playerIdx = 0
    this.enemyIdx = 0
    this.turnLock = false
    this.speedMul = data.battleSpeed ?? 2
    this.actionButtons = []
    this.currentSprites = []
    this.playerSpriteRef = undefined
    this.enemySpriteRef = undefined
    this.playerHpText = undefined
    this.enemyHpText = undefined
    this.playerHpBar = undefined
    this.enemyHpBar = undefined
    this.logText = undefined
    this.lastPlayerMove = ''
    this.sashUsed = false
    this.moveBtnGfx = []
    this.moveBtnZones = []
    this.moveBtnIcons = []
    this.enemyHpPanel = undefined
    this.playerHpPanel = undefined
    this.enemy2HpPanel = undefined
    this.player2HpPanel = undefined
    this.isDouble = data.isDouble ?? false
    this.dblEnemy2 = null
    this.dblPlayer2 = null
    this.dblPlayer2Idx = -1
    this.playerSprite2 = undefined
    this.enemySprite2 = undefined
    this.player2HpText = undefined
    this.player2HpBar = undefined
    this.enemy2HpText = undefined
    this.enemy2HpBar = undefined
    this.targetButtons = []
    this.dblPhase = 'p1'
    this.dblP1Move = ''
    this.dblP1Target = null
    this.dblP2Move = ''
    this.dblP2Target = null
  }

  create() {
    this.W = this.scale.width
    this.H = this.scale.height
    this.cx = this.W / 2

    this.cameras.main.setBackgroundColor('#0a0a1a')

    if (this.battleData.backgroundKey && this.textures.exists(this.battleData.backgroundKey)) {
      const bg = this.add.image(this.cx, this.H / 2, this.battleData.backgroundKey)
      bg.setDisplaySize(this.W, this.H).setDepth(-1).setAlpha(0.45)
    }

    const firstAlive = this.battleData.playerTeam.findIndex(p => p.isAlive())
    if (firstAlive !== -1) this.playerIdx = firstAlive
    this.playerPokemon = this.battleData.playerTeam[this.playerIdx]
    this.enemyPokemon = this.battleData.enemyTeam[this.enemyIdx]

    if (this.isDouble) {
      if (this.battleData.enemyTeam.length > 1) this.dblEnemy2 = this.battleData.enemyTeam[1]
      const p2idx = this.battleData.playerTeam.findIndex((p, i) => i >= 1 && p.isAlive())
      if (p2idx !== -1) { this.dblPlayer2 = this.battleData.playerTeam[p2idx]; this.dblPlayer2Idx = p2idx }
    }

    const title = this.battleData.battleType === 'boss'
      ? `¡Líder de Gimnasio ${this.battleData.gymLeaderName}!`
      : this.isDouble
      ? '⚔️ ¡COMBATE DOBLE! 2 vs 2'
      : this.battleData.battleType === 'trainer'
      ? '¡Combate contra Entrenador!'
      : '¡Pokémon Salvaje!'

    this.add.text(this.cx, this.H * 0.04, title, {
      font: `bold ${Math.round(this.H * 0.03)}px Arial`,
      color: '#FFD700'
    }).setOrigin(0.5)

    if (this.isDouble) {
      // 2 enemy sprites top
      this.drawSprite(this.W * 0.58, this.H * 0.28, this.enemyPokemon, false)
      const e1SpriteRef = this.enemySpriteRef
      this.enemyHpPanel = this.add.graphics()
      this.enemyHpText = this.add.text(0, 0, '', { font: `${Math.round(this.H * 0.019)}px Arial`, color: '#ffffff' })
      this.enemyHpBar = this.add.graphics()
      if (this.dblEnemy2) {
        this.enemySprite2 = this.drawSprite(this.W * 0.82, this.H * 0.28, this.dblEnemy2, false)
        this.enemySpriteRef = e1SpriteRef
        this.enemy2HpPanel = this.add.graphics()
        this.enemy2HpText = this.add.text(0, 0, '', { font: `${Math.round(this.H * 0.019)}px Arial`, color: '#ffffff' })
        this.enemy2HpBar = this.add.graphics()
      }
      // 2 player sprites bottom
      this.drawSprite(this.W * 0.18, this.H * 0.48, this.playerPokemon, true)
      this.playerHpPanel = this.add.graphics()
      this.playerHpText = this.add.text(0, 0, '', { font: `${Math.round(this.H * 0.019)}px Arial`, color: '#ffffff' })
      this.playerHpBar = this.add.graphics()
      if (this.dblPlayer2) {
        this.playerSprite2 = this.drawSprite(this.W * 0.38, this.H * 0.48, this.dblPlayer2, true)
        this.player2HpPanel = this.add.graphics()
        this.player2HpText = this.add.text(0, 0, '', { font: `${Math.round(this.H * 0.019)}px Arial`, color: '#ffffff' })
        this.player2HpBar = this.add.graphics()
      }
    } else {
      // Single battle layout
      this.drawSprite(this.W * 0.72, this.H * 0.28, this.enemyPokemon, false)
      this.enemyHpPanel = this.add.graphics()
      this.enemyHpText = this.add.text(this.W * 0.385, this.H * 0.083, '', { font: `${Math.round(this.H * 0.022)}px Arial`, color: '#ffffff' })
      this.enemyHpBar = this.add.graphics()
      this.drawSprite(this.W * 0.28, this.H * 0.48, this.playerPokemon, true)
      this.playerHpPanel = this.add.graphics()
      this.playerHpText = this.add.text(this.W * 0.055, this.H * 0.613, '', { font: `${Math.round(this.H * 0.022)}px Arial`, color: '#ffffff' })
      this.playerHpBar = this.add.graphics()
    }

    this.updateHpBars()

    // Log
    this.logText = this.add.text(this.cx, this.H * 0.7, '¿Qué vas a hacer?', {
      font: `${Math.round(this.H * 0.022)}px Arial`,
      color: '#ffffff',
      wordWrap: { width: this.W * 0.85 }
    }).setOrigin(0.5)

    this.drawActions()
  }

  private wait(ms: number, cb: () => void) {
    this.time.delayedCall(ms / this.speedMul, cb)
  }

  private drawSprite(x: number, y: number, pokemon: Pokemon, back: boolean): Phaser.GameObjects.Image | undefined {
    const key = spriteKey(pokemon.id, false)
    const size = Math.round(this.H * (back ? 0.3 : 0.25))
    if (this.textures.exists(key)) {
      const sprite = this.add.image(x, y, key)
      sprite.setDisplaySize(size, size)
      sprite.setOrigin(0.5, 0.5)
      if (back) sprite.setFlipX(true)
      this.currentSprites.push(sprite)
      if (back) this.playerSpriteRef = sprite
      else this.enemySpriteRef = sprite
      return sprite
    } else {
      const g = this.add.graphics()
      g.fillStyle(back ? 0x4ECDC4 : 0xFF6B6B, 1)
      g.fillCircle(x, y, size * 0.35)
      g.lineStyle(3, 0xffffff, 1)
      g.strokeCircle(x, y, size * 0.35)
      return undefined
    }
  }

  private clearSprites() {
    this.currentSprites.forEach(s => s.destroy())
    this.currentSprites = []
    this.playerSpriteRef = undefined
    this.enemySpriteRef = undefined
  }

  private hexColor(cssColor: string): number {
    return parseInt(cssColor.replace('#', ''), 16)
  }

  private drawHpPanel(
    gfx: Phaser.GameObjects.Graphics,
    px: number, py: number, pw: number, ph: number,
    typeColor: number
  ) {
    gfx.clear()
    gfx.fillStyle(0x080818, 0.88)
    gfx.fillRoundedRect(px, py, pw, ph, 10)
    gfx.lineStyle(2, typeColor, 0.9)
    gfx.strokeRoundedRect(px, py, pw, ph, 10)
  }

  private drawHpBarInside(
    barGfx: Phaser.GameObjects.Graphics,
    bx: number, by: number, bw: number, bh: number,
    pct: number
  ) {
    barGfx.clear()
    barGfx.fillStyle(0x222233, 1)
    barGfx.fillRoundedRect(bx, by, bw, bh, 4)
    const fillColor = pct > 0.5 ? 0x4CAF50 : pct > 0.2 ? 0xFFC107 : 0xF44336
    barGfx.fillStyle(fillColor, 1)
    barGfx.fillRoundedRect(bx, by, Math.max(0, bw * pct), bh, 4)
    // Border
    barGfx.lineStyle(1, 0x444455, 1)
    barGfx.strokeRoundedRect(bx, by, bw, bh, 4)
  }

  private updateHpBars() {
    if (!this.playerHpBar || !this.enemyHpBar) return

    const textH = Math.round(this.H * 0.024)
    const barH = Math.round(this.H * 0.020)
    const barMargin = 14  // px gap between text and HP bar

    if (!this.isDouble) {
      // === ENEMY PANEL (single) ===
      const ePanelX = this.W * 0.365, ePanelY = this.H * 0.070
      const ePanelW = this.W * 0.305, ePanelH = textH + barMargin + barH + 22
      const eTypeHex = this.hexColor(TYPE_COLORS[this.enemyPokemon.type])
      if (this.enemyHpPanel) this.drawHpPanel(this.enemyHpPanel, ePanelX, ePanelY, ePanelW, ePanelH, eTypeHex)

      const eBarX = ePanelX + 12, eBarY = ePanelY + 12 + textH + barMargin
      const eBarW = ePanelW - 24
      const ePct = Math.max(0, this.enemyPokemon.hp / this.enemyPokemon.maxHp)
      this.drawHpBarInside(this.enemyHpBar, eBarX, eBarY, eBarW, barH, ePct)

      // === PLAYER PANEL (single) ===
      const pPanelX = this.W * 0.035, pPanelY = this.H * 0.600
      const pPanelW = this.W * 0.305, pPanelH = textH + barMargin + barH + 22
      const pTypeHex = this.hexColor(TYPE_COLORS[this.playerPokemon.type])
      if (this.playerHpPanel) this.drawHpPanel(this.playerHpPanel, pPanelX, pPanelY, pPanelW, pPanelH, pTypeHex)

      const pBarX = pPanelX + 12, pBarY = pPanelY + 12 + textH + barMargin
      const pBarW = pPanelW - 24
      const pPct = Math.max(0, this.playerPokemon.hp / this.playerPokemon.maxHp)
      this.drawHpBarInside(this.playerHpBar, pBarX, pBarY, pBarW, barH, pPct)

      if (this.enemyHpText) {
        const eType = TYPE_NAMES_ES[this.enemyPokemon.type]
        const eTraits = this.enemyPokemon.traits.map(id => getTraitById(id)?.name || id).join(' · ')
        this.enemyHpText.setText(
          `${this.enemyPokemon.name}  Nv.${this.enemyPokemon.level}  PS: ${this.enemyPokemon.hp}/${this.enemyPokemon.maxHp}` +
          (eTraits ? `  · ${eTraits}` : '')
        )
        this.enemyHpText.setColor(TYPE_COLORS[this.enemyPokemon.type])
      }
      if (this.playerHpText) {
        const pType = TYPE_NAMES_ES[this.playerPokemon.type]
        const pTraits = this.playerPokemon.traits.map(id => getTraitById(id)?.name || id).join(' · ')
        this.playerHpText.setText(
          `${this.playerPokemon.name}  Nv.${this.playerPokemon.level}  PS: ${this.playerPokemon.hp}/${this.playerPokemon.maxHp}` +
          (pTraits ? `  · ${pTraits}` : '')
        )
        this.playerHpText.setColor(TYPE_COLORS[this.playerPokemon.type])
      }
    }

    // Double battle HP bars
    if (this.isDouble) {
      const dBarW = this.W * 0.17
      const dBarH = Math.round(this.H * 0.016)
      const dTextH = Math.round(this.H * 0.019)

      // Enemy 1 (double)
      if (this.enemyHpText && this.enemyHpBar) {
        const ePanelX = this.W * 0.28, ePanelY = this.H * 0.072
        const ePanelW = this.W * 0.26, ePanelH = dTextH + 12 + dBarH + 16
        const eTypeHex = this.hexColor(TYPE_COLORS[this.enemyPokemon.type])
        if (this.enemyHpPanel) this.drawHpPanel(this.enemyHpPanel, ePanelX, ePanelY, ePanelW, ePanelH, eTypeHex)
        const eTraits = this.enemyPokemon.traits.map(id => getTraitById(id)?.name || id).join(' · ')
        this.enemyHpText.setPosition(ePanelX + 8, ePanelY + 8)
        this.enemyHpText.setText(
          `${this.enemyPokemon.name} Nv.${this.enemyPokemon.level}  PS:${this.enemyPokemon.hp}/${this.enemyPokemon.maxHp}` +
          (eTraits ? ` · ${eTraits}` : '')
        )
        this.enemyHpText.setColor(TYPE_COLORS[this.enemyPokemon.type])
        const bx = ePanelX + 8, by = ePanelY + 8 + dTextH + 8
        this.drawHpBarInside(this.enemyHpBar, bx, by, ePanelW - 16, dBarH, Math.max(0, this.enemyPokemon.hp / this.enemyPokemon.maxHp))
      }

      // Enemy 2 (double)
      if (this.dblEnemy2 && this.enemy2HpText && this.enemy2HpBar) {
        const e2PanelX = this.W * 0.575, e2PanelY = this.H * 0.072
        const e2PanelW = this.W * 0.26, e2PanelH = dTextH + 12 + dBarH + 16
        const e2TypeHex = this.hexColor(TYPE_COLORS[this.dblEnemy2.type])
        if (this.enemy2HpPanel) this.drawHpPanel(this.enemy2HpPanel, e2PanelX, e2PanelY, e2PanelW, e2PanelH, e2TypeHex)
        const e2Traits = this.dblEnemy2.traits.map(id => getTraitById(id)?.name || id).join(' · ')
        this.enemy2HpText.setPosition(e2PanelX + 8, e2PanelY + 8)
        this.enemy2HpText.setText(
          `${this.dblEnemy2.name} Nv.${this.dblEnemy2.level}  PS:${this.dblEnemy2.hp}/${this.dblEnemy2.maxHp}` +
          (e2Traits ? ` · ${e2Traits}` : '')
        )
        this.enemy2HpText.setColor(TYPE_COLORS[this.dblEnemy2.type])
        const bx = e2PanelX + 8, by = e2PanelY + 8 + dTextH + 8
        this.drawHpBarInside(this.enemy2HpBar, bx, by, e2PanelW - 16, dBarH, Math.max(0, this.dblEnemy2.hp / this.dblEnemy2.maxHp))
      }

      // Player 1 (double)
      if (this.playerHpText && this.playerHpBar) {
        const pPanelX = this.W * 0.02, pPanelY = this.H * 0.615
        const pPanelW = this.W * 0.24, pPanelH = dTextH + 12 + dBarH + 16
        const pTypeHex = this.hexColor(TYPE_COLORS[this.playerPokemon.type])
        if (this.playerHpPanel) this.drawHpPanel(this.playerHpPanel, pPanelX, pPanelY, pPanelW, pPanelH, pTypeHex)
        const pTraits = this.playerPokemon.traits.map(id => getTraitById(id)?.name || id).join(' · ')
        this.playerHpText.setPosition(pPanelX + 8, pPanelY + 8)
        this.playerHpText.setText(
          `${this.playerPokemon.name} Nv.${this.playerPokemon.level}  PS:${this.playerPokemon.hp}/${this.playerPokemon.maxHp}` +
          (pTraits ? ` · ${pTraits}` : '')
        )
        this.playerHpText.setColor(TYPE_COLORS[this.playerPokemon.type])
        const bx = pPanelX + 8, by = pPanelY + 8 + dTextH + 8
        this.drawHpBarInside(this.playerHpBar, bx, by, pPanelW - 16, dBarH, Math.max(0, this.playerPokemon.hp / this.playerPokemon.maxHp))
      }

      // Player 2 (double)
      if (this.dblPlayer2 && this.player2HpText && this.player2HpBar) {
        const p2PanelX = this.W * 0.28, p2PanelY = this.H * 0.615
        const p2PanelW = this.W * 0.24, p2PanelH = dTextH + 12 + dBarH + 16
        const p2TypeHex = this.hexColor(TYPE_COLORS[this.dblPlayer2.type])
        if (this.player2HpPanel) this.drawHpPanel(this.player2HpPanel, p2PanelX, p2PanelY, p2PanelW, p2PanelH, p2TypeHex)
        const p2Traits = this.dblPlayer2.traits.map(id => getTraitById(id)?.name || id).join(' · ')
        this.player2HpText.setPosition(p2PanelX + 8, p2PanelY + 8)
        this.player2HpText.setText(
          `${this.dblPlayer2.name} Nv.${this.dblPlayer2.level}  PS:${this.dblPlayer2.hp}/${this.dblPlayer2.maxHp}` +
          (p2Traits ? ` · ${p2Traits}` : '')
        )
        this.player2HpText.setColor(TYPE_COLORS[this.dblPlayer2.type])
        const bx = p2PanelX + 8, by = p2PanelY + 8 + dTextH + 8
        this.drawHpBarInside(this.player2HpBar, bx, by, p2PanelW - 16, dBarH, Math.max(0, this.dblPlayer2.hp / this.dblPlayer2.maxHp))
      }
    }
  }

  private clearMoveButtons() {
    this.actionButtons.forEach(b => b.destroy())
    this.actionButtons = []
    this.moveBtnGfx.forEach(g => g.destroy())
    this.moveBtnGfx = []
    this.moveBtnZones.forEach(z => z.destroy())
    this.moveBtnZones = []
    this.moveBtnIcons.forEach(img => img.destroy())
    this.moveBtnIcons = []
  }

  private drawActions() {
    this.clearMoveButtons()

    const actor = (this.isDouble && this.dblPhase === 'p2' && this.dblPlayer2) ? this.dblPlayer2 : this.playerPokemon
    const moves = actor.moves

    if (this.isDouble) {
      const label = this.dblPhase === 'p2'
        ? `¿Qué usa ${actor.name}? (2°)`
        : `¿Qué usa ${actor.name}? (1°)`
      this.log(label)
    }

    const btnW = this.W * 0.168
    const btnH = this.H * 0.092
    const gap = this.W * 0.012
    const totalW = moves.length * btnW + (moves.length - 1) * gap
    const startX = (this.W - totalW) / 2
    const centerY = this.H * 0.835

    moves.forEach((moveName, i) => {
      const move = getMove(moveName)
      const colorStr = TYPE_COLORS[move.type]
      const colorHex = this.hexColor(colorStr)
      const bx = startX + i * (btnW + gap)
      const by = centerY - btnH / 2

      // Card background
      const gfx = this.add.graphics()
      const drawCard = (hovered: boolean) => {
        gfx.clear()
        gfx.fillStyle(hovered ? colorHex : 0x0a0a1e, hovered ? 0.28 : 0.92)
        gfx.fillRoundedRect(bx, by, btnW, btnH, 10)
        gfx.lineStyle(hovered ? 3 : 2, colorHex, hovered ? 1 : 0.85)
        gfx.strokeRoundedRect(bx, by, btnW, btnH, 10)
      }
      drawCard(false)
      this.moveBtnGfx.push(gfx)

      // Type icon from PokeAPI (top-left of card)
      const iconKey = `type-icon-${move.type}`
      if (this.textures.exists(iconKey)) {
        const icon = this.add.image(bx + 10, by + 10, iconKey)
        icon.setOrigin(0, 0).setDisplaySize(54, 20)
        this.moveBtnIcons.push(icon)
      } else {
        // Fallback: colored type pill text
        const pill = this.add.text(bx + 8, by + 8, TYPE_NAMES_ES[move.type], {
          font: `bold ${Math.round(this.H * 0.014)}px Arial`,
          color: colorStr,
          backgroundColor: '#111133',
          padding: { x: 5, y: 2 }
        }).setOrigin(0, 0)
        this.actionButtons.push(pill)
      }

      // Move name + power
      const nameSize = Math.round(this.H * 0.018)
      const labelText = this.add.text(bx + btnW / 2, by + btnH * 0.62,
        `${move.nameEs}\nP: ${move.power}`, {
        font: `bold ${nameSize}px Arial`,
        color: colorStr,
        align: 'center',
        lineSpacing: 2
      }).setOrigin(0.5)
      this.actionButtons.push(labelText)

      // Invisible zone — full card area, handles clicks & hover
      const zone = this.add.zone(bx + btnW / 2, centerY, btnW, btnH)
        .setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => this.playerAttack(moveName))
      zone.on('pointerover', () => {
        drawCard(true)
        labelText.setColor('#ffffff')
      })
      zone.on('pointerout', () => {
        drawCard(false)
        labelText.setColor(colorStr)
      })
      this.moveBtnZones.push(zone)
    })
  }

  private log(msg: string) {
    if (this.logText) this.logText.setText(msg)
  }

  private playerAttack(moveName: string) {
    if (this.isDouble) { this.playerAttackDouble(moveName); return }
    if (this.turnLock) return

    // Choice Band: force repeat last move
    const relic = this.playerPokemon.heldItem
    if (relic === 'choice-band' && this.lastPlayerMove && moveName !== this.lastPlayerMove) {
      this.log(`¡Choice Band fuerza a usar ${this.lastPlayerMove}!`)
      moveName = this.lastPlayerMove
    }
    this.lastPlayerMove = moveName

    this.turnLock = true

    const move = getMove(moveName)
    const { damage, effectiveness } = this.calcDamage(this.playerPokemon, this.enemyPokemon, moveName, true)
    this.enemyPokemon.takeDamage(damage)
    const effLabel = getEffectivenessLabel(effectiveness)
    this.log(`¡${this.playerPokemon.name} usó ${move.nameEs}! Hizo ${damage} de daño. ${effLabel}`)
    this.flashSprite(this.enemySpriteRef, 0xff0000)
    this.shakeCamera()
    this.showDamageNumber(this.W * 0.72, this.H * 0.28, damage)

    // Vampírico trait: heal 15% of damage dealt
    if (damage > 0 && this.playerPokemon.traits.includes('vampirico')) {
      const absorb = Math.max(1, Math.floor(damage * 0.15))
      this.playerPokemon.heal(absorb)
      this.log(`¡${this.playerPokemon.name} vampírico absorbe ${absorb} PS!`)
    }

    // Life Orb recoil
    if (relic === 'life-orb') {
      const recoil = Math.max(1, Math.floor(this.playerPokemon.maxHp * 0.1))
      this.playerPokemon.takeDamage(recoil)
      this.log(`¡Life Orb! ${this.playerPokemon.name} pierde ${recoil} PS.`)
    }

    this.updateHpBars()

    if (!this.enemyPokemon.isAlive()) {
      this.wait(900, () => this.handleEnemyFaint())
      return
    }

    // Player fainted from Life Orb recoil
    if (!this.playerPokemon.isAlive()) {
      this.wait(900, () => this.handlePlayerFaint())
      return
    }

    this.wait(1000, () => this.enemyTurn())
  }

  private enemyTurn() {
    if (this.isDouble) { this.enemyTurnDouble(); return }
    const moveName = this.enemyPokemon.moves[Math.floor(Math.random() * this.enemyPokemon.moves.length)] || 'Tackle'
    const move = getMove(moveName)
    const { damage, effectiveness } = this.calcDamage(this.enemyPokemon, this.playerPokemon, moveName)
    const effLabel = getEffectivenessLabel(effectiveness)

    // Focus Sash: survive fatal hit at 1 HP
    const relic = this.playerPokemon.heldItem
    if (relic === 'focus-sash' && !this.sashUsed && this.playerPokemon.hp === this.playerPokemon.maxHp && damage >= this.playerPokemon.hp) {
      this.playerPokemon.hp = 1
      this.sashUsed = true
      this.log(`¡${this.enemyPokemon.name} usó ${move.nameEs}! ¡Focus Sash aguantó el golpe!`)
    } else {
      this.playerPokemon.takeDamage(damage)
      this.log(`¡${this.enemyPokemon.name} enemigo usó ${move.nameEs}! Hizo ${damage} de daño. ${effLabel}`)
    }

    this.flashSprite(this.playerSpriteRef, 0xff0000)
    this.shakeCamera()
    this.showDamageNumber(this.W * 0.28, this.H * 0.55, damage)
    this.updateHpBars()

    if (!this.playerPokemon.isAlive()) {
      this.wait(900, () => this.handlePlayerFaint())
      return
    }

    // Leftovers: heal 5% maxHp at end of turn
    if (relic === 'leftovers') {
      const heal = Math.max(1, Math.floor(this.playerPokemon.maxHp * 0.05))
      this.playerPokemon.heal(heal)
      this.updateHpBars()
    }

    this.turnLock = false
    this.wait(800, () => this.log('¿Qué vas a hacer?'))
  }

  private calcDamage(attacker: Pokemon, defender: Pokemon, moveName: string, isPlayer = false): { damage: number; effectiveness: number } {
    const move = getMove(moveName)
    const stab = attacker.type === move.type ? 1.5 : 1
    const effectiveness = getEffectiveness(move.type, defender.type)
    const syn = this.battleData.synergyBonuses
    const synAtkMul = (isPlayer && syn?.atk) ? syn.atk : 1
    const synDefMul = (isPlayer && syn?.def) ? syn.def : 1
    const effAtk = attacker.attack * synAtkMul
    const effDef = defender.defense / synDefMul
    const base = (effAtk * move.power * Math.pow(attacker.level, 0.6)) / ((effDef + 20) * 10)
    const variance = 0.85 + Math.random() * 0.3
    const relic = attacker.heldItem
    const relicMul = (relic === 'choice-band' || relic === 'life-orb') ? 1.3 : 1
    const damage = effectiveness === 0 ? 0 : Math.max(1, Math.floor(base * variance * stab * effectiveness * relicMul))
    return { damage, effectiveness }
  }

  private flashSprite(sprite: Phaser.GameObjects.Image | undefined, color: number) {
    if (!sprite) return
    sprite.setTint(color)
    this.wait(150, () => sprite?.clearTint())
  }

  private shakeCamera() {
    this.cameras.main.shake(150, 0.004)
  }

  private showDamageNumber(x: number, y: number, dmg: number) {
    const txt = this.add.text(x, y, `-${dmg}`, {
      font: `bold ${Math.round(this.H * 0.04)}px Arial`,
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5)
    this.tweens.add({
      targets: txt,
      y: y - this.H * 0.08,
      alpha: 0,
      duration: 800 / this.speedMul,
      onComplete: () => txt.destroy()
    })
  }

  private awardXp(enemy: Pokemon, onDone: () => void) {
    const xpGain = enemy.level * XP_BASE
    const alive = this.battleData.playerTeam.filter(p => p.isAlive())
    const share = Math.max(1, Math.floor(xpGain / alive.length))

    const messages: string[] = []
    alive.forEach(p => {
      p.experience += share
      while (p.experience >= p.level * XP_PER_LEVEL) {
        p.experience -= p.level * XP_PER_LEVEL
        const evt = p.levelUp()
        messages.push(`¡${p.name} subió al Nv.${p.level}!`)
        if (evt.evolvedTo) messages.push(`¡${evt.evolvedFrom} evolucionó a ${evt.evolvedTo}!`)
        evt.learnedMoves.forEach(m => messages.push(`¡${p.name} aprendió ${m}!`))
      }
    })

    this.showMessageQueue([...messages], () => {
      this.updateHpBars()
      onDone()
    })
  }

  private showMessageQueue(msgs: string[], onDone: () => void) {
    if (msgs.length === 0) { onDone(); return }
    this.log(msgs[0])
    this.wait(600, () => this.showMessageQueue(msgs.slice(1), onDone))
  }

  private handleEnemyFaint() {
    this.log(`¡${this.enemyPokemon.name} enemigo se debilitó!`)
    const fainted = this.enemyPokemon

    this.wait(300, () => {
      this.awardXp(fainted, () => {
        this.enemyIdx++
        if (this.enemyIdx >= this.battleData.enemyTeam.length) {
          this.wait(300, () => this.endBattle(true))
        } else {
          this.enemyPokemon = this.battleData.enemyTeam[this.enemyIdx]
          this.log(`¡El rival envía a ${this.enemyPokemon.name}!`)
          this.clearSprites()
          this.drawSprite(this.W * 0.72, this.H * 0.28, this.enemyPokemon, false)
          this.drawSprite(this.W * 0.28, this.H * 0.55, this.playerPokemon, true)
          this.updateHpBars()
          this.turnLock = false
        }
      })
    })
  }

  private handlePlayerFaint() {
    this.log(`¡${this.playerPokemon.name} se debilitó!`)
    this.playerIdx++
    this.sashUsed = false
    this.lastPlayerMove = ''
    const alive = this.battleData.playerTeam.findIndex((p, i) => i >= this.playerIdx && p.isAlive())
    if (alive === -1) {
      this.wait(1000, () => this.endBattle(false))
    } else {
      this.playerIdx = alive
      this.playerPokemon = this.battleData.playerTeam[this.playerIdx]
      this.wait(1000, () => {
        this.log(`¡Adelante, ${this.playerPokemon.name}!`)
        this.clearSprites()
        this.drawSprite(this.W * 0.72, this.H * 0.28, this.enemyPokemon, false)
        this.drawSprite(this.W * 0.28, this.H * 0.55, this.playerPokemon, true)
        this.updateHpBars()
        this.drawActions()
        this.turnLock = false
      })
    }
  }

  // ===== DOUBLE BATTLE METHODS =====

  private playerAttackDouble(moveName: string) {
    if (this.turnLock) return

    if (this.dblPhase === 'p1') {
      // Choice Band on P1
      const relic = this.playerPokemon.heldItem
      if (relic === 'choice-band' && this.lastPlayerMove && moveName !== this.lastPlayerMove) moveName = this.lastPlayerMove
      this.dblP1Move = moveName

      const e1alive = this.enemyPokemon.isAlive()
      const e2alive = this.dblEnemy2?.isAlive() ?? false
      if (e1alive && e2alive) {
        this.showTargetButtons('p1')
      } else {
        this.dblP1Target = e1alive ? this.enemyPokemon : (this.dblEnemy2 ?? null)
        this.advanceToP2OrResolve()
      }
      return
    }

    if (this.dblPhase === 'p2') {
      this.dblP2Move = moveName
      const e1alive = this.enemyPokemon.isAlive()
      const e2alive = this.dblEnemy2?.isAlive() ?? false
      if (e1alive && e2alive) {
        this.showTargetButtons('p2')
      } else {
        this.dblP2Target = e1alive ? this.enemyPokemon : (this.dblEnemy2 ?? null)
        this.resolveDoubleTurn()
      }
    }
  }

  private advanceToP2OrResolve() {
    if (this.dblPlayer2?.isAlive()) {
      this.dblPhase = 'p2'
      this.drawActions()
    } else {
      this.resolveDoubleTurn()
    }
  }

  private showTargetButtons(phase: 'p1' | 'p2') {
    this.clearTargetButtons()
    this.actionButtons.forEach(b => b.setAlpha(0.4).disableInteractive())
    const actor = phase === 'p1' ? this.playerPokemon : this.dblPlayer2!
    this.log(`¿A qué Pokémon ataca ${actor.name}?`)

    const btnStyle = {
      font: `bold ${Math.round(this.H * 0.022)}px Arial`,
      color: '#ff4444',
      backgroundColor: '#220000',
      padding: { x: 18, y: 10 }
    }

    const b1 = this.add.text(this.W * 0.30, this.H * 0.86, `⚔ ${this.enemyPokemon.name}`, btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    b1.on('pointerdown', () => {
      this.clearTargetButtons()
      this.actionButtons.forEach(b => b.setAlpha(1).setInteractive({ useHandCursor: true }))
      if (phase === 'p1') { this.dblP1Target = this.enemyPokemon; this.advanceToP2OrResolve() }
      else { this.dblP2Target = this.enemyPokemon; this.resolveDoubleTurn() }
    })

    const b2 = this.add.text(this.W * 0.65, this.H * 0.86, `⚔ ${this.dblEnemy2!.name}`, btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
    b2.on('pointerdown', () => {
      this.clearTargetButtons()
      this.actionButtons.forEach(b => b.setAlpha(1).setInteractive({ useHandCursor: true }))
      if (phase === 'p1') { this.dblP1Target = this.dblEnemy2; this.advanceToP2OrResolve() }
      else { this.dblP2Target = this.dblEnemy2; this.resolveDoubleTurn() }
    })

    this.targetButtons = [b1, b2]
  }

  private clearTargetButtons() {
    this.targetButtons.forEach(b => b.destroy())
    this.targetButtons = []
  }

  private resolveDoubleTurn() {
    this.dblPhase = 'resolving'
    this.turnLock = true
    this.lastPlayerMove = this.dblP1Move

    type Action = {
      attacker: Pokemon
      target: Pokemon
      moveName: string
      isPlayer: boolean
      spriteRef: () => Phaser.GameObjects.Image | undefined
      targetSpriteRef: () => Phaser.GameObjects.Image | undefined
      targetX: number
      targetY: number
    }

    const pickEnemyTarget = (prefer: Pokemon | null, fallback: Pokemon | null): Pokemon | null =>
      prefer?.isAlive() ? prefer : fallback?.isAlive() ? fallback : null

    const actions: Action[] = []

    // P1
    if (this.playerPokemon.isAlive() && this.dblP1Target?.isAlive()) {
      const tgt = this.dblP1Target
      const isE1 = tgt === this.enemyPokemon
      actions.push({
        attacker: this.playerPokemon, target: tgt, moveName: this.dblP1Move, isPlayer: true,
        spriteRef: () => this.playerSpriteRef,
        targetSpriteRef: () => isE1 ? this.enemySpriteRef : this.enemySprite2,
        targetX: isE1 ? this.W * 0.58 : this.W * 0.82, targetY: this.H * 0.28
      })
    }

    // P2
    if (this.dblPlayer2?.isAlive() && this.dblP2Target?.isAlive()) {
      const tgt = this.dblP2Target
      const isE1 = tgt === this.enemyPokemon
      actions.push({
        attacker: this.dblPlayer2, target: tgt, moveName: this.dblP2Move, isPlayer: true,
        spriteRef: () => this.playerSprite2,
        targetSpriteRef: () => isE1 ? this.enemySpriteRef : this.enemySprite2,
        targetX: isE1 ? this.W * 0.58 : this.W * 0.82, targetY: this.H * 0.28
      })
    }

    // E1
    if (this.enemyPokemon.isAlive()) {
      const tgt = pickEnemyTarget(this.playerPokemon, this.dblPlayer2)
      if (tgt) {
        const isP1 = tgt === this.playerPokemon
        actions.push({
          attacker: this.enemyPokemon, target: tgt,
          moveName: this.enemyPokemon.moves[Math.floor(Math.random() * this.enemyPokemon.moves.length)] || 'Tackle',
          isPlayer: false,
          spriteRef: () => this.enemySpriteRef,
          targetSpriteRef: () => isP1 ? this.playerSpriteRef : this.playerSprite2,
          targetX: isP1 ? this.W * 0.18 : this.W * 0.38, targetY: this.H * 0.55
        })
      }
    }

    // E2
    if (this.dblEnemy2?.isAlive()) {
      const tgt = pickEnemyTarget(this.dblPlayer2, this.playerPokemon)
      if (tgt) {
        const isP1 = tgt === this.playerPokemon
        actions.push({
          attacker: this.dblEnemy2, target: tgt,
          moveName: this.dblEnemy2.moves[Math.floor(Math.random() * this.dblEnemy2.moves.length)] || 'Tackle',
          isPlayer: false,
          spriteRef: () => this.enemySprite2,
          targetSpriteRef: () => isP1 ? this.playerSpriteRef : this.playerSprite2,
          targetX: isP1 ? this.W * 0.18 : this.W * 0.38, targetY: this.H * 0.55
        })
      }
    }

    // Sort by speed descending (ties: random)
    actions.sort((a, b) => b.attacker.speed - a.attacker.speed || Math.random() - 0.5)

    const processNext = (queue: typeof actions) => {
      if (queue.length === 0) {
        this.checkEnemyFaintsDouble(() => {
          const anyEnemyAlive = this.enemyPokemon.isAlive() || (this.dblEnemy2?.isAlive() ?? false)
          if (!anyEnemyAlive) { this.wait(800, () => this.endBattle(true)); return }
          this.checkPlayerFaintsDouble(() => {
            const anyPlayerAlive = this.playerPokemon.isAlive() || (this.dblPlayer2?.isAlive() ?? false)
            if (!anyPlayerAlive) { this.wait(800, () => this.endBattle(false)); return }
            const relic = this.playerPokemon.isAlive() ? this.playerPokemon.heldItem : undefined
            if (relic === 'leftovers') { this.playerPokemon.heal(Math.max(1, Math.floor(this.playerPokemon.maxHp * 0.05))); this.updateHpBars() }
            this.dblPhase = 'p1'
            this.dblP1Move = ''; this.dblP1Target = null
            this.dblP2Move = ''; this.dblP2Target = null
            this.turnLock = false
            this.drawActions()
          })
        })
        return
      }

      const act = queue[0]
      if (!act.attacker.isAlive() || !act.target.isAlive()) {
        processNext(queue.slice(1))
        return
      }

      const move = getMove(act.moveName)
      const { damage, effectiveness } = this.calcDamage(act.attacker, act.target, act.moveName, act.isPlayer)
      act.target.takeDamage(damage)
      this.log(`¡${act.attacker.name} usó ${move.nameEs}! ${damage} daño a ${act.target.name}. ${getEffectivenessLabel(effectiveness)}`)
      this.flashSprite(act.targetSpriteRef(), 0xff0000)
      this.shakeCamera()
      this.showDamageNumber(act.targetX, act.targetY, damage)

      if (act.isPlayer && damage > 0 && act.attacker.traits.includes('vampirico')) {
        act.attacker.heal(Math.max(1, Math.floor(damage * 0.15)))
      }
      if (act.isPlayer && act.attacker.heldItem === 'life-orb') {
        act.attacker.takeDamage(Math.max(1, Math.floor(act.attacker.maxHp * 0.1)))
      }
      this.updateHpBars()
      this.wait(800, () => processNext(queue.slice(1)))
    }

    processNext(actions)
  }

  private checkEnemyFaintsDouble(onDone: () => void) {
    const checkE2 = () => {
      if (this.dblEnemy2 && !this.dblEnemy2.isAlive()) {
        this.log(`¡${this.dblEnemy2.name} se debilitó!`)
        const fainted = this.dblEnemy2
        this.dblEnemy2 = null
        if (this.enemySprite2) { this.enemySprite2.destroy(); this.enemySprite2 = undefined }
        this.wait(400, () => this.awardXp(fainted, onDone))
      } else { onDone() }
    }
    if (!this.enemyPokemon.isAlive()) {
      this.log(`¡${this.enemyPokemon.name} se debilitó!`)
      const fainted = this.enemyPokemon
      if (this.enemySpriteRef) { this.enemySpriteRef.destroy(); this.enemySpriteRef = undefined }
      this.wait(400, () => this.awardXp(fainted, checkE2))
    } else { checkE2() }
  }

  private checkPlayerFaintsDouble(onDone: () => void) {
    const checkP1 = () => {
      if (!this.playerPokemon.isAlive()) {
        this.log(`¡${this.playerPokemon.name} se debilitó!`)
        if (this.playerSpriteRef) { this.playerSpriteRef.destroy(); this.playerSpriteRef = undefined }
        const nextIdx = this.battleData.playerTeam.findIndex((p, i) => i > this.playerIdx && p.isAlive() && p !== this.dblPlayer2)
        if (nextIdx !== -1) {
          this.playerIdx = nextIdx
          this.playerPokemon = this.battleData.playerTeam[nextIdx]
          this.wait(500, () => {
            this.log(`¡Adelante, ${this.playerPokemon.name}!`)
            this.playerSpriteRef = this.drawSprite(this.W * 0.18, this.H * 0.48, this.playerPokemon, true)
            this.updateHpBars()
            onDone()
          })
        } else { onDone() }
      } else { onDone() }
    }
    if (this.dblPlayer2 && !this.dblPlayer2.isAlive()) {
      this.log(`¡${this.dblPlayer2.name} se debilitó!`)
      if (this.playerSprite2) { this.playerSprite2.destroy(); this.playerSprite2 = undefined }
      this.dblPlayer2 = null
      this.wait(400, checkP1)
    } else { checkP1() }
  }

  // ===== END DOUBLE BATTLE METHODS =====

  private endBattle(won: boolean) {
    this.log(won ? '¡Victoria!' : 'Derrota...')
    this.wait(400, () => {
      const cb = this.battleData.onComplete
      this.scene.resume('GameScene')
      this.scene.stop()
      cb(won)
    })
  }
}
