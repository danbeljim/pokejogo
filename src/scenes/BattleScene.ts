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
  private speedMul: number = 1
  private speedBtn?: Phaser.GameObjects.Text

  constructor() {
    super('BattleScene')
  }

  init(data: BattleData) {
    this.battleData = data
    this.playerIdx = 0
    this.enemyIdx = 0
    this.turnLock = false
    this.speedMul = 1
    this.speedBtn = undefined
    this.actionButtons = []
    this.currentSprites = []
    this.playerSpriteRef = undefined
    this.enemySpriteRef = undefined
    this.playerHpText = undefined
    this.enemyHpText = undefined
    this.playerHpBar = undefined
    this.enemyHpBar = undefined
    this.logText = undefined
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.playerPokemon = this.battleData.playerTeam[this.playerIdx]
    this.enemyPokemon = this.battleData.enemyTeam[this.enemyIdx]

    const title = this.battleData.battleType === 'boss'
      ? `¡Líder de Gimnasio ${this.battleData.gymLeaderName}!`
      : this.battleData.battleType === 'trainer'
      ? '¡Combate contra Entrenador!'
      : '¡Pokémon Salvaje!'

    this.add.text(400, 30, title, {
      font: 'bold 22px Arial',
      color: '#FFD700'
    }).setOrigin(0.5)

    // Enemy (top right) - front sprite
    this.drawSprite(600, 200, this.enemyPokemon, false)
    this.enemyHpText = this.add.text(400, 130,
      `${this.enemyPokemon.name} Nv.${this.enemyPokemon.level}`, {
      font: '16px Arial',
      color: '#ffffff'
    })
    this.enemyHpBar = this.add.graphics()

    // Player (bottom left) - back sprite
    this.drawSprite(200, 380, this.playerPokemon, true)
    this.playerHpText = this.add.text(80, 330,
      `${this.playerPokemon.name} Nv.${this.playerPokemon.level}`, {
      font: '16px Arial',
      color: '#ffffff'
    })
    this.playerHpBar = this.add.graphics()

    this.updateHpBars()

    // Log
    this.logText = this.add.text(400, 460, '¿Qué vas a hacer?', {
      font: '16px Arial',
      color: '#ffffff',
      wordWrap: { width: 700 }
    }).setOrigin(0.5)

    this.drawActions()
    this.drawSpeedToggle()
  }

  private drawSpeedToggle() {
    const render = () => {
      const label = this.speedMul === 1 ? 'Velocidad x1' : 'Velocidad x2'
      const color = this.speedMul === 1 ? '#ffffff' : '#FFD700'
      if (!this.speedBtn) {
        this.speedBtn = this.add.text(720, 30, label, {
          font: 'bold 13px Arial',
          color,
          backgroundColor: '#222',
          padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setDepth(50).setInteractive({ useHandCursor: true })
        this.speedBtn.on('pointerdown', () => {
          this.speedMul = this.speedMul === 1 ? 2 : 1
          render()
        })
      } else {
        this.speedBtn.setText(label).setColor(color)
      }
    }
    render()
  }

  private wait(ms: number, cb: () => void) {
    this.time.delayedCall(ms / this.speedMul, cb)
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
      this.playerHpText.setText(`${this.playerPokemon.name} ${pType} Nv.${this.playerPokemon.level}  HP: ${this.playerPokemon.hp}/${this.playerPokemon.maxHp}`)
      this.playerHpText.setColor(TYPE_COLORS[this.playerPokemon.type])
    }
    if (this.enemyHpText) {
      const eType = `[${this.enemyPokemon.type.toUpperCase()}]`
      this.enemyHpText.setText(`${this.enemyPokemon.name} ${eType} Nv.${this.enemyPokemon.level}  HP: ${this.enemyPokemon.hp}/${this.enemyPokemon.maxHp}`)
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

    const runBtn = this.add.text(700, yStart, '[Huir]', {
      font: '18px Arial',
      color: '#ff8888',
      backgroundColor: '#222',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive()
    runBtn.on('pointerdown', () => {
      if (this.battleData.battleType === 'wild') {
        this.endBattle(false)
      } else {
        this.log("¡No puedes huir de este combate!")
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
    this.log(`¡${this.playerPokemon.name} usó ${move.name}! Hizo ${damage} de daño. ${effLabel}`)
    this.flashSprite(this.enemySpriteRef, 0xff0000)
    this.shakeCamera()
    this.showDamageNumber(600, 200, damage)
    this.updateHpBars()

    if (!this.enemyPokemon.isAlive()) {
      this.wait(900, () => this.handleEnemyFaint())
      return
    }

    this.wait(1000, () => this.enemyTurn())
  }

  private enemyTurn() {
    const moveName = this.enemyPokemon.moves[Math.floor(Math.random() * this.enemyPokemon.moves.length)] || 'Tackle'
    const move = getMove(moveName)
    const { damage, effectiveness } = this.calcDamage(this.enemyPokemon, this.playerPokemon, moveName)
    this.playerPokemon.takeDamage(damage)
    const effLabel = getEffectivenessLabel(effectiveness)
    this.log(`¡${this.enemyPokemon.name} enemigo usó ${move.name}! Hizo ${damage} de daño. ${effLabel}`)
    this.flashSprite(this.playerSpriteRef, 0xff0000)
    this.shakeCamera()
    this.showDamageNumber(200, 380, damage)
    this.updateHpBars()

    if (!this.playerPokemon.isAlive()) {
      this.wait(900, () => this.handlePlayerFaint())
      return
    }

    this.turnLock = false
    this.wait(800, () => this.log('¿Qué vas a hacer?'))
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
    this.wait(150, () => sprite?.clearTint())
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
      duration: 800 / this.speedMul,
      onComplete: () => txt.destroy()
    })
  }

  private handleEnemyFaint() {
    this.log(`¡${this.enemyPokemon.name} enemigo se debilitó!`)
    this.enemyIdx++
    if (this.enemyIdx >= this.battleData.enemyTeam.length) {
      this.wait(1000, () => this.endBattle(true))
    } else {
      this.enemyPokemon = this.battleData.enemyTeam[this.enemyIdx]
      this.wait(1000, () => {
        this.log(`¡El rival envía a ${this.enemyPokemon.name}!`)
        this.clearSprites()
        this.drawSprite(600, 200, this.enemyPokemon, false)
        this.drawSprite(200, 380, this.playerPokemon, true)
        this.updateHpBars()
        this.turnLock = false
      })
    }
  }

  private handlePlayerFaint() {
    this.log(`¡${this.playerPokemon.name} se debilitó!`)
    this.playerIdx++
    const alive = this.battleData.playerTeam.findIndex((p, i) => i >= this.playerIdx && p.isAlive())
    if (alive === -1) {
      this.wait(1000, () => this.endBattle(false))
    } else {
      this.playerIdx = alive
      this.playerPokemon = this.battleData.playerTeam[this.playerIdx]
      this.wait(1000, () => {
        this.log(`¡Adelante, ${this.playerPokemon.name}!`)
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
    this.log(won ? '¡Victoria!' : 'Derrota...')
    this.wait(1500, () => {
      const cb = this.battleData.onComplete
      this.scene.resume('GameScene')
      this.scene.stop()
      cb(won)
    })
  }
}

