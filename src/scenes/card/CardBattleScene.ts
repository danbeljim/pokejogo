import Phaser from 'phaser'
import { CardDef, CardRunState, getCardById, getSynergyForType, getTypeColor } from '../../data/CardData'
import { EnemyDef, getRandomEnemy, getRandomBoss, getEnemyByName } from '../../data/CardEnemies'
import { loadPokeSprites, pokeSpriteKey } from '../../utils/PokeSprite'
import { fetchTCGCardImage } from '../../utils/TcgApi'
import { GAME_W, GAME_H } from '../../main'

type BattlePhase = 'player' | 'enemy' | 'won' | 'lost' | 'animating'

interface StatusEffects {
  poison: number      // damage per turn, turns remaining
  burn: number
  curse: number
  freeze: number      // turns frozen
  paralysis: boolean
  confusion: boolean
  leechSeed: number   // drain per turn
  atk_buff: number    // extra attack added
  heal_self_pending: number
}

const EMPTY_STATUS = (): StatusEffects => ({
  poison: 0, burn: 0, curse: 0, freeze: 0, paralysis: false,
  confusion: false, leechSeed: 0, atk_buff: 0, heal_self_pending: 0
})

interface SynergyState {
  nextFireBurn: boolean
  nextWaterBoost: boolean
  nextGhostBypass: boolean
  nextFightPlus: number
  nextDragonPlus: number
  next2FlyFree: number
  bugHandFree: boolean
  frozen: boolean      // enemy frozen (skip attack)
  paralyzed: boolean   // enemy paralyzed 40%
}

const EMPTY_SYNERGY = (): SynergyState => ({
  nextFireBurn: false, nextWaterBoost: false, nextGhostBypass: false,
  nextFightPlus: 0, nextDragonPlus: 0, next2FlyFree: 0, bugHandFree: false,
  frozen: false, paralyzed: false
})

export default class CardBattleScene extends Phaser.Scene {
  // Run state
  private run!: CardRunState
  private enemy!: EnemyDef

  // Battle state
  private phase: BattlePhase = 'player'
  private playerHp!: number
  private playerShield = 0
  private enemyHp!: number
  private enemyShield = 0
  private energyLeft!: number
  private drawPile: string[] = []
  private hand: string[] = []
  private discardPile: string[] = []
  private turnCount = 0
  private typePlayedThisTurn: Record<string, number> = {}
  private activeSynergies: SynergyState = EMPTY_SYNERGY()
  private playerStatus: StatusEffects = EMPTY_STATUS()
  private enemyStatus: StatusEffects = EMPTY_STATUS()
  private enemyPatternIdx = 0
  private pendingEnemyAtk = 0

  // UI refs
  private handContainers: Phaser.GameObjects.Container[] = []
  private cardY!: number
  private cardBaseYs: number[] = []
  private hpPlayerText!: Phaser.GameObjects.Text
  private hpEnemyText!: Phaser.GameObjects.Text
  private shieldPlayerText!: Phaser.GameObjects.Text
  private shieldEnemyText!: Phaser.GameObjects.Text
  private energyText!: Phaser.GameObjects.Text
  private drawText!: Phaser.GameObjects.Text
  private discardText!: Phaser.GameObjects.Text
  private intentText!: Phaser.GameObjects.Text
  private statusPlayerText!: Phaser.GameObjects.Text
  private statusEnemyText!: Phaser.GameObjects.Text
  private synergyBadges!: Phaser.GameObjects.Container
  private logText!: Phaser.GameObjects.Text
  private logLines: string[] = []
  private hpPlayerBar!: Phaser.GameObjects.Graphics
  private hpEnemyBar!: Phaser.GameObjects.Graphics
  private endTurnBtn!: Phaser.GameObjects.Text
  private enemySprite?: Phaser.GameObjects.Image
  private playerSprite?: Phaser.GameObjects.Image

  // TCG images per hand slot
  private tcgTextures: Map<string, string> = new Map()

  constructor() { super('CardBattleScene') }

  create() {
    this.run = this.registry.get('cardRunState') as CardRunState
    const isBoss   = this.registry.get('cardBattleIsBoss') as boolean
    const isElite  = this.registry.get('cardBattleIsElite') as boolean

    if (!this.run) { this.scene.start('CardMenuScene'); return }

    const specificPokemon = this.registry.get('cardBattlePokemonName') as string | null
    const pokemonAct = this.registry.get('cardBattlePokemonAct') as number ?? 1
    this.registry.remove('cardBattlePokemonName')
    this.registry.remove('cardBattlePokemonAct')
    this.enemy = isBoss
      ? getRandomBoss()
      : specificPokemon
        ? getEnemyByName(specificPokemon, pokemonAct)
        : getRandomEnemy(Math.max(1, this.run.floor))

    this.playerHp = this.run.playerHp
    this.enemyHp  = this.enemy.maxHp
    this.energyLeft = this.run.baseEnergy

    // init deck
    this.drawPile = [...this.run.deck].sort(() => Math.random() - 0.5)
    this.hand = []
    this.discardPile = []

    this.cameras.main.setBackgroundColor('#060610')

    if (!this.textures.exists('ash_trainer')) {
      this.load.image('ash_trainer', 'assets/trainers/red.png')
      this.load.once('complete', () => this.addPlayerSprite())
      this.load.start()
    }

    this.buildUI(isBoss, isElite)
    this.drawHand()
    this.updateEnemyIntent()

    // async: load pokemon sprites for hand cards
    this.loadPokemonSprites()
  }

  private buildUI(isBoss: boolean, isElite: boolean) {
    const W = GAME_W, H = GAME_H

    // enemy area background — compressed to top 32%
    const g = this.add.graphics()
    g.fillStyle(0x0c0c18, 0.9)
    g.fillRect(0, 0, W, H * 0.32)
    g.lineStyle(1, 0x223344)
    g.strokeLineShape(new Phaser.Geom.Line(0, H * 0.32, W, H * 0.32))

    // player area
    g.fillStyle(0x08081a, 0.9)
    g.fillRect(0, H * 0.32, W, H * 0.68)

    // enemy label
    const nameColor = isBoss ? '#FFD700' : (isElite ? '#FF6666' : '#ffffff')
    this.add.text(W * 0.5, H * 0.025, this.enemy.name.toUpperCase(), {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.024)}px`,
      color: nameColor, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5)

    if (isBoss) {
      this.add.text(W * 0.5, H * 0.065, '★ JEFE ★', {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`, color: '#FFD700'
      }).setOrigin(0.5)
    } else if (isElite) {
      this.add.text(W * 0.5, H * 0.065, '💀 ELITE', {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`, color: '#FF6666'
      }).setOrigin(0.5)
    }

    // enemy HP bar
    const eBarX = W * 0.25, eBarY = H * 0.09, eBarW = W * 0.5, eBarH = 16
    this.add.graphics().fillStyle(0x220000).fillRect(eBarX, eBarY, eBarW, eBarH)
    this.hpEnemyBar = this.add.graphics()
    this.hpEnemyText = this.add.text(W * 0.5, eBarY + eBarH + 4, `${this.enemyHp}/${this.enemy.maxHp}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.012)}px`, color: '#ff8888'
    }).setOrigin(0.5)
    this.shieldEnemyText = this.add.text(W * 0.77, eBarY + eBarH / 2, '🛡️ 0', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#88aaff'
    }).setOrigin(0, 0.5)

    // intent
    this.intentText = this.add.text(W * 0.5, H * 0.165, '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#ffcc44',
      backgroundColor: '#1a1a00', padding: { x: 10, y: 6 }
    }).setOrigin(0.5)

    // enemy status
    this.statusEnemyText = this.add.text(W * 0.5, H * 0.225, '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.011)}px`, color: '#cc88ff'
    }).setOrigin(0.5)

    // enemy sprite — loaded dynamically after buildUI (see addEnemySprite)
    this.enemySprite = this.add.image(W * 0.82, H * 0.17, '__DEFAULT').setVisible(false)

    // player sprite (Ash/Red) — placed left side, facing right
    this.playerSprite = this.add.image(W * 0.18, H * 0.24, '__DEFAULT').setVisible(false).setFlipX(true)
    if (this.textures.exists('ash_trainer')) this.addPlayerSprite()

    // player HP area
    const pBarX = W * 0.04, pBarY = H * 0.35, pBarW = W * 0.22, pBarH = 16
    this.add.text(pBarX, pBarY - 16, '❤️ PS', { fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.012)}px`, color: '#888888' })
    this.add.graphics().fillStyle(0x220000).fillRect(pBarX, pBarY, pBarW, pBarH)
    this.hpPlayerBar = this.add.graphics()
    this.hpPlayerText = this.add.text(pBarX, pBarY + pBarH + 4, `${this.playerHp}/${this.run.playerMaxHp}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#ff8888'
    })
    this.shieldPlayerText = this.add.text(pBarX + pBarW + 14, pBarY + pBarH / 2, '🛡️ 0', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#88aaff'
    }).setOrigin(0, 0.5)

    // player status
    this.statusPlayerText = this.add.text(pBarX, pBarY + pBarH + 22, '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.011)}px`, color: '#cc88ff'
    })

    // energy
    const eY = H * 0.355
    this.energyText = this.add.text(W * 0.38, eY, '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.02)}px`, color: '#AAFFDD',
      backgroundColor: '#001122', padding: { x: 12, y: 6 }
    }).setOrigin(0.5)

    // synergy badges container
    this.synergyBadges = this.add.container(W * 0.5, H * 0.405)

    // draw/discard
    this.drawText = this.add.text(W * 0.82, H * 0.355, '🃏 0', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`, color: '#aaddff'
    }).setOrigin(0, 0.5)
    this.discardText = this.add.text(W * 0.92, H * 0.355, '♻ 0', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`, color: '#aa8888'
    }).setOrigin(0, 0.5)

    // END TURN button
    this.endTurnBtn = this.add.text(W * 0.87, H * 0.415, 'FIN TURNO', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.018)}px`,
      color: '#00FFAA', backgroundColor: '#003322', padding: { x: 16, y: 10 },
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    this.endTurnBtn.on('pointerover', () => this.endTurnBtn.setColor('#ffffff'))
    this.endTurnBtn.on('pointerout',  () => this.endTurnBtn.setColor('#00FFAA'))
    this.endTurnBtn.on('pointerdown', () => { if (this.phase === 'player') this.endTurn() })

    // battle log
    this.logText = this.add.text(W * 0.04, H * 0.475, '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.010)}px`,
      color: '#888899', wordWrap: { width: W * 0.55 }
    })

    this.cardY = H * 0.76
    this.refreshUI()

    // Load enemy sprite dynamically
    const enemySpriteKey = pokeSpriteKey(this.enemy.spriteId)
    if (!this.textures.exists(enemySpriteKey)) {
      loadPokeSprites(this, [this.enemy.spriteId]).then(() => {
        if (this.textures.exists(enemySpriteKey)) this.addEnemySprite(enemySpriteKey)
      })
    } else {
      this.addEnemySprite(enemySpriteKey)
    }

  }

  private addPlayerSprite() {
    const W = GAME_W, H = GAME_H
    if (this.playerSprite) { this.playerSprite.destroy() }
    this.playerSprite = this.add.image(W * 0.18, H * 0.24, 'ash_trainer')
    const size = Math.round(H * 0.22)
    this.playerSprite.setDisplaySize(size, size).setFlipX(true)
    try { this.textures.get('ash_trainer').setFilter(Phaser.Textures.FilterMode.NEAREST) } catch {}
  }

  private addEnemySprite(key: string) {
    const W = GAME_W, H = GAME_H
    const existing = this.enemySprite
    if (existing) { existing.destroy() }
    this.enemySprite = this.add.image(W * 0.82, H * 0.17, key)
    const size = Math.round(H * 0.20)
    this.enemySprite.setDisplaySize(size, size)
    try { this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST) } catch {}
  }

  private refreshUI() {
    const W = GAME_W, H = GAME_H
    const eBarX = W * 0.25, eBarY = H * 0.09, eBarW = W * 0.5, eBarH = 16
    this.hpEnemyBar.clear()
    this.hpEnemyBar.fillStyle(0xcc2222)
    this.hpEnemyBar.fillRect(eBarX, eBarY, eBarW * Math.max(0, this.enemyHp / this.enemy.maxHp), eBarH)
    this.hpEnemyText.setText(`${this.enemyHp}/${this.enemy.maxHp}`)
    this.shieldEnemyText.setText(`🛡️ ${this.enemyShield}`)
    this.shieldEnemyText.setAlpha(this.enemyShield > 0 ? 1 : 0.3)

    const pBarX = W * 0.04, pBarY = H * 0.35, pBarW = W * 0.22, pBarH = 16
    this.hpPlayerBar.clear()
    this.hpPlayerBar.fillStyle(0xdd2222)
    this.hpPlayerBar.fillRect(pBarX, pBarY, pBarW * Math.max(0, this.playerHp / this.run.playerMaxHp), pBarH)
    this.hpPlayerText.setText(`${this.playerHp}/${this.run.playerMaxHp}`)
    this.shieldPlayerText.setText(`🛡️ ${this.playerShield}`)
    this.shieldPlayerText.setAlpha(this.playerShield > 0 ? 1 : 0.3)

    const gems = Array(this.run.baseEnergy).fill('⚡').map((e, i) => i < this.energyLeft ? e : '○').join(' ')
    this.energyText.setText(`${gems}  ${this.energyLeft}/${this.run.baseEnergy}`)

    this.drawText.setText(`🃏 ${this.drawPile.length}`)
    this.discardText.setText(`♻ ${this.discardPile.length}`)

    this.statusPlayerText.setText(this.formatStatus(this.playerStatus))
    this.statusEnemyText.setText(this.formatStatus(this.enemyStatus))

    this.updateSynergyBadges()
  }

  private formatStatus(s: StatusEffects): string {
    const parts: string[] = []
    if (s.poison > 0)    parts.push(`☠️x${s.poison}`)
    if (s.burn > 0)      parts.push(`🔥x${s.burn}`)
    if (s.curse > 0)     parts.push(`💜x${s.curse}`)
    if (s.freeze > 0)    parts.push(`❄️x${s.freeze}`)
    if (s.paralysis)     parts.push('⚡PAR')
    if (s.confusion)     parts.push('💫CONF')
    if (s.leechSeed > 0) parts.push(`🌿x${s.leechSeed}`)
    return parts.join('  ')
  }

  private updateSynergyBadges() {
    this.synergyBadges.removeAll(true)
    const counts = this.typePlayedThisTurn
    const triggered = Object.entries(counts).filter(([, c]) => c >= 3)
    triggered.forEach(([type], i) => {
      const syn = getSynergyForType(type)
      if (!syn) return
      const badge = this.add.text(i * 220 - triggered.length * 110, 0, `✨ ${syn.name}`, {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.012)}px`,
        color: syn.color, backgroundColor: '#000022', padding: { x: 8, y: 5 },
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5)
      this.synergyBadges.add(badge)
    })
  }

  private drawHand() {
    // clear old
    this.handContainers.forEach(c => c.destroy())
    this.handContainers = []
    this.cardBaseYs = []

    // draw up to handSize cards
    while (this.hand.length < this.run.handSize && (this.drawPile.length > 0 || this.discardPile.length > 0)) {
      if (this.drawPile.length === 0) {
        this.drawPile = [...this.discardPile].sort(() => Math.random() - 0.5)
        this.discardPile = []
        this.addLog('Mazo barajado.')
      }
      if (this.drawPile.length > 0) this.hand.push(this.drawPile.pop()!)
    }

    const W = GAME_W
    const cardW = Math.round(GAME_H * 0.25)
    const cardH = Math.round(GAME_H * 0.42)
    const gap = Math.round(GAME_H * 0.010)
    const maxWidth = W * 0.95
    const naturalWidth = this.hand.length * cardW + (this.hand.length - 1) * gap
    const step = naturalWidth > maxWidth && this.hand.length > 1
      ? (maxWidth - cardW) / (this.hand.length - 1)
      : cardW + gap
    const totalUsed = cardW + step * (this.hand.length - 1)
    const startX = W / 2 - totalUsed / 2

    this.hand.forEach((cardId, i) => {
      const def = getCardById(cardId)
      if (!def) return
      const x = startX + i * step + cardW / 2
      const y = this.cardY
      this.cardBaseYs[i] = y
      const container = this.createCardVisual(def, x, y, cardW, cardH, i)
      this.handContainers[i] = container
      container.setDepth(i)
    })

    this.refreshUI()
  }

  private createCardVisual(def: CardDef, x: number, y: number, w: number, h: number, handIdx: number, forceInteractive = false): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const hasEnergy = forceInteractive || this.energyLeft >= def.energy
    const canPlay = hasEnergy && (this.phase === 'player' || forceInteractive)
    const typeCol = getTypeColor(def.type)
    const dimAlpha = canPlay ? 1 : 0.45

    // Layout zones — art fills full card, text overlaid at bottom
    const r = 10
    const top     = -h / 2
    const bot     = top + h
    const overlayH = h * 0.32   // gradient overlay height at bottom
    const overlayY = bot - overlayH

    // ── Rarity border color ──────────────────────────────────────────────────
    const rarityCol = def.rarity === 'rare' ? 0xFFD700 : def.rarity === 'uncommon' ? 0x88CCFF : 0x888888
    const borderW   = def.rarity === 'rare' ? 3 : 2

    // ── Card shadow ──────────────────────────────────────────────────────────
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.35)
    shadow.fillRoundedRect(-w/2 + 4, top + 4, w, h, r)
    container.add(shadow)

    // ── Card base background ─────────────────────────────────────────────────
    const bg = this.add.graphics()
    bg.fillStyle(0x0d1020, 1)
    bg.fillRoundedRect(-w/2, top, w, h, r)
    container.add(bg)

    // ── Full-bleed art (cropped to remove original card text at bottom) ───────
    const imgKey = `tcg_${def.pokemonName.toLowerCase()}`
    if (this.textures.exists(imgKey)) {
      const frame = this.textures.get(imgKey).getSourceImage() as HTMLImageElement
      const img = this.add.image(0, 0, imgKey)
      img.setCrop(0, 0, frame.width, Math.floor(frame.height * 0.58))
      img.setDisplaySize(w - 4, h - 4)
      img.setOrigin(0.5, 0.5).setAlpha(dimAlpha)
      container.add(img)
    } else {
      const artBg = this.add.graphics()
      artBg.fillStyle(typeCol, canPlay ? 0.75 : 0.35)
      artBg.fillRoundedRect(-w/2 + 2, top + 2, w - 4, h - 4, r - 2)
      container.add(artBg)
      const pkKey = `poke_${def.pokemonName.toLowerCase().replace(/[^a-z0-9-]/g, '')}`
      if (this.textures.exists(pkKey)) {
        const pkImg = this.add.image(0, top + h * 0.35, pkKey)
        pkImg.setDisplaySize(Math.round(h * 0.6), Math.round(h * 0.6))
        pkImg.setOrigin(0.5).setAlpha(dimAlpha)
        try { this.textures.get(pkKey).setFilter(Phaser.Textures.FilterMode.NEAREST) } catch {}
        container.add(pkImg)
      } else {
        const initial = this.add.text(0, top + h * 0.35, def.pokemonName.charAt(0).toUpperCase(), {
          fontFamily: '"Press Start 2P"', fontSize: `${Math.round(h * 0.35)}px`, color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.22)
        container.add(initial)
      }
    }

    // ── Shimmer on rare/uncommon ─────────────────────────────────────────────
    if (canPlay && def.rarity !== 'common') {
      const shimmer = this.add.graphics()
      shimmer.fillStyle(0xffffff, 0.18)
      shimmer.fillRect(-w/2 + 2, top + 2, w * 0.22, h - 4)
      container.add(shimmer)
      this.tweens.add({
        targets: shimmer, x: w * 1.1, duration: def.rarity === 'rare' ? 1200 : 1800,
        ease: 'Sine.easeInOut', repeat: -1, repeatDelay: def.rarity === 'rare' ? 600 : 1400
      })
    }

    // ── Text overlay (gradient panel at bottom) ──────────────────────────────
    const artBgCol = this.textures.exists(imgKey) ? this.sampleArtColor(imgKey, 0.58) : typeCol
    const panel = this.add.graphics()
    panel.fillGradientStyle(artBgCol, artBgCol, artBgCol, artBgCol, 0, 0, 0.92, 0.92)
    panel.fillRoundedRect(-w/2, overlayY, w, overlayH, { tl: 0, tr: 0, bl: r, br: r })
    container.add(panel)

    // Card name
    const nameFontSize = Math.max(6, Math.round(GAME_H * 0.0125))
    const nameText = this.add.text(0, overlayY + overlayH * 0.18, def.nameEs, {
      fontFamily: '"Press Start 2P"', fontSize: `${nameFontSize}px`,
      color: '#FFFFFF', stroke: '#000000', strokeThickness: 5,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 4, fill: true },
      wordWrap: { width: w - 4 }, align: 'center'
    }).setOrigin(0.5).setAlpha(dimAlpha)
    container.add(nameText)

    // Stat row
    const catIcon = def.category === 'attack' ? '⚔' : def.category === 'defense' ? '🛡' : '✨'
    const statColor = def.category === 'attack' ? '#FFD0D0' : def.category === 'defense' ? '#D0E8FF' : '#D0FFD0'
    const valFontSize = Math.round(GAME_H * 0.018)
    const statStr = def.damage ? `${catIcon} ${def.damage}` : def.shield ? `${catIcon} ${def.shield}` : def.heal ? `${catIcon} +${def.heal}` : def.draw ? `${catIcon} ×${def.draw}` : catIcon
    const statText = this.add.text(0, overlayY + overlayH * 0.50, statStr, {
      fontFamily: '"Press Start 2P"', fontSize: `${valFontSize}px`,
      color: statColor, stroke: '#000000', strokeThickness: 5,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setAlpha(dimAlpha)
    container.add(statText)

    // Effect line (if special)
    if (def.effect) {
      const efFontSize = Math.max(5, Math.round(GAME_H * 0.009))
      const efText = this.add.text(0, overlayY + overlayH * 0.75, def.effect, {
        fontFamily: '"Press Start 2P"', fontSize: `${efFontSize}px`,
        color: '#FFFFFF', stroke: '#000', strokeThickness: 4,
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true },
        wordWrap: { width: w - 4 }, align: 'center'
      }).setOrigin(0.5).setAlpha(dimAlpha)
      container.add(efText)
    }

    // ── Energy badge (top-left) ──────────────────────────────────────────────
    const energyCol = canPlay ? 0x004422 : 0x330000
    const energyRimCol = canPlay ? 0x00FF88 : 0xFF4444
    const eBadgeBg = this.add.graphics()
    eBadgeBg.fillStyle(energyCol, 0.95)
    eBadgeBg.fillCircle(-w/2 + 14, top + 14, 13)
    eBadgeBg.lineStyle(2, energyRimCol, 0.9)
    eBadgeBg.strokeCircle(-w/2 + 14, top + 14, 13)
    const eCostText = this.add.text(-w/2 + 14, top + 14, String(def.energy), {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.015)}px`,
      color: canPlay ? '#AAFFDD' : '#FF6666'
    }).setOrigin(0.5)
    container.add([eBadgeBg, eCostText])

    // ── Rarity badge (top-right) ─────────────────────────────────────────────
    const rarityGlyph = def.rarity === 'rare' ? '★' : def.rarity === 'uncommon' ? '◆' : '●'
    const rarityText = this.add.text(w/2 - 13, top + 13, rarityGlyph, {
      fontSize: `${Math.round(GAME_H * 0.016)}px`,
      color: def.rarity === 'rare' ? '#FFD700' : def.rarity === 'uncommon' ? '#88CCFF' : '#888888'
    }).setOrigin(0.5)
    container.add(rarityText)

    // ── Rarity border ────────────────────────────────────────────────────────
    const border = this.add.graphics()
    const drawBorder = (highlight = false) => {
      border.clear()
      const col = highlight ? 0xFFFFFF : (canPlay ? rarityCol : 0x333333)
      const bw  = highlight ? 3 : borderW
      border.lineStyle(bw, col, highlight ? 1 : (canPlay ? 0.9 : 0.4))
      border.strokeRoundedRect(-w/2, top, w, h, r)
    }
    drawBorder()
    container.add(border)

    // ── Interactivity ────────────────────────────────────────────────────────
    if (canPlay) {
      const hitArea = this.add.rectangle(0, 0, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true })
      container.add(hitArea)
      hitArea.on('pointerover', () => {
        if (!container.active) return
        drawBorder(true)
        container.setDepth(100)
        this.tweens.add({ targets: container, y: container.y - 22, rotation: -0.06, duration: 120, ease: 'Power2' })
        this.showCardTooltip(def)
      })
      hitArea.on('pointerout', () => {
        if (!container.active) return
        drawBorder(false)
        const curIdx = this.handContainers.indexOf(container)
        container.setDepth(curIdx >= 0 ? curIdx : 0)
        const baseY = curIdx >= 0 ? this.cardBaseYs[curIdx] : this.cardY
        this.tweens.add({ targets: container, y: baseY, rotation: 0, duration: 120, ease: 'Power2' })
        this.hideTooltip()
      })
      hitArea.on('pointerdown', () => {
        this.hideTooltip()
        const currentIdx = this.handContainers.indexOf(container)
        if (currentIdx >= 0) this.playCard(currentIdx)
      })
    }

    return container
  }

  private tooltipContainer?: Phaser.GameObjects.Container
  private showCardTooltip(def: CardDef) {
    this.hideTooltip()
    if (!def.effect) return
    const W = GAME_W, H = GAME_H
    this.tooltipContainer = this.add.container(W / 2, H * 0.64)
    const g = this.add.graphics()
    g.fillStyle(0x001133, 0.95)
    g.fillRoundedRect(-220, -30, 440, 60, 8)
    g.lineStyle(1, 0x4466cc)
    g.strokeRoundedRect(-220, -30, 440, 60, 8)
    const t = this.add.text(0, 0, def.effect, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.012)}px`, color: '#ccddff', align: 'center'
    }).setOrigin(0.5)
    this.tooltipContainer.add([g, t])
  }
  private hideTooltip() {
    this.tooltipContainer?.destroy()
    this.tooltipContainer = undefined
  }

  private playCard(handIdx: number) {
    if (this.phase !== 'player') return
    const cardId = this.hand[handIdx]
    const def = getCardById(cardId)
    if (!def) return

    // energy check (flying free, bug free)
    let cost = def.energy
    if (def.type === 'flying' && this.activeSynergies.next2FlyFree > 0) { cost = 0; this.activeSynergies.next2FlyFree-- }
    if (def.type === 'bug' && this.activeSynergies.bugHandFree) cost = 0
    if (this.energyLeft < cost) return

    this.phase = 'animating'
    const container = this.handContainers[handIdx]

    // card flies toward enemy then shrinks away
    const targetX = def.category === 'defense' ? GAME_W * 0.18 : GAME_W * 0.78
    const targetY = def.category === 'defense' ? GAME_H * 0.38 : GAME_H * 0.17
    this.tweens.add({
      targets: container,
      x: targetX, y: targetY,
      alpha: 0, scale: def.category === 'defense' ? 0.5 : 1.4,
      rotation: def.category === 'attack' ? 0.4 : 0,
      duration: 280, ease: 'Power3',
      onComplete: () => {
        container.destroy()
        this.handContainers.splice(handIdx, 1)
        this.hand.splice(handIdx, 1)
        this.cardBaseYs.splice(handIdx, 1)

        this.energyLeft -= cost
        this.discardPile.push(cardId)

        // track type for synergy
        const prev = this.typePlayedThisTurn[def.type] ?? 0
        this.typePlayedThisTurn[def.type] = prev + 1
        if (prev + 1 === 3) this.triggerSynergy(def.type)

        this.applyCardEffect(def)
        this.addLog(`Jugaste: ${def.nameEs}`)
        this.phase = 'player'
        this.repositionHand()
        this.refreshUI()
      }
    })
  }

  private applyCardEffect(def: CardDef) {
    let dmg = def.damage ?? 0
    let shield = def.shield ?? 0

    // synergy modifiers
    if (def.type === 'water' && this.activeSynergies.nextWaterBoost) { dmg = Math.round(dmg * 1.5); this.activeSynergies.nextWaterBoost = false }
    if (def.type === 'fighting') { dmg += this.activeSynergies.nextFightPlus; this.activeSynergies.nextFightPlus = 0 }
    if (def.type === 'dragon') { dmg += this.activeSynergies.nextDragonPlus; this.activeSynergies.nextDragonPlus = 0 }

    if (dmg > 0) this.dealDamageToEnemy(dmg, def.type === 'ghost' && this.activeSynergies.nextGhostBypass)
    if (shield > 0) this.playerShield += shield
    if (def.heal) this.healPlayer(def.heal)
    if (def.draw) for (let i = 0; i < def.draw; i++) this.drawOneCard()

    // fire burn synergy pending
    if (def.type === 'fire' && this.activeSynergies.nextFireBurn) {
      this.applyStatus(this.enemyStatus, 'burn', 4, 3)
      this.activeSynergies.nextFireBurn = false
    }

    // card special effects
    switch (def.effectKey) {
      case 'burn_3_2':       this.applyStatus(this.enemyStatus, 'burn', 3, 2); break
      case 'leech_4':        this.enemyStatus.leechSeed = 4; break
      case 'poison_20pct':   if (Math.random() < 0.2) this.applyStatus(this.enemyStatus, 'poison', 3, 3); break
      case 'toxic_8_scale':  this.applyStatus(this.enemyStatus, 'poison', 8, 4); break
      case 'paralysis_25':   if (Math.random() < 0.25) this.enemyStatus.paralysis = true; break
      case 'confuse_25':     if (Math.random() < 0.25) this.enemyStatus.confusion = true; break
      case 'curse_10_3':     this.applyStatus(this.enemyStatus, 'curse', 10, 3); break
      case 'lifesteal_8':    this.dealDamageToEnemy(8, false); this.healPlayer(8); break
      case 'freeze_20pct':   if (Math.random() < 0.2) this.enemyStatus.freeze = 1; break
      case 'draw_cards':     /* handled by def.draw above */ break
    }
  }

  private triggerSynergy(type: string) {
    const syn = getSynergyForType(type)
    if (!syn) return
    this.addLog(`✨ Sinergia: ${syn.name}!`)
    switch (syn.effectKey) {
      case 'next_fire_burn':     this.activeSynergies.nextFireBurn = true; break
      case 'next_water_boost':   this.activeSynergies.nextWaterBoost = true; break
      case 'heal_15':            this.healPlayer(15); break
      case 'paralysis_40':       if (Math.random() < 0.4) { this.enemyStatus.paralysis = true; this.addLog('¡Enemigo paralizado!') }; break
      case 'draw_2':             this.drawOneCard(); this.drawOneCard(); break
      case 'next_ghost_bypass':  this.activeSynergies.nextGhostBypass = true; break
      case 'freeze_1':           this.activeSynergies.frozen = true; this.enemyStatus.freeze = 1; this.addLog('¡Enemigo congelado!'); break
      case 'next_fight_plus25':  this.activeSynergies.nextFightPlus += 25; break
      case 'shield_20':          this.playerShield += 20; break
      case 'toxic_8':            this.applyStatus(this.enemyStatus, 'poison', 8, 3); break
      case 'energy_plus1':       this.energyLeft = Math.min(this.energyLeft + 1, this.run.baseEnergy + 3); break
      case 'next2_fly_free':     this.activeSynergies.next2FlyFree = 2; break
      case 'next_dragon_plus40': this.activeSynergies.nextDragonPlus += 40; break
      case 'bug_hand_free':      this.activeSynergies.bugHandFree = true; this.drawHand(); break
    }
    this.refreshUI()
  }

  private dealDamageToEnemy(dmg: number, bypassShield = false) {
    if (!bypassShield && this.enemyShield > 0) {
      const absorbed = Math.min(this.enemyShield, dmg)
      this.enemyShield -= absorbed
      dmg -= absorbed
    }
    this.enemyHp = Math.max(0, this.enemyHp - dmg)
    if (this.enemyHp <= 0) this.winBattle()
  }

  private dealDamageToPlayer(dmg: number) {
    if (this.playerShield > 0) {
      const absorbed = Math.min(this.playerShield, dmg)
      this.playerShield -= absorbed
      dmg -= absorbed
    }
    this.playerHp = Math.max(0, this.playerHp - dmg)
    if (this.playerHp <= 0) this.loseBattle()
  }

  private healPlayer(amount: number) {
    this.playerHp = Math.min(this.run.playerMaxHp, this.playerHp + amount)
  }

  private applyStatus(target: StatusEffects, key: 'poison' | 'burn' | 'curse', dmg: number, turns: number) {
    target[key] = dmg
  }

  private drawOneCard() {
    if (this.drawPile.length === 0 && this.discardPile.length > 0) {
      this.drawPile = [...this.discardPile].sort(() => Math.random() - 0.5)
      this.discardPile = []
    }
    if (this.drawPile.length > 0) {
      const cardId = this.drawPile.pop()!
      this.hand.push(cardId)
      const def = getCardById(cardId)
      if (def) {
        const cardW = Math.round(GAME_H * 0.25)
        const cardH = Math.round(GAME_H * 0.42)
        const i = this.hand.length - 1
        const container = this.createCardVisual(def, GAME_W / 2, this.cardY, cardW, cardH, i, true)
        this.handContainers[i] = container
        this.cardBaseYs[i] = this.cardY
        const tcgKey = `tcg_${def.pokemonName.toLowerCase()}`
        if (!this.textures.exists(tcgKey)) {
          this.loadSingleSprite(def.pokemonName, tcgKey)
        }
      }
    }
  }

  private repositionHand() {
    const W = GAME_W
    const cardW = Math.round(GAME_H * 0.25)
    const gap = Math.round(GAME_H * 0.010)
    const maxWidth = W * 0.95
    const naturalWidth = this.hand.length * cardW + (this.hand.length - 1) * gap
    const step = naturalWidth > maxWidth && this.hand.length > 1
      ? (maxWidth - cardW) / (this.hand.length - 1)
      : cardW + gap
    const totalUsed = cardW + step * (this.hand.length - 1)
    const startX = W / 2 - totalUsed / 2

    this.hand.forEach((cardId, i) => {
      const def = getCardById(cardId)
      if (!def || !this.handContainers[i]) return
      const x = startX + i * step + cardW / 2
      this.cardBaseYs[i] = this.cardY
      this.handContainers[i].setDepth(i)
      this.tweens.add({ targets: this.handContainers[i], x, y: this.cardY, duration: 150 })
    })
  }

  private endTurn() {
    if (this.phase !== 'player') return
    this.phase = 'animating'
    this.endTurnBtn.setAlpha(0.4)

    // discard remaining hand
    this.discardPile.push(...this.hand)
    this.hand = []
    this.handContainers.forEach(c => c.destroy())
    this.handContainers = []

    this.time.delayedCall(200, () => this.runEnemyTurn())
  }

  private runEnemyTurn() {
    this.phase = 'enemy'
    const action = this.enemy.pattern[this.enemyPatternIdx % this.enemy.pattern.length]
    this.enemyPatternIdx++

    // tick player status
    this.tickStatusDot(this.playerStatus, 'Player')

    // check if enemy is frozen or paralyzed
    if (this.enemyStatus.freeze > 0) {
      this.enemyStatus.freeze--
      this.addLog('¡Enemigo congelado! No ataca.')
    } else if (this.enemyStatus.paralysis && Math.random() < 0.5) {
      this.addLog('¡Enemigo paralizado! No ataca.')
      this.enemyStatus.paralysis = false
    } else {
      let atkValue = action.value + (this.enemyStatus.atk_buff ?? 0)
      switch (action.type) {
        case 'attack':
          this.addLog(`${this.enemy.name}: ${action.label}`)
          this.dealDamageToPlayer(atkValue)
          break
        case 'defend':
          this.enemyShield += action.value
          this.addLog(`${this.enemy.name}: Escudo +${action.value}`)
          break
        case 'buff':
          if (action.effectKey === 'atk_buff') this.enemyStatus.atk_buff = (this.enemyStatus.atk_buff ?? 0) + action.value
          if (action.effectKey === 'heal_self') this.enemyHp = Math.min(this.enemy.maxHp, this.enemyHp + action.value)
          this.addLog(`${this.enemy.name}: ${action.label}`)
          break
        case 'debuff':
          this.applyPlayerDebuff(action.effectKey ?? '', action.value)
          this.addLog(`${this.enemy.name}: ${action.label}`)
          break
      }
    }

    // tick enemy status dots
    this.tickStatusDot(this.enemyStatus, 'Enemigo')

    // enemy leech seed
    if (this.enemyStatus.leechSeed > 0) {
      this.dealDamageToEnemy(this.enemyStatus.leechSeed, true)
      this.healPlayer(this.enemyStatus.leechSeed)
      this.addLog(`Drenadoras: -${this.enemyStatus.leechSeed} al enemigo`)
    }

    if (this.phase === 'enemy') {
      this.time.delayedCall(400, () => this.startPlayerTurn())
    }
  }

  private applyPlayerDebuff(key: string, value: number) {
    switch (key) {
      case 'poison_dot': this.applyStatus(this.playerStatus, 'poison', value, 3); break
      case 'burn_dot':   this.applyStatus(this.playerStatus, 'burn',   value, 3); break
      case 'curse_dot':  this.applyStatus(this.playerStatus, 'curse',  value, 3); break
      case 'confuse':    this.playerStatus.confusion = true; break
      case 'paralyze':   this.playerStatus.paralysis = true; break
      case 'freeze':     this.playerStatus.freeze = 1; break
    }
  }

  private tickStatusDot(target: StatusEffects, who: string) {
    if (target.poison > 0)  { this.addLog(`${who}: Veneno -${target.poison}`); if (who === 'Player') this.dealDamageToPlayer(target.poison); else this.dealDamageToEnemy(target.poison, true); target.poison = Math.max(0, target.poison - 1) }
    if (target.burn > 0)    { this.addLog(`${who}: Quemadura -${target.burn}`); if (who === 'Player') this.dealDamageToPlayer(target.burn); else this.dealDamageToEnemy(target.burn, true); target.burn = Math.max(0, target.burn - 1) }
    if (target.curse > 0)   { this.addLog(`${who}: Maldición -${target.curse}`); if (who === 'Player') this.dealDamageToPlayer(target.curse); else this.dealDamageToEnemy(target.curse, true); target.curse = Math.max(0, target.curse - 1) }
  }

  private startPlayerTurn() {
    if (this.phase === 'won' || this.phase === 'lost') return
    this.phase = 'player'
    this.turnCount++
    this.energyLeft = this.run.baseEnergy
    this.playerShield = Math.max(0, this.playerShield - 4)
    this.enemyShield  = Math.max(0, this.enemyShield  - 4)
    this.typePlayedThisTurn = {}
    this.activeSynergies.bugHandFree = false
    this.endTurnBtn.setAlpha(1)

    this.updateEnemyIntent()
    this.drawHand()
  }

  private updateEnemyIntent() {
    if (!this.enemy.pattern.length) return
    const next = this.enemy.pattern[this.enemyPatternIdx % this.enemy.pattern.length]
    this.intentText?.setText(`Siguiente: ${next.icon} ${next.label}`)
  }

  private addLog(msg: string) {
    this.logLines.unshift(msg)
    if (this.logLines.length > 5) this.logLines.length = 5
    this.logText?.setText(this.logLines.join('\n'))
  }

  private winBattle() {
    if (this.phase === 'won') return
    this.phase = 'won'
    this.addLog('¡Victoria!')

    // update run state
    const gold = this.enemy.rewardGold
    this.run.playerHp = this.playerHp
    this.run.gold += gold
    this.registry.set('cardRunState', this.run)

    this.time.delayedCall(800, () => {
      const isBoss = this.registry.get('cardBattleIsBoss') as boolean
      if (isBoss) {
        const floor = this.run.floor
        const isFinalBoss = floor === 17
        if (isFinalBoss) {
          this.scene.start('CardDeathScene', { won: true, gold })
        } else {
          this.scene.start('CardActTransitionScene', { gold })
        }
      } else {
        this.scene.start('CardRewardScene')
      }
    })
  }

  private loseBattle() {
    if (this.phase === 'lost') return
    this.phase = 'lost'
    this.addLog('¡Derrota...')
    this.run.playerHp = 0
    this.registry.set('cardRunState', this.run)
    this.time.delayedCall(800, () => {
      this.scene.start('CardDeathScene', { won: false, gold: 0 })
    })
  }

  private async loadSingleSprite(pokemonName: string, key: string) {
    const url = await fetchTCGCardImage(pokemonName)
    if (!url || this.textures.exists(key)) return
    this.load.image(key, url)
    this.load.once('complete', () => {
      const idx = this.hand.findIndex(id => getCardById(id)?.pokemonName.toLowerCase() === pokemonName.toLowerCase())
      if (idx < 0 || !this.handContainers[idx]) return
      const def = getCardById(this.hand[idx])
      if (!def) return
      const cardW = Math.round(GAME_H * 0.25)
      const cardH = Math.round(GAME_H * 0.42)
      const old = this.handContainers[idx]
      const x = old.x, y = old.y
      old.destroy()
      const container = this.createCardVisual(def, x, y, cardW, cardH, idx, true)
      this.handContainers[idx] = container
      container.setDepth(idx)
    })
    this.load.start()
  }

  private async loadPokemonSprites() {
    // Load TCG card images for hand
    const names = [...new Set(this.hand.map(id => getCardById(id)?.pokemonName ?? '').filter(Boolean))]
    for (const name of names) {
      const url = await fetchTCGCardImage(name)
      if (url) {
        const key = `tcg_${name.toLowerCase()}`
        if (!this.textures.exists(key)) {
          this.load.image(key, url)
          this.load.once('complete', () => this.redrawHandWithTCG())
          this.load.start()
        }
      }
    }
  }

  private redrawHandWithTCG() {
    this.handContainers.forEach(c => c.destroy())
    this.handContainers = []
    this.cardBaseYs = []
    const W = GAME_W
    const cardW = Math.round(GAME_H * 0.25)
    const cardH = Math.round(GAME_H * 0.42)
    const gap = Math.round(GAME_H * 0.010)
    const maxWidth = W * 0.95
    const naturalWidth = this.hand.length * cardW + (this.hand.length - 1) * gap
    const step = naturalWidth > maxWidth && this.hand.length > 1
      ? (maxWidth - cardW) / (this.hand.length - 1)
      : cardW + gap
    const totalUsed = cardW + step * (this.hand.length - 1)
    const startX = W / 2 - totalUsed / 2
    this.hand.forEach((cardId, i) => {
      const def = getCardById(cardId)
      if (!def) return
      const x = startX + i * step + cardW / 2
      this.cardBaseYs[i] = this.cardY
      const container = this.createCardVisual(def, x, this.cardY, cardW, cardH, i)
      this.handContainers[i] = container
      container.setDepth(i)
    })
  }

  private sampleArtColor(key: string, cropFraction: number): number {
    try {
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement
      const sampleY = Math.floor(src.height * cropFraction * 0.88)
      const canvas = document.createElement('canvas')
      canvas.width = src.width; canvas.height = src.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(src, 0, 0)
      let r = 0, g = 0, b = 0, n = 0
      const step = Math.max(1, Math.floor(src.width / 6))
      for (let x = step; x < src.width - step; x += step) {
        const px = ctx.getImageData(x, sampleY, 1, 1).data
        r += px[0]; g += px[1]; b += px[2]; n++
      }
      return ((Math.floor(r/n) << 16) | (Math.floor(g/n) << 8) | Math.floor(b/n))
    } catch { return 0x111111 }
  }
}
