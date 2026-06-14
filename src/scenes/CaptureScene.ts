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

  private get W() { return this.scale.width }
  private get H() { return this.scale.height }
  private get cx() { return this.W / 2 }

  private render() {
    if (this.root) this.root.destroy()
    this.root = this.add.container(0, 0)

    const teamFull = this.payload.playerTeam.length >= 6
    const header = this.selected
      ? (teamFull ? `¿A qué Pokémon reemplazas con ${this.selected.name}?` : `¿Capturar a ${this.selected.name}?`)
      : 'Elige un Pokémon para capturar:'

    this.root.add(this.add.text(this.cx, this.H * 0.06, header, {
      font: `bold ${Math.round(this.H * 0.03)}px Arial`,
      color: '#FFD700'
    }).setOrigin(0.5))

    if (!this.selected) {
      this.renderOptions()
    } else if (teamFull) {
      this.renderTeamReplace()
    } else {
      this.renderConfirm()
    }

    const skipBtn = this.add.text(this.cx, this.H * 0.88, '[Saltar]', {
      font: `bold ${Math.round(this.H * 0.022)}px Arial`,
      color: '#ff8888',
      backgroundColor: '#222',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    skipBtn.on('pointerdown', () => this.close())
    this.root.add(skipBtn)
  }

  private renderOptions() {
    const options = this.payload.options
    const cardW = Math.round(this.W * 0.14)
    const cardH = Math.round(this.H * 0.42)
    const gap = Math.round(this.W * 0.04)
    const totalW = cardW * options.length + gap * (options.length - 1)
    const startX = this.cx - totalW / 2 + cardW / 2
    const cardCY = this.H * 0.5
    const spriteSize = Math.round(this.H * 0.12)

    options.forEach((p, i) => {
      const x = startX + i * (cardW + gap)
      const y = cardCY

      const bg = this.add.graphics()
      bg.fillStyle(0x222244, 1)
      bg.lineStyle(2, 0x4488FF, 1)
      bg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10)
      bg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10)
      this.root!.add(bg)

      const sKey = spriteKey(p.id, false)
      if (this.textures.exists(sKey)) {
        const img = this.add.image(x, y - cardH * 0.22, sKey).setDisplaySize(spriteSize, spriteSize)
        this.root!.add(img)
      }

      this.root!.add(this.add.text(x, y + cardH * 0.06, `${p.name} Nv.${p.level}`, {
        font: `bold ${Math.round(this.H * 0.022)}px Arial`, color: '#ffffff'
      }).setOrigin(0.5))

      this.root!.add(this.add.text(x, y + cardH * 0.17, `[${p.type.toUpperCase()}]`, {
        font: `${Math.round(this.H * 0.018)}px Arial`, color: TYPE_COLORS[p.type]
      }).setOrigin(0.5))

      this.root!.add(this.add.text(x, y + cardH * 0.27, `HP ${p.hp}  Atk ${p.attack}  Def ${p.defense}`, {
        font: `${Math.round(this.H * 0.015)}px Arial`, color: '#aaccff'
      }).setOrigin(0.5))

      const btn = this.add.text(x, y + cardH * 0.38, '[Capturar]', {
        font: `bold ${Math.round(this.H * 0.02)}px Arial`, color: '#FFD700',
        backgroundColor: '#222', padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => { this.selected = p; this.render() })
      this.root!.add(btn)
    })
  }

  private renderConfirm() {
    const p = this.selected!
    const spriteSize = Math.round(this.H * 0.22)
    const sKey = spriteKey(p.id, false)
    if (this.textures.exists(sKey)) {
      const img = this.add.image(this.cx, this.H * 0.42, sKey).setDisplaySize(spriteSize, spriteSize)
      this.root!.add(img)
    }
    this.root!.add(this.add.text(this.cx, this.H * 0.6, `${p.name} Nv.${p.level} añadido al equipo.`, {
      font: `bold ${Math.round(this.H * 0.025)}px Arial`, color: '#ffffff'
    }).setOrigin(0.5))

    const confirm = this.add.text(this.cx, this.H * 0.72, '[Confirmar]', {
      font: `bold ${Math.round(this.H * 0.025)}px Arial`, color: '#88ff88',
      backgroundColor: '#222', padding: { x: 18, y: 10 }
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
    const cols = 3
    const cardW = Math.round(this.W * 0.16)
    const cardH = Math.round(this.H * 0.22)
    const gapX = Math.round(this.W * 0.03)
    const gapY = Math.round(this.H * 0.03)
    const totalW = cols * cardW + (cols - 1) * gapX
    const startX = this.cx - totalW / 2 + cardW / 2
    const startY = this.H * 0.25
    const spriteSize = Math.round(this.H * 0.1)

    this.payload.playerTeam.forEach((mem, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (cardW + gapX)
      const y = startY + row * (cardH + gapY)

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a3e, 1)
      bg.lineStyle(2, 0x88FF88, 1)
      bg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 8)
      bg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 8)
      this.root!.add(bg)

      const sKey = spriteKey(mem.id, false)
      if (this.textures.exists(sKey)) {
        const img = this.add.image(x, y - cardH * 0.18, sKey).setDisplaySize(spriteSize, spriteSize)
        this.root!.add(img)
      }
      this.root!.add(this.add.text(x, y + cardH * 0.2, `${mem.name} Nv.${mem.level}`, {
        font: `${Math.round(this.H * 0.018)}px Arial`, color: '#ffffff'
      }).setOrigin(0.5))

      const btn = this.add.text(x, y + cardH * 0.38, '[Cambiar]', {
        font: `bold ${Math.round(this.H * 0.018)}px Arial`, color: '#FFD700',
        backgroundColor: '#222', padding: { x: 10, y: 6 }
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
