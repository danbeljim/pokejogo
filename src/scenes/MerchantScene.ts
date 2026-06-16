import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, CONSUMABLES } from '../data/Items'
import { ITEM_SPRITES } from '../data/GameAssets'

export interface MerchantSceneData {
  playerTeam: Pokemon[]
  playerBag: Item[]
  playerGold: number
  onComplete: (gold: number) => void
}

interface ShopItem {
  id: string
  cost: number
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'potion',       cost: 2 },
  { id: 'super_potion', cost: 4 },
  { id: 'rare_candy',   cost: 3 },
  { id: 'revive',       cost: 5 },
]

export default class MerchantScene extends Phaser.Scene {
  public data!: MerchantSceneData
  private gold: number = 0
  private root?: Phaser.GameObjects.Container
  private msg: string = ''

  constructor() { super('MerchantScene') }

  init(d: MerchantSceneData) {
    this.data = d
    this.gold = d.playerGold
    this.msg = ''
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    if (this.textures.exists('shop-bg')) {
      const bg = this.add.image(this.scale.width / 2, this.scale.height / 2, 'shop-bg')
      bg.setDisplaySize(this.scale.width, this.scale.height).setDepth(-1).setAlpha(0.55)
    }
    this.render()
  }

  get payload() { return this.data }

  private render() {
    document.querySelectorAll('img[data-shop-sprite]').forEach(el => el.remove())
    if (this.root) this.root.destroy()
    this.root = this.add.container(0, 0)

    const W = this.scale.width
    const H = this.scale.height

    // panel bg
    const bg = this.add.graphics()
    bg.fillStyle(0x0a0a1a, 0.96)
    bg.fillRoundedRect(10, 10, W - 20, H - 20, 12)
    bg.lineStyle(2, 0xFFD700, 1)
    bg.strokeRoundedRect(10, 10, W - 20, H - 20, 12)
    this.root.add(bg)

    // gold display
    if (this.textures.exists('moneda-icon')) {
      this.root.add(this.add.image(W - 110, 36, 'moneda-icon').setDisplaySize(20, 20).setOrigin(0, 0.5))
    }
    this.root.add(this.add.text(W - 86, 36, `${this.gold}`, {
      font: 'bold 16px Arial', color: '#FFD700',
      backgroundColor: '#222200', padding: { x: 8, y: 4 }
    }).setOrigin(0, 0.5))

    // message
    if (this.msg) {
      this.root.add(this.add.text(W / 2, 96, this.msg, {
        font: 'bold 12px Arial', color: '#88ff88'
      }).setOrigin(0.5))
    }

    // shop items grid
    const cols = 2
    const itemW = Math.round(W * 0.36)
    const itemH = 200
    const startX = Math.round(W * 0.1)
    const startY = 120
    const gapX = Math.round(W * 0.04)
    const gapY = 20

    SHOP_ITEMS.forEach((item, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (itemW + gapX)
      const y = startY + row * (itemH + gapY)
      this.drawShopItem(item, x, y, itemW, itemH)
    })

    // close
    const closeBtn = this.add.text(W / 2, H - 32, '[ Cerrar tienda ]', {
      font: 'bold 13px Arial', color: '#ff8888',
      backgroundColor: '#221111', padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.close())
    this.root.add(closeBtn)
  }

  private drawShopItem(shopItem: ShopItem, x: number, y: number, w: number, h: number) {
    const itemData = CONSUMABLES.find(c => c.id === shopItem.id)
    if (!itemData) return
    const canAfford = this.gold >= shopItem.cost
    const bg = this.add.graphics()
    bg.fillStyle(canAfford ? 0x1a2a1a : 0x1a1a1a, 1)
    bg.lineStyle(2, canAfford ? 0xFFD700 : 0x444444, 1)
    bg.fillRoundedRect(x, y, w, h, 8)
    bg.strokeRoundedRect(x, y, w, h, 8)
    this.root!.add(bg)

    const spriteUrl = ITEM_SPRITES[shopItem.id]
    if (spriteUrl) {
      const img = document.createElement('img')
      img.src = spriteUrl
      img.style.cssText = `position:absolute; width:64px; height:64px; image-rendering:pixelated; left:${x + w / 2 - 32}px; top:${y + 8}px; pointer-events:none;`
      img.dataset.shopSprite = 'true'
      document.body.appendChild(img)
    }

    const textOffsetY = spriteUrl ? 80 : 18
    const pf = '"Press Start 2P"'
    this.root!.add(this.add.text(x + w / 2, y + textOffsetY, itemData.name, {
      fontFamily: pf, fontSize: '11px', color: canAfford ? '#ffffff' : '#666666'
    }).setOrigin(0.5))

    this.root!.add(this.add.text(x + w / 2, y + textOffsetY + 24, itemData.description, {
      fontFamily: pf, fontSize: '8px', color: '#aaaaaa', align: 'center',
      lineSpacing: 8, wordWrap: { width: w - 16 }
    }).setOrigin(0.5))

    if (this.textures.exists('moneda-icon')) {
      this.root!.add(this.add.image(x + w / 2 - 24, y + textOffsetY + 68, 'moneda-icon').setDisplaySize(16, 16).setOrigin(0.5))
    }
    this.root!.add(this.add.text(x + w / 2 - 4, y + textOffsetY + 68, `${shopItem.cost}`, {
      fontFamily: pf, fontSize: '11px', color: canAfford ? '#FFD700' : '#664400'
    }).setOrigin(0, 0.5))

    if (canAfford) {
      this.root!.add(this.add.text(x + w / 2, y + textOffsetY + 90, 'COMPRAR', {
        fontFamily: pf, fontSize: '9px', color: '#88ff88',
        backgroundColor: '#112211', padding: { x: 8, y: 5 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.buy(shopItem, itemData)))
    }
  }

  private buy(shopItem: ShopItem, itemData: Item) {
    if (this.gold < shopItem.cost) return
    this.gold -= shopItem.cost
    this.data.playerBag.push({ ...itemData })
    this.msg = `${itemData.name} añadido a la mochila`
    this.render()
  }

  private close() {
    document.querySelectorAll('img[data-shop-sprite]').forEach(el => el.remove())
    this.data.onComplete(this.gold)
    this.scene.resume('GameScene')
    this.scene.stop()
  }
}
