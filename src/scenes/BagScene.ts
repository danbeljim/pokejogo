import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, equipItem, applyVitamin, RELICS } from '../data/Items'
import { spriteKey } from '../entities/PokemonFactory'
import { itemSpriteKey } from '../data/GameAssets'

export interface BagSceneData {
  playerTeam: Pokemon[]
  playerBag: Item[]
  onComplete: () => void
}

export default class BagScene extends Phaser.Scene {
  private payload!: BagSceneData
  private selectedItem?: Item
  private selectedIdx?: number
  private root?: Phaser.GameObjects.Container

  constructor() { super('BagScene') }

  init(data: BagSceneData) {
    this.payload = data
    this.selectedItem = undefined
    this.selectedIdx = undefined
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    this.render()
  }

  private render() {
    if (this.root) this.root.destroy()
    this.root = this.add.container(0, 0)

    this.root.add(this.add.text(400, 24, 'MOCHILA', {
      font: 'bold 22px Arial', color: '#FFD700'
    }).setOrigin(0.5))

    const closeBtn = this.add.text(760, 24, '[X]', {
      font: 'bold 16px Arial', color: '#ff8888',
      backgroundColor: '#222', padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.close())
    this.root.add(closeBtn)

    // Left: bag items
    this.root.add(this.add.text(20, 60, 'Objetos:', {
      font: 'bold 14px Arial', color: '#ffffff'
    }))

    if (this.payload.playerBag.length === 0) {
      this.root.add(this.add.text(20, 90, '(vacía)', { font: '13px Arial', color: '#888' }))
    }

    this.payload.playerBag.forEach((item, i) => {
      const y = 90 + i * 40
      const isSel = this.selectedIdx === i
      const bg = this.add.graphics()
      bg.fillStyle(isSel ? 0x445588 : 0x222244, 1)
      bg.lineStyle(2, isSel ? 0xFFD700 : 0x4488FF, 1)
      bg.fillRoundedRect(20, y, 340, 36, 6)
      bg.strokeRoundedRect(20, y, 340, 36, 6)
      this.root!.add(bg)

      const iconKey = itemSpriteKey(item.id)
      if (this.textures.exists(iconKey)) {
        const icon = this.add.image(38, y + 18, iconKey).setDisplaySize(28, 28)
        this.root!.add(icon)
      }

      const tag = item.category === 'vitamin' ? '[V]' : item.category === 'berry' ? '[B]' : '[R]'
      const tagColor = item.category === 'vitamin' ? '#88ff88' : item.category === 'berry' ? '#ff88aa' : '#ffaa44'
      const t = this.add.text(56, y + 4, `${tag} ${item.name}`, { font: 'bold 12px Arial', color: tagColor })
      const d = this.add.text(56, y + 20, item.description, { font: '11px Arial', color: '#cccccc' })
      this.root!.add(t)
      this.root!.add(d)

      const zone = this.add.zone(20, y, 340, 32).setOrigin(0, 0).setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => {
        this.selectedItem = item
        this.selectedIdx = i
        this.render()
      })
      this.root!.add(zone)
    })

    // Right: team
    this.root.add(this.add.text(400, 60, 'Equipo (pulsa para equipar):', {
      font: 'bold 14px Arial', color: '#ffffff'
    }))

    this.payload.playerTeam.forEach((p, i) => {
      const y = 90 + i * 70
      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a3e, 1)
      bg.lineStyle(2, 0x88FF88, 1)
      bg.fillRoundedRect(400, y, 380, 62, 6)
      bg.strokeRoundedRect(400, y, 380, 62, 6)
      this.root!.add(bg)

      const sKey = spriteKey(p.id, false)
      if (this.textures.exists(sKey)) {
        const img = this.add.image(430, y + 30, sKey).setDisplaySize(52, 52)
        this.root!.add(img)
      }

      const held = p.heldItem ? ` [${p.heldItem}]` : ''
      this.root!.add(this.add.text(470, y + 8, `${p.name} Nv.${p.level}${held}`, {
        font: '13px Arial', color: '#ffffff'
      }))
      this.root!.add(this.add.text(470, y + 28, `HP ${p.hp}/${p.maxHp}  Atk ${p.attack}  Def ${p.defense}  Spd ${p.speed}`, {
        font: '11px Arial', color: '#aaccff'
      }))

      if (this.selectedItem) {
        const isVitamin = this.selectedItem.category === 'vitamin'
        const btnLabel = isVitamin ? '[Usar]' : '[Equipar]'
        const btnColor = isVitamin ? '#88ff88' : '#FFD700'
        const btn = this.add.text(740, y + 30, btnLabel, {
          font: 'bold 12px Arial', color: btnColor,
          backgroundColor: '#222', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        btn.on('pointerdown', () => this.equip(p))
        this.root!.add(btn)
      } else if (p.heldItem) {
        const unBtn = this.add.text(740, y + 30, '[Desequipar]', {
          font: 'bold 12px Arial', color: '#ff8888',
          backgroundColor: '#222', padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        unBtn.on('pointerdown', () => this.unequip(p))
        this.root!.add(unBtn)
      }
    })

    if (this.selectedItem?.category === 'berry') {
      const useBtn = this.add.text(400, 520, `🍓 Usar "${this.selectedItem.name}" en todo el equipo`, {
        font: 'bold 14px Arial', color: '#88ff88',
        backgroundColor: '#1a3020', padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      useBtn.on('pointerdown', () => this.useBerry())
      this.root!.add(useBtn)
      this.root.add(this.add.text(400, 560, `Seleccionado: ${this.selectedItem.name}`, {
        font: 'bold 14px Arial', color: '#FFD700'
      }).setOrigin(0.5))
    } else if (this.selectedItem) {
      this.root.add(this.add.text(400, 560, `Seleccionado: ${this.selectedItem.name}`, {
        font: 'bold 14px Arial', color: '#FFD700'
      }).setOrigin(0.5))
    } else {
      this.root.add(this.add.text(400, 560, 'Pulsa un objeto y luego un Pokémon para equipar.', {
        font: '12px Arial', color: '#aaaaaa'
      }).setOrigin(0.5))
    }
  }

  private useBerry() {
    if (!this.selectedItem || this.selectedIdx === undefined) return
    this.payload.playerTeam.forEach(p => p.heal(Math.floor(p.maxHp * 0.5)))
    this.payload.playerBag.splice(this.selectedIdx, 1)
    this.selectedItem = undefined
    this.selectedIdx = undefined
    this.render()
  }

  private equip(p: Pokemon) {
    if (!this.selectedItem || this.selectedIdx === undefined) return
    if (this.selectedItem.category === 'vitamin') {
      applyVitamin(p, this.selectedItem)
      this.payload.playerBag.splice(this.selectedIdx, 1)
    } else {
      const oldItem = equipItem(p, this.selectedItem)
      this.payload.playerBag.splice(this.selectedIdx, 1)
      if (oldItem) this.payload.playerBag.push(oldItem)
    }
    this.selectedItem = undefined
    this.selectedIdx = undefined
    this.render()
  }

  private unequip(p: Pokemon) {
    if (!p.heldItem) return
    const item = RELICS.find(i => i.id === p.heldItem)
    if (!item) return
    const b = item.bonus || {}
    p.attack  -= b.attack  || 0
    p.defense -= b.defense || 0
    p.speed   -= b.speed   || 0
    if (b.hp) {
      p.maxHp -= b.hp
      p.hp = Math.min(p.hp, p.maxHp)
    }
    p.heldItem = undefined
    this.payload.playerBag.push(item)
    this.render()
  }

  private close() {
    this.payload.onComplete()
    this.scene.resume('GameScene')
    this.scene.stop()
  }
}

