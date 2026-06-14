import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, getRandomItems } from '../data/Items'
import { itemSpriteKey } from '../data/GameAssets'

export interface ItemPickerData {
  playerTeam: Pokemon[]
  playerBag: Item[]
  onComplete: (picked?: Item) => void
}

export default class ItemPickerScene extends Phaser.Scene {
  private pickerData!: ItemPickerData
  private items: Item[] = []

  constructor() {
    super('ItemPickerScene')
  }

  init(data: ItemPickerData) {
    this.pickerData = data
    this.items = getRandomItems(3)
  }

  create() {
    const W = this.scale.width
    const H = this.scale.height
    const cx = W / 2
    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.add.text(cx, H * 0.06, '¡Encontraste 3 objetos! Elige uno para tu mochila:', {
      font: `bold ${Math.round(H * 0.03)}px Arial`,
      color: '#FFD700'
    }).setOrigin(0.5)

    const cardW = Math.round(W * 0.14)
    const cardH = Math.round(H * 0.32)
    const gap = Math.round(W * 0.04)
    const totalW = cardW * 3 + gap * 2
    const startX = cx - totalW / 2 + cardW / 2
    const cardCY = H * 0.48

    this.items.forEach((item, i) => {
      const x = startX + i * (cardW + gap)
      const y = cardCY

      const bg = this.add.graphics()
      bg.fillStyle(0x222244, 1)
      bg.lineStyle(2, 0x4488FF, 1)
      bg.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10)
      bg.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10)

      const iconKey = itemSpriteKey(item.id)
      const iconSize = Math.round(H * 0.1)
      if (this.textures.exists(iconKey)) {
        this.add.image(x, y - cardH * 0.3, iconKey).setDisplaySize(iconSize, iconSize)
      }

      const tagColor = item.category === 'vitamin' ? '#88ff88' : '#ffaa44'
      const tag = item.category === 'vitamin' ? 'Vitamina' : 'Reliquia'
      this.add.text(x, y - cardH * 0.05, item.name, {
        font: `bold ${Math.round(H * 0.025)}px Arial`, color: '#ffffff'
      }).setOrigin(0.5)

      this.add.text(x, y + cardH * 0.08, `[${tag}]`, {
        font: `${Math.round(H * 0.018)}px Arial`, color: tagColor
      }).setOrigin(0.5)

      this.add.text(x, y + cardH * 0.2, item.description, {
        font: `${Math.round(H * 0.018)}px Arial`, color: '#aaccff',
        align: 'center', wordWrap: { width: cardW - 20 }
      }).setOrigin(0.5)

      const btn = this.add.text(x, y + cardH * 0.35, '[Elegir]', {
        font: `bold ${Math.round(H * 0.022)}px Arial`, color: '#FFD700',
        backgroundColor: '#222', padding: { x: 14, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => this.pickItem(item))
    })
  }

  private pickItem(item: Item) {
    this.pickerData.playerBag.push(item)
    this.pickerData.onComplete(item)
    this.scene.resume('GameScene')
    this.scene.stop()
  }
}
