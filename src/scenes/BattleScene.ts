import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { spriteKey } from '../entities/PokemonFactory'
import { getMove } from '../data/Moves'
import { getEffectiveness, getEffectivenessLabel, TYPE_COLORS } from '../data/Types'

export interface BattleData {
  playerTeam: Pokemon[]
  enemyTeam: Pokemon[]
  battleType: 'wild' | 'trainer' | 'boss'
  gymLeaderName?: string
  onComplete: (won: boolean) => void
}

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

  constructor() {
    super('BattleScene')
  }

  init(data: BattleData) {
    this.battleData = data
    this.playerIdx = 0
    this.enemyIdx = 0
    this.turnLock = false
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.playerPokemon = this.battleData.playerTeam[this.playerIdx]
    this.enemyPokemon = this.battleData.enemyTeam[this.enemyIdx]

    const title = this.battleData.battleType === 'boss'
      ? `Gym Leader ${this.battleData.gymLeaderName}!`
      : this.battleData.battleType === 'trainer'
      ? 'Trainer Battle!'
      : 'Wild Pokémon Battle!'

    this.add.text(400, 30, title, {
      font: 'bold 22px Arial',
      color: '#FFD700'
    }).setOrigin(0.5)

    // Enemy (top right) - front sprite
    this.drawSprite(600, 200, this.enemyPokemon, false)
    this.enemyHpText = this.add.text(400, 130,
      `${this.enemyPokemon.name} Lv.${this.enemyPokemon.level}`, {
      font: '16px Arial',
      color: '#ffffff'
    })
    this.enemyHpBar = this.add.graphics()

    // Player (bottom left) - back sprite
    this.drawSprite(200, 380, this.playerPokemon, true)
    this.playerHpText = this.add.text(80, 330,
      `${this.playerPokemon.name} Lv.${this.playerPokemon.level}`, {
      font: '16px Arial',
      color: '#ffffff'
    })
    this.playerHpBar = this.add.graphics()

    this.updateHpBars()

    // Log
    this.logText = this.add.text(400, 460, 'What will you do?', {
      font: '16px Arial',
      color: '#ffffff',
      wordWrap: { width: 700 }
    }).setOrigin(0.5)

    this.drawActions()
  }

  private currentSprites: Phaser.GameObjects.Image[] = []
  private playerSpriteRef?: Phaser.GameObjects.Image
  private enemySpriteRef?: Phaser.GameObjects.Image

  private drawSprite(x: number, y: number, pokemon: Pokemon, back: boolean): Phaser.GameObjects.Image | undefined {
    const key = spriteKey(pokemon.id, back)
    if (this.textures.exists(key)) {
      const sprite = this.add.image(x, y, key)
      sprite.setScale(3)
      sprite.setOrigin(0.5, 0.5)
      this.currentSprites.push(sprite)
      if (back) this.playerSpriteRef = sprite
      else this.enemySpriteRef = sprite
      return sprite
    } else {
      const g = this.add.graphics()
      g.fillStyle(back ? 0x4ECDC4 : 0xFF6B6B, 1)
      g.fillCircle(x, y, 40)
      g.lineStyle(3, 0xffffff, 1)
      g.strokeCircle(x, y, 40)
      return undefined
    }
  }

  private clearSprites() {
    this.currentSprites.forEach(s => s.destroy())
    this.currentSprites = []
  }

  private updateHpBars() {
    if (!this.playerHpBar || !this.enemyHpBar) return

    this.playerHpBar.clear()
    this.playerHpBar.fillStyle(0x333333, 1)
    this.playerHpBar.fillRect(100, 350, 200, 12)
    const pPct = this.playerPokemon.hp / this.playerPokemon.maxHp
    this.playerHpBar.fillStyle(pPct > 0.5 ? 0x4CAF50 : pPct > 0.2 ? 0xFFC107 : 0xF44336, 1)
    this.playerHpBar.fillRect(100, 350, 200 * pPct, 12)

    this.enemyHpBar.clear()
    this.enemyHpBar.fillStyle(0x333333, 1)
    this.enemyHpBar.fillRect(400, 150, 200, 12)
    const ePct = this.enemyPokemon.hp / this.enemyPokemon.maxHp
    this.enemyHpBar.fillStyle(ePct > 0.5 ? 0x4CAF50 : ePct > 0.2 ? 0xFFC107 : 0xF44336, 1)
    this.enemyHpBar.fillRect(400, 150, 200 * ePct, 12)

    if (this.playerHpText) {
      const pType = `[${this.playerPokemon.type.toUpperCase()}]`
      this.playerHpText.setText(`${this.playerPokemon.name} ${pType} Lv.${this.playerPokemon.level}  HP: ${this.playerPokemon.hp}/${this.playerPokemon.maxHp}`)
      this.playerHpText.setColor(TYPE_COLORS[this.playerPokemon.type])
    }
    if (this.enemyHpText) {
      const eType = `[${this.enemyPokemon.type.toUpperCase()}]`
      this.enemyHpText.setText(`${this.enemyPokemon.name} ${eType} Lv.${this.enemyPokemon.level}  HP: ${this.enemyPokemon.hp}/${this.enemyPokemon.maxHp}`)
      this.enemyHpText.setColor(TYPE_COLORS[this.enemyPokemon.type])
    }
  }

  private drawActions() {
    this.actionButtons.forEach(b => b.destroy())
    this.actionButtons = []

    const moves = this.playerPokemon.moves
    const yStart = 510
    moves.forEach((moveName, i) => {
      const move = getMove(moveName)
      const color = TYPE_COLORS[move.type]
      const btn = this.add.text(140 + (i * 170), yStart, `${move.name}\n[${move.type}] P:${move.power}`, {
        font: '13px Arial',
        color: color,
        backgroundColor: '#222',
        padding: { x: 10, y: 6 },
        align: 'center'
      }).setOrigin(0.5).setInteractive()

      btn.on('pointerdown', () => this.playerAttack(moveName))
      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor(color))
      this.actionButtons.push(btn)
    })

    const runBtn = this.add.text(700, yStart, '[Run]', {
      font: '18px Arial',
      color: '#ff8888',
      backgroundColor: '#222',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive()
    runBtn.on('pointerdown', () => {
      if (this.battleData.battleType === 'wild') {
        this.endBattle(false)
      } else {
        this.log("Can't run from this battle!")
      }
    })
    this.actionButtons.push(runBtn)
  }

  private log(msg: string) {
    if (this.logText) this.logText.setText(msg)
  }

  private playerAttack(moveName: string) {
    if (this.turnLock) return
    this.turnLock = true

    const move = getMove(moveName)
    const { damage, effectiveness } = this.calcDamage(this.playerPokemon, this.enemyPokemon, moveName)
    this.enemyPokemon.takeDamage(damage)
    const effLabel = getEffectivenessLabel(effectiveness)
    this.log(`${this.playerPokemon.name} used ${move.name}! Dealt ${damage} damage! ${effLabel}`)
    this.flashSprite(this.enemySpriteRef, 0xff0000)
    this.shakeCamera()
    this.showDamageNumber(600, 200, damage)
    this.updateHpBars()

    if (!this.enemyPokemon.isAlive()) {
      this.time.delayedCall(900, () => this.handleEnemyFaint())
      return
    }

    this.time.delayedCall(1000, () => this.enemyTurn())
  }

  private enemyTurn() {
    const moveName = this.enemyPokemon.moves[Math.floor(Math.random() * this.enemyPokemon.moves.length)] || 'Tackle'
    const move = getMove(moveName)
    const { damage, effectiveness } = this.calcDamage(this.enemyPokemon, this.playerPokemon, moveName)
    this.playerPokemon.takeDamage(damage)
    const effLabel = getEffectivenessLabel(effectiveness)
    this.log(`${this.enemyPokemon.name} used ${move.name}! Dealt ${damage} damage! ${effLabel}`)
    this.flashSprite(this.playerSpriteRef, 0xff0000)
    this.shakeCamera()
    this.showDamageNumber(200, 380, damage)
    this.updateHpBars()

    if (!this.playerPokemon.isAlive()) {
      this.time.delayedCall(900, () => this.handlePlayerFaint())
      return
    }

    this.turnLock = false
    this.time.delayedCall(800, () => this.log('What will you do?'))
  }

  private calcDamage(attacker: Pokemon, defender: Pokemon, moveName: string): { damage: number; effectiveness: number } {
    const move = getMove(moveName)
    const stab = attacker.type === move.type ? 1.5 : 1
    const effectiveness = getEffectiveness(move.type, defender.type)
    const base = (attacker.attack * move.power * attacker.level) / ((defender.defense + 10) * 50)
    const variance = 0.85 + Math.random() * 0.3
    const damage = effectiveness === 0 ? 0 : Math.max(1, Math.floor(base * variance * stab * effectiveness))
    return { damage, effectiveness }
  }

  private flashSprite(sprite: Phaser.GameObjects.Image | undefined, color: number) {
    if (!sprite) return
    sprite.setTint(color)
    this.time.delayedCall(150, () => sprite?.clearTint())
  }

  private shakeCamera() {
    this.cameras.main.shake(150, 0.005)
  }

  private showDamageNumber(x: number, y: number, dmg: number) {
    const txt = this.add.text(x, y, `-${dmg}`, {
      font: 'bold 28px Arial',
      color: '#ff4444',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5)
    this.tweens.add({
      targets: txt,
      y: y - 60,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy()
    })
  }

  private handleEnemyFaint() {
    this.log(`${this.enemyPokemon.name} fainted!`)
    this.enemyIdx++
    if (this.enemyIdx >= this.battleData.enemyTeam.length) {
      this.time.delayedCall(1000, () => this.endBattle(true))
    } else {
      this.enemyPokemon = this.battleData.enemyTeam[this.enemyIdx]
      this.time.delayedCall(1000, () => {
        this.log(`Enemy sent out ${this.enemyPokemon.name}!`)
        this.clearSprites()
        this.drawSprite(600, 200, this.enemyPokemon, false)
        this.drawSprite(200, 380, this.playerPokemon, true)
        this.updateHpBars()
        this.turnLock = false
      })
    }
  }

  private handlePlayerFaint() {
    this.log(`${this.playerPokemon.name} fainted!`)
    this.playerIdx++
    const alive = this.battleData.playerTeam.findIndex((p, i) => i >= this.playerIdx && p.isAlive())
    if (alive === -1) {
      this.time.delayedCall(1000, () => this.endBattle(false))
    } else {
      this.playerIdx = alive
      this.playerPokemon = this.battleData.playerTeam[this.playerIdx]
      this.time.delayedCall(1000, () => {
        this.log(`You sent out ${this.playerPokemon.name}!`)
        this.clearSprites()
        this.drawSprite(600, 200, this.enemyPokemon, false)
        this.drawSprite(200, 380, this.playerPokemon, true)
        this.updateHpBars()
        this.drawActions()
        this.turnLock = false
      })
    }
  }

  private endBattle(won: boolean) {
    this.log(won ? 'Victory!' : 'Defeat...')
    this.time.delayedCall(1500, () => {
      this.battleData.onComplete(won)
      this.scene.stop()
      this.scene.resume('GameScene')
    })
  }
}
