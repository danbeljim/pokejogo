import Phaser from 'phaser'
import { CardRunState, getCardById, getShopCards, getTypeColor } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'

export default class CardShopScene extends Phaser.Scene {
  private run!: CardRunState
  private shopItems: { card: ReturnType<typeof getCardById>; price: number }[] = []
  private removeMode = false
  private goldText!: Phaser.GameObjects.Text

  constructor() { super('CardShopScene') }

  create() {
    this.run = this.registry.get('cardRunState') as CardRunState
    if (!this.run) { this.scene.start('CardMenuScene'); return }

    this.shopItems = getShopCards(this.run).filter(s => !!s.card) as any
    this.cameras.main.setBackgroundColor('#0a0a0a')

    const W = GAME_W, H = GAME_H, cx = W / 2

    this.add.text(cx, H * 0.05, 'ðŸª TIENDA', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.04)}px`,
      color: '#FFD700', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5)

    this.goldText = this.add.text(cx, H * 0.12, `ðŸ’° ORO: ${this.run.gold}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.022)}px`, color: '#FFD700'
    }).setOrigin(0.5)

    this.drawShopItems()
    this.drawRemoveSection()

    const btnLeave = this.add.text(cx, H * 0.94, 'â†’ CONTINUAR', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.022)}px`,
      color: '#00FF88', backgroundColor: '#002211', padding: { x: 22, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnLeave.on('pointerover', () => btnLeave.setColor('#ffffff'))
    btnLeave.on('pointerout',  () => btnLeave.setColor('#00FF88'))
    btnLeave.on('pointerdown', () => {
      this.registry.set('cardRunState', this.run)
      this.scene.start('SafariMapScene')
    })
  }

  private drawShopItems() {
    const W = GAME_W, H = GAME_H
    const cardW = Math.round(H * 0.16)
    const cardH = Math.round(H * 0.32)
    const gap = W * 0.035
    const total = this.shopItems.length * cardW + (this.shopItems.length - 1) * gap
    const startX = W / 2 - total / 2

    this.shopItems.forEach(({ card, price }, i) => {
      if (!card) return
      const x = startX + i * (cardW + gap) + cardW / 2
      const y = H * 0.43
      this.createShopCard(card, price, x, y, cardW, cardH, i)
    })
  }

  private createShopCard(def: NonNullable<ReturnType<typeof getCardById>>, price: number, x: number, y: number, w: number, h: number, idx: number) {
    const container = this.add.container(x, y)
    const baseColor = getTypeColor(def.type)
    const canAfford = this.run.gold >= price

    const g = this.add.graphics()
    const draw = (hover = false) => {
      g.clear()
      g.fillStyle(baseColor, canAfford ? 0.9 : 0.4)
      g.fillRoundedRect(-w/2, -h/2, w, h, 10)
      g.lineStyle(hover ? 3 : 1.5, hover ? 0xFFD700 : (canAfford ? 0xffffff : 0x444444))
      g.strokeRoundedRect(-w/2, -h/2, w, h, 10)
    }
    draw()
    container.add(g)

    container.add(this.add.text(0, -h/2 + 18, def.nameEs, {
      fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#ffffff', wordWrap: { width: w - 12 }
    }).setOrigin(0.5))

    const valStr = def.damage ? `âš”ï¸ ${def.damage}` : def.shield ? `ðŸ›¡ï¸ ${def.shield}` : def.effect ?? 'âœ¨'
    container.add(this.add.text(0, 0, valStr, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffdd44', wordWrap: { width: w - 12 }, align: 'center'
    }).setOrigin(0.5))

    if (def.effect) {
      container.add(this.add.text(0, h/2 - 52, def.effect, {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#aaddff', wordWrap: { width: w - 12 }, align: 'center'
      }).setOrigin(0.5))
    }

    const priceColor = canAfford ? '#FFD700' : '#ff4444'
    const priceTxt = container.add(this.add.text(0, h/2 - 22, `ðŸ’° ${price}`, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: priceColor
    }).setOrigin(0.5))

    const bought = this.run.deck.filter(id => id === def.id).length > 0

    if (canAfford) {
      const hit = this.add.rectangle(0, 0, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true })
      container.add(hit)
      hit.on('pointerover', () => draw(true))
      hit.on('pointerout',  () => draw(false))
      hit.on('pointerdown', () => {
        if (this.run.gold < price) return
        this.run.gold -= price
        this.run.deck.push(def.id)
        this.goldText.setText(`ðŸ’° ORO: ${this.run.gold}`)
        container.setAlpha(0.3)
        hit.disableInteractive()
        this.add.text(x, y, 'âœ“ COMPRADO', {
          fontFamily: '"Press Start 2P"', fontSize: '11px', color: '#00FF88',
          backgroundColor: '#002211', padding: { x: 8, y: 6 }
        }).setOrigin(0.5)
      })
    }
  }

  private drawRemoveSection() {
    const W = GAME_W, H = GAME_H, cx = W / 2
    const removeCost = 75

    this.add.text(cx, H * 0.73, 'ELIMINAR CARTA DEL MAZO', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`, color: '#ff8888'
    }).setOrigin(0.5)

    this.add.text(cx, H * 0.78, `Coste: ðŸ’° ${removeCost} oro`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.015)}px`, color: '#888888'
    }).setOrigin(0.5)

    const canAfford = this.run.gold >= removeCost

    const btnRemove = this.add.text(cx, H * 0.84, canAfford ? 'ðŸ—‘ï¸ ELEGIR CARTA A ELIMINAR' : 'ORO INSUFICIENTE', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.015)}px`,
      color: canAfford ? '#ff8888' : '#444444',
      backgroundColor: canAfford ? '#220000' : '#111111',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5)

    if (canAfford) {
      btnRemove.setInteractive({ useHandCursor: true })
      btnRemove.on('pointerover', () => btnRemove.setColor('#ffffff'))
      btnRemove.on('pointerout',  () => btnRemove.setColor('#ff8888'))
      btnRemove.on('pointerdown', () => this.openRemovePicker(removeCost))
    }
  }

  private openRemovePicker(cost: number) {
    const W = GAME_W, H = GAME_H, cx = W / 2, cy = H / 2

    // overlay
    const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.85).setInteractive()
    const panel = this.add.container(cx, cy)

    const g = this.add.graphics()
    g.fillStyle(0x0a0a1a, 0.98)
    g.fillRoundedRect(-W * 0.4, -H * 0.38, W * 0.8, H * 0.76, 16)
    g.lineStyle(2, 0x884444)
    g.strokeRoundedRect(-W * 0.4, -H * 0.38, W * 0.8, H * 0.76, 16)
    panel.add(g)

    panel.add(this.add.text(0, -H * 0.33, 'Elige carta a ELIMINAR', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#ff8888'
    }).setOrigin(0.5))

    const uniqueIds = [...new Set(this.run.deck)]
    const colCount = 4
    const itemW = W * 0.16, itemH = 40
    uniqueIds.forEach((cardId, i) => {
      const def = getCardById(cardId)
      if (!def) return
      const col = i % colCount
      const row = Math.floor(i / colCount)
      const ix = -W * 0.3 + col * (itemW + 8)
      const iy = -H * 0.24 + row * (itemH + 8)
      const btn = this.add.text(ix + itemW / 2, iy, def.nameEs, {
        fontFamily: '"Press Start 2P"', fontSize: '9px', color: '#ffffff',
        backgroundColor: '#221122', padding: { x: 8, y: 8 }, wordWrap: { width: itemW - 10 }
      }).setOrigin(0, 0)
      btn.setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setColor('#ff8888'))
      btn.on('pointerout',  () => btn.setColor('#ffffff'))
      btn.on('pointerdown', () => {
        const idx = this.run.deck.indexOf(cardId)
        if (idx !== -1) this.run.deck.splice(idx, 1)
        this.run.gold -= cost
        this.goldText.setText(`ðŸ’° ORO: ${this.run.gold}`)
        overlay.destroy()
        panel.destroy()
      })
      panel.add(btn)
    })

    const btnClose = this.add.text(0, H * 0.32, 'Cancelar', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#888888',
      backgroundColor: '#111111', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnClose.on('pointerdown', () => { overlay.destroy(); panel.destroy() })
    panel.add(btnClose)
  }
}
