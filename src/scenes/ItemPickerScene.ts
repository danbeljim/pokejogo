import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, getRandomItems, equipItem } from '../data/Items'
import { spriteKey } from '../entities/PokemonFactory'

export interface ItemPickerData {
  playerTeam: Pokemon[]
  onComplete: () => void
}

export default class ItemPickerScene extends Phaser.Scene {
  private pickerData!: ItemPickerData
  private items: Item[] = []
  private selectedItem?: Item

  constructor() {
    super('ItemPickerScene')
  }

  init(data: ItemPickerData) {
    this.pickerData = data
    this.items = getRandomItems(3)
    this.selectedItem = undefined
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.add.text(400, 40, 'Found 3 items! Choose one:', {
      font: 'bold 22px Arial',
      color: '#FFD700'
    }).setOrigin(0.5)

    this.drawItemChoices()
  }

  private drawItemChoices() {
    this.items.forEach((item, i) => {
      const x = 150 + i * 250
      const y = 180

      const bg = this.add.graphics()
      bg.fillStyle(0x222244, 1)
      bg.lineStyle(2, 0x4488FF, 1)
      bg.fillRoundedRect(x - 100, y - 50, 200, 160, 8)
      bg.strokeRoundedRect(x - 100, y - 50, 200, 160, 8)

      this.add.text(x, y - 20, item.name, {
        font: 'bold 16px Arial',
        color: '#ffffff'
      }).setOrigin(0.5)

      this.add.text(x, y + 20, item.description, {
        font: '13px Arial',
        color: '#aaccff',
        align: 'center',
        wordWrap: { width: 180 }
      }).setOrigin(0.5)

      const btn = this.add.text(x, y + 80, '[Pick]', {
        font: 'bold 14px Arial',
        color: '#FFD700',
        backgroundColor: '#222',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => this.pickItem(item))
    })
  }

  private pickItem(item: Item) {
    this.selectedItem = item
    this.children.removeAll()

    this.cameras.main.setBackgroundColor('#0a0a1a')

    this.add.text(400, 40, `Equip ${item.name} to which Pokémon?`, {
      font: 'bold 20px Arial',
      color: '#FFD700'
    }).setOrigin(0.5)

    this.add.text(400, 70, item.description, {
      font: '14px Arial',
      color: '#aaccff'
    }).setOrigin(0.5)

    const team = this.pickerData.playerTeam
    team.forEach((pkm, i) => {
      const cols = Math.min(team.length, 3)
      const row = Math.floor(i / cols)
      const col = i % cols
      const x = 200 + col * 200
      const y = 180 + row * 180

      const bg = this.add.graphics()
      bg.fillStyle(0x1a1a3e, 1)
      bg.lineStyle(2, 0x88FF88, 1)
      bg.fillRoundedRect(x - 80, y - 60, 160, 160, 8)
      bg.strokeRoundedRect(x - 80, y - 60, 160, 160, 8)

      const key = spriteKey(pkm.id, false)
      if (this.textures.exists(key)) {
        const sprite = this.add.image(x, y - 5, key)
        sprite.setScale(1.6)
      }

      const heldLabel = pkm.heldItem ? ` (${pkm.heldItem})` : ''
      this.add.text(x, y + 50, `${pkm.name} Lv.${pkm.level}${heldLabel}`, {
        font: '12px Arial',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 150 }
      }).setOrigin(0.5)

      const btn = this.add.text(x, y + 80, '[Equip]', {
        font: 'bold 13px Arial',
        color: '#FFD700',
        backgroundColor: '#222',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })

      btn.on('pointerover', () => btn.setColor('#ffffff'))
      btn.on('pointerout', () => btn.setColor('#FFD700'))
      btn.on('pointerdown', () => this.equipToPokemon(pkm))
    })
  }

  private equipToPokemon(pokemon: Pokemon) {
    if (!this.selectedItem) return
    equipItem(pokemon, this.selectedItem)
    this.pickerData.onComplete()
    this.scene.stop()
    this.scene.resume('GameScene')
  }
}
