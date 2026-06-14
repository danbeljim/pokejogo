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
  battleSpeed?: 1 | 2
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

  // Layout anchors — computed in create()
  private W = 1600
  private H = 1000
  private cx = 800

  constructor() {
    super('BattleScene')
  }

  init(data: BattleData) {
    this.battleData = data
    this.playerIdx = 0
    this.enemyIdx = 0
    this.turnLock = false
    this.speedMul = data.battleSpeed ?? 1
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
  }

  create() {
    this.W = this.scale.width
    this.H = this.scale.height
    this.cx = this.W / 2

    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.playerPokemon = this.battleData.playerTeam[this.playerIdx]
    this.enemyPokemon = this.battleData.enemyTeam[this.enemyIdx]

    const title = this.battleData.battleType === 'boss'
      ? `¡Líder de Gimnasio ${this.battleData.gymLeaderName}!`
      : this.battleData.battleType === 'trainer'
      ? '¡Combate contra Entrenador!'
      : '¡Pokémon Salvaje!'

    this.add.text(this.cx, this.H * 0.04, title, {
      font: `bold ${Math.round(this.H * 0.03)}px Arial`,
      color: '#FFD700'
    }).setOrigin(0.5)

    // Enemy sprite (top right)
    this.drawSprite(this.W * 0.72, this.H * 0.28, this.enemyPokemon, false)

    // Enemy info anchored above sprite (top-left of battle area)
    this.enemyHpText = this.add.text(this.W * 0.38, this.H * 0.12, '', {
      font: `${Math.round(this.H * 0.022)}px Arial`,
      color: '#ffffff'
    })
    this.enemyHpBar = this.add.graphics()

    // Player sprite (bottom left)
    this.drawSprite(this.W * 0.28, this.H * 0.48, this.playerPokemon, true)

    // Player info anchored below sprite
    this.playerHpText = this.add.text(this.W * 0.05, this.H * 0.64, '', {
      font: `${Math.round(this.H * 0.022)}px Arial`,
      color: '#ffffff'
    })
    this.playerHpBar = this.add.graphics()


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

  private updateHpBars() {
    if (!this.playerHpBar || !this.enemyHpBar) return

    const barW = this.W * 0.2
    const barH = Math.round(this.H * 0.018)

    const textH = Math.round(this.H * 0.026)

    // Player HP bar — just below playerHpText
    const pBarX = this.W * 0.05
    const pBarY = this.H * 0.64 + textH + 4
    this.playerHpBar.clear()
    this.playerHpBar.fillStyle(0x333333, 1)
    this.playerHpBar.fillRect(pBarX, pBarY, barW, barH)
    const pPct = Math.max(0, this.playerPokemon.hp / this.playerPokemon.maxHp)
    this.playerHpBar.fillStyle(pPct > 0.5 ? 0x4CAF50 : pPct > 0.2 ? 0xFFC107 : 0xF44336, 1)
    this.playerHpBar.fillRect(pBarX, pBarY, barW * pPct, barH)

    // Enemy HP bar — just below enemyHpText
    const eBarX = this.W * 0.38
    const eBarY = this.H * 0.12 + textH + 4
    this.enemyHpBar.clear()
    this.enemyHpBar.fillStyle(0x333333, 1)
    this.enemyHpBar.fillRect(eBarX, eBarY, barW, barH)
    const ePct = Math.max(0, this.enemyPokemon.hp / this.enemyPokemon.maxHp)
    this.enemyHpBar.fillStyle(ePct > 0.5 ? 0x4CAF50 : ePct > 0.2 ? 0xFFC107 : 0xF44336, 1)
    this.enemyHpBar.fillRect(eBarX, eBarY, barW * ePct, barH)

    if (this.playerHpText) {
      const pType = `[${TYPE_NAMES_ES[this.playerPokemon.type]}]`
      const pTraits = this.playerPokemon.traits.map(id => getTraitById(id)?.name || id).join(' · ')
      this.playerHpText.setText(
        `${this.playerPokemon.name} ${pType} Nv.${this.playerPokemon.level}` +
        `  HP: ${this.playerPokemon.hp}/${this.playerPokemon.maxHp}` +
        (pTraits ? `\n${pTraits}` : '')
      )
      this.playerHpText.setColor(TYPE_COLORS[this.playerPokemon.type])
    }
    if (this.enemyHpText) {
      const eType = `[${TYPE_NAMES_ES[this.enemyPokemon.type]}]`
      const eTraits = this.enemyPokemon.traits.map(id => getTraitById(id)?.name || id).join(' · ')
      this.enemyHpText.setText(
        `${this.enemyPokemon.name} ${eType} Nv.${this.enemyPokemon.level}` +
        `  HP: ${this.enemyPokemon.hp}/${this.enemyPokemon.maxHp}` +
        (eTraits ? `\n${eTraits}` : '')
      )
      this.enemyHpText.setColor(TYPE_COLORS[this.enemyPokemon.type])
    }

  }

  private drawActions() {
    this.actionButtons.forEach(b => b.destroy())
    this.actionButtons = []

    const moves = this.playerPokemon.moves
    const yStart = this.H * 0.78
    const btnW = this.W * 0.14
    const startX = this.W * 0.08

    moves.forEach((moveName, i) => {
      const move = getMove(moveName)
      const color = TYPE_COLORS[move.type]
      const x = startX + i * (btnW + this.W * 0.015)
      const btn = this.add.text(x, yStart, `${move.nameEs}\n[${TYPE_NAMES_ES[move.type]}] P:${move.power}`, {
        font: `${Math.round(this.H * 0.018)}px Arial`,
        color,
        backgroundColor: '#222',
        padding: { x: 14, y: 8 },
        align: 'center'
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerdown', () => this.playerAttack(moveName))
      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor(color))
      this.actionButtons.push(btn)
    })


  }

  private log(msg: string) {
    if (this.logText) this.logText.setText(msg)
  }

  private playerAttack(moveName: string) {
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
    const base = (effAtk * move.power * attacker.level) / ((effDef + 20) * 80)
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
    this.wait(1200, () => this.showMessageQueue(msgs.slice(1), onDone))
  }

  private handleEnemyFaint() {
    this.log(`¡${this.enemyPokemon.name} enemigo se debilitó!`)
    const fainted = this.enemyPokemon

    this.wait(600, () => {
      this.awardXp(fainted, () => {
        this.enemyIdx++
        if (this.enemyIdx >= this.battleData.enemyTeam.length) {
          this.wait(800, () => this.endBattle(true))
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

  private endBattle(won: boolean) {
    this.log(won ? '¡Victoria!' : 'Derrota...')
    this.wait(1500, () => {
      const cb = this.battleData.onComplete
      this.scene.resume('GameScene')
      this.scene.stop()
      cb(won)
    })
  }
}
