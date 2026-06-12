import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, getRandomItems } from '../data/Items'

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
    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.add.text(400, 40, '¡Encontraste 3 objetos! Elige uno para tu mochila:', {
      font: 'bold 20px Arial',
      color: '#FFD700'
    }).setOrigin(0.5)

    this.items.forEach((item, i) => {
      const x = 150 + i * 250
      const y = 220

      const bg = this.add.graphics()
      bg.fillStyle(0x222244, 1)
      bg.lineStyle(2, 0x4488FF, 1)
      bg.fillRoundedRect(x - 100, y - 60, 200, 180, 8)
      bg.strokeRoundedRect(x - 100, y - 60, 200, 180, 8)

      this.add.text(x, y - 25, item.name, {
        font: 'bold 16px Arial', color: '#ffffff'
      }).setOrigin(0.5)

      this.add.text(x, y + 20, item.description, {
        font: '13px Arial', color: '#aaccff',
        align: 'center', wordWrap: { width: 180 }
      }).setOrigin(0.5)

      const btn = this.add.text(x, y + 90, '[Elegir]', {
        font: 'bold 14px Arial', color: '#FFD700',
        backgroundColor: '#222', padding: { x: 12, y: 6 }
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
