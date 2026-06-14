import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { spriteKey } from '../entities/PokemonFactory'

export interface TeamOrderData {
  playerTeam: Pokemon[]
  onComplete: () => void
}

export default class TeamOrderScene extends Phaser.Scene {
  private payload!: TeamOrderData
  private root?: Phaser.GameObjects.Container

  constructor() { super('TeamOrderScene') }

  init(data: TeamOrderData) { this.payload = data as TeamOrderData }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.render()
  }

  private render() {
    if (this.root) this.root.destroy()
    this.root = this.add.container(0, 0)

    this.root.add(this.add.text(400, 24, 'ORDEN DEL EQUIPO', {
      font: 'bold 22px Arial', color: '#FFD700'
    }).setOrigin(0.5))

    this.root.add(this.add.text(400, 50, 'Hueco 1 = líder. Usa ↑↓ para reordenar.', {
      font: '13px Arial', color: '#aaaaaa'
    }).setOrigin(0.5))

    const closeBtn = this.add.text(760, 24, '[Hecho]', {
      font: 'bold 14px Arial', color: '#FFD700',
      backgroundColor: '#222', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.close())
    this.root.add(closeBtn)

    const team = this.payload.playerTeam
    team.forEach((p, i) => {
      const y = 90 + i * 80
      const bg = this.add.graphics()
      bg.fillStyle(i === 0 ? 0x2a4a2a : 0x1a1a3e, 1)
      bg.lineStyle(2, i === 0 ? 0xFFD700 : 0x88FF88, 1)
      bg.fillRoundedRect(200, y, 400, 70, 6)
      bg.strokeRoundedRect(200, y, 400, 70, 6)
      this.root!.add(bg)

      this.root!.add(this.add.text(214, y + 30, `${i + 1}`, {
        font: 'bold 18px Arial', color: '#FFD700'
      }))

      const sKey = spriteKey(p.id, false)
      if (this.textures.exists(sKey)) {
        const img = this.add.image(260, y + 35, sKey).setDisplaySize(52, 52)
        this.root!.add(img)
      }

      const held = p.heldItem ? ` [${p.heldItem}]` : ''
      this.root!.add(this.add.text(310, y + 10, `${p.name} Nv.${p.level}${held}`, {
        font: '14px Arial', color: '#ffffff'
      }))
      this.root!.add(this.add.text(310, y + 32, `HP ${p.hp}/${p.maxHp}  Atk ${p.attack}  Def ${p.defense}`, {
        font: '11px Arial', color: '#aaccff'
      }))
      this.root!.add(this.add.text(310, y + 50, `Movimientos: ${p.moves.join(', ')}`, {
        font: '10px Arial', color: '#88ccff'
      }))

      if (i > 0) {
        const up = this.add.text(550, y + 18, '▲', {
          font: 'bold 16px Arial', color: '#ffffff',
          backgroundColor: '#333', padding: { x: 8, y: 2 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        up.on('pointerdown', () => this.swap(i, i - 1))
        this.root!.add(up)
      }
      if (i < team.length - 1) {
        const dn = this.add.text(580, y + 18, '▼', {
          font: 'bold 16px Arial', color: '#ffffff',
          backgroundColor: '#333', padding: { x: 8, y: 2 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        dn.on('pointerdown', () => this.swap(i, i + 1))
        this.root!.add(dn)
      }
    })
  }

  private swap(a: number, b: number) {
    const t = this.payload.playerTeam
    ;[t[a], t[b]] = [t[b], t[a]]
    this.render()
  }

  private close() {
    this.payload.onComplete()
    this.scene.resume('GameScene')
    this.scene.stop()
  }
}

