import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'

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

    // Enemy (top)
    this.drawPokemon(550, 180, 0xFF6B6B, this.enemyPokemon)
    this.enemyHpText = this.add.text(400, 130,
      `${this.enemyPokemon.name} Lv.${this.enemyPokemon.level}`, {
      font: '16px Arial',
      color: '#ffffff'
    })
    this.enemyHpBar = this.add.graphics()

    // Player (bottom)
    this.drawPokemon(250, 380, 0x4ECDC4, this.playerPokemon)
    this.playerHpText = this.add.text(100, 330,
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

  private drawPokemon(x: number, y: number, color: number, _pokemon: Pokemon) {
    const g = this.add.graphics()
    g.fillStyle(color, 1)
    g.fillCircle(x, y, 40)
    g.lineStyle(3, 0xffffff, 1)
    g.strokeCircle(x, y, 40)
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
      this.playerHpText.setText(`${this.playerPokemon.name} Lv.${this.playerPokemon.level}  HP: ${this.playerPokemon.hp}/${this.playerPokemon.maxHp}`)
    }
    if (this.enemyHpText) {
      this.enemyHpText.setText(`${this.enemyPokemon.name} Lv.${this.enemyPokemon.level}  HP: ${this.enemyPokemon.hp}/${this.enemyPokemon.maxHp}`)
    }
  }

  private drawActions() {
    this.actionButtons.forEach(b => b.destroy())
    this.actionButtons = []

    const moves = this.playerPokemon.moves
    const yStart = 510
    moves.forEach((move, i) => {
      const btn = this.add.text(150 + (i * 180), yStart, `[${move}]`, {
        font: '18px Arial',
        color: '#FFD700',
        backgroundColor: '#222',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setInteractive()

      btn.on('pointerdown', () => this.playerAttack(move))
      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
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

  private playerAttack(move: string) {
    if (this.turnLock) return
    this.turnLock = true

    const damage = this.calcDamage(this.playerPokemon, this.enemyPokemon)
    this.enemyPokemon.takeDamage(damage)
    this.log(`${this.playerPokemon.name} used ${move}! Dealt ${damage} damage!`)
    this.updateHpBars()

    if (!this.enemyPokemon.isAlive()) {
      this.time.delayedCall(900, () => this.handleEnemyFaint())
      return
    }

    this.time.delayedCall(1000, () => this.enemyTurn())
  }

  private enemyTurn() {
    const move = this.enemyPokemon.moves[0] || 'Tackle'
    const damage = this.calcDamage(this.enemyPokemon, this.playerPokemon)
    this.playerPokemon.takeDamage(damage)
    this.log(`${this.enemyPokemon.name} used ${move}! Dealt ${damage} damage!`)
    this.updateHpBars()

    if (!this.playerPokemon.isAlive()) {
      this.time.delayedCall(900, () => this.handlePlayerFaint())
      return
    }

    this.turnLock = false
    this.time.delayedCall(800, () => this.log('What will you do?'))
  }

  private calcDamage(attacker: Pokemon, defender: Pokemon): number {
    const base = (attacker.attack * attacker.level) / (defender.defense + 10)
    const variance = 0.85 + Math.random() * 0.3
    return Math.max(1, Math.floor(base * variance))
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
