import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { spriteKey } from '../entities/PokemonFactory'
import { TYPE_COLORS } from '../data/Types'

export interface CaptureSceneData {
  playerTeam: Pokemon[]
  options: Pokemon[]
  onComplete: (caught?: Pokemon, swappedOut?: number) => void
}

export default class CaptureScene extends Phaser.Scene {
  private payload!: CaptureSceneData
  private selected?: Pokemon
  private root?: Phaser.GameObjects.Container

  constructor() { super('CaptureScene') }

  init(data: CaptureSceneData) {
    this.payload = data
    this.selected = undefined
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.render()
  }

  private render() {
    if (this.root) this.root.destroy()
    this.root = this.add.container(0, 0)

    const teamFull = this.payload.playerTeam.length >= 6
    const header = this.selected
      ? (teamFull ? `¿A qué Pokémon reemplazas con ${this.selected.name}?` : `¿Capturar a ${this.selected.name}?`)
      : 'Elige un Pokémon para capturar:'

    this.root.add(this.add.text(400, 30, header, {
      font: 'bold 20px Arial', color: '#FFD700'
    }).setOrigin(0.5))

    if (!this.selected) {
      this.renderOptions()
    } else if (teamFull) {
      this.renderTeamReplace()
    } else {
      this.renderConfirm()
    }

    const skipBtn = this.add.text(400, 560, '[Saltar]', {
      font: 'bold 14px Arial', color: '#ff8888',
      backgroundColor: '#222', padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    skipBtn.on('pointerdown', () => this.close())
    this.root.add(skipBtn)
  }

  private renderOptions() {
    this.payload.options.forEach((p, i) => {
      const x = 150 + i * 250
      const y = 240

      const bg = this.add.graphics()
      bg.fillStyle(0x222244, 1)
      bg.lineStyle(2, 0x4488FF, 1)
      bg.fillRoundedRect(x - 100, y - 100, 200, 220, 8)
      bg.strokeRoundedRect(x - 100, y - 100, 200, 220, 8)
      this.root!.add(bg)

      const sKey = spriteKey(p.id, false)
      if (this.textures.exists(sKey)) {
        const img = this.add.image(x, y - 30, sKey).setScale(1.8)
        this.root!.add(img)
      }

      this.root!.add(this.add.text(x, y + 30, `${p.name} Nv.${p.level}`, {
        font: 'bold 14px Arial', color: '#ffffff'
      }).setOrigin(0.5))

      this.root!.add(this.add.text(x, y + 50, `[${p.type.toUpperCase()}]`, {
        font: '12px Arial', color: TYPE_COLORS[p.type]
      }).setOrigin(0.5))

      this.root!.add(this.add.text(x, y + 70, `HP ${p.hp}  Atk ${p.attack}  Def ${p.defense}`, {
        font: '10px Arial', color: '#aaccff'
      }).setOrigin(0.5))

      const btn = this.add.text(x, y + 100, '[Capturar]', {
        font: 'bold 14px Arial', color: '#FFD700',
        backgroundColor: '#222', padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => {
        this.selected = p
        this.render()
      })
      this.root!.add(btn)
    })
  }

  private renderConfirm() {
    const p = this.selected!
    const sKey = spriteKey(p.id, false)
    if (this.textures.exists(sKey)) {
      const img = this.add.image(400, 230, sKey).setScale(2.4)
      this.root!.add(img)
    }
    this.root!.add(this.add.text(400, 340, `${p.name} Nv.${p.level} añadido al equipo.`, {
      font: 'bold 16px Arial', color: '#ffffff'
    }).setOrigin(0.5))

    const confirm = this.add.text(400, 400, '[Confirmar]', {
      font: 'bold 16px Arial', color: '#88ff88',
      backgroundColor: '#222', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    confirm.on('pointerdown', () => {
      this.payload.playerTeam.push(p)
      this.payload.onComplete(p)
      this.scene.stop()
      this.scene.resume('GameScene')
    })
    this.root!.add(confirm)
  }

  private renderTeamReplace() {
    this.payload.playerTeam.forEach((mem, i) => {
      const cols = 3
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = 200 + col * 200
      const y = 160 + row * 180

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a3e, 1)
      bg.lineStyle(2, 0x88FF88, 1)
      bg.fillRoundedRect(x - 80, y - 60, 160, 160, 8)
      bg.strokeRoundedRect(x - 80, y - 60, 160, 160, 8)
      this.root!.add(bg)

      const sKey = spriteKey(mem.id, false)
      if (this.textures.exists(sKey)) {
        const img = this.add.image(x, y - 10, sKey).setScale(1.4)
        this.root!.add(img)
      }
      this.root!.add(this.add.text(x, y + 50, `${mem.name} Nv.${mem.level}`, {
        font: '12px Arial', color: '#ffffff'
      }).setOrigin(0.5))

      const btn = this.add.text(x, y + 80, '[Cambiar]', {
        font: 'bold 12px Arial', color: '#FFD700',
        backgroundColor: '#222', padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      btn.on('pointerdown', () => {
        const p = this.selected!
        this.payload.playerTeam[i] = p
        this.payload.onComplete(p, i)
        this.scene.resume('GameScene')
        this.scene.stop()
      })
      this.root!.add(btn)
    })
  }

  private close() {
    this.payload.onComplete()
    this.scene.resume('GameScene')
    this.scene.stop()
  }
}
