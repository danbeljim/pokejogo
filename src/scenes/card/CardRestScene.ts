import Phaser from 'phaser'
import { CardRunState, getCardById } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'

export default class CardRestScene extends Phaser.Scene {
  private run!: CardRunState

  constructor() { super('CardRestScene') }

  create() {
    this.run = this.registry.get('cardRunState') as CardRunState
    if (!this.run) { this.scene.start('CardMenuScene'); return }

    this.cameras.main.setBackgroundColor('#0a0a14')

    const W = GAME_W, H = GAME_H, cx = W / 2
    const healAmount = Math.round(this.run.playerMaxHp * 0.3)

    this.add.text(cx, H * 0.08, 'ðŸ•ï¸ LUGAR DE DESCANSO', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.032)}px`,
      color: '#88ffaa', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5)

    this.add.text(cx, H * 0.18, 'Elige una opciÃ³n:', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.02)}px`, color: '#aaaacc'
    }).setOrigin(0.5)

    // heal option
    this.createOption(
      cx, H * 0.35,
      W * 0.38, H * 0.18,
      'ðŸ’š DESCANSAR',
      `Recupera ${healAmount} PS\n(${this.run.playerHp} â†’ ${Math.min(this.run.playerMaxHp, this.run.playerHp + healAmount)})`,
      '#00FF88',
      () => {
        this.run.playerHp = Math.min(this.run.playerMaxHp, this.run.playerHp + healAmount)
        this.registry.set('cardRunState', this.run)
        this.scene.start('SafariMapScene')
      }
    )

    // upgrade option
    this.createOption(
      cx, H * 0.62,
      W * 0.38, H * 0.18,
      'â¬†ï¸ MEJORAR CARTA',
      'Elige una carta del mazo\npara mejorar su daÃ±o/escudo +50%',
      '#AADDFF',
      () => this.openUpgradePicker()
    )

    const btnBack = this.add.text(cx, H * 0.93, 'â†’ Saltarse el descanso', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#555566',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnBack.on('pointerover', () => btnBack.setColor('#ffffff'))
    btnBack.on('pointerout',  () => btnBack.setColor('#555566'))
    btnBack.on('pointerdown', () => {
      this.registry.set('cardRunState', this.run)
      this.scene.start('SafariMapScene')
    })
  }

  private createOption(cx: number, cy: number, w: number, h: number, title: string, desc: string, color: string, onPick: () => void) {
    const g = this.add.graphics()
    g.fillStyle(0x111122, 0.9)
    g.fillRoundedRect(cx - w/2, cy - h/2, w, h, 12)
    g.lineStyle(2, parseInt(color.replace('#',''), 16))
    g.strokeRoundedRect(cx - w/2, cy - h/2, w, h, 12)

    const fs = Math.round(GAME_H * 0.022)
    this.add.text(cx, cy - h * 0.2, title, {
      fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color
    }).setOrigin(0.5)
    this.add.text(cx, cy + h * 0.15, desc, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.6)}px`, color: '#aaaacc',
      align: 'center', wordWrap: { width: w - 24 }
    }).setOrigin(0.5)

    const hit = this.add.rectangle(cx, cy, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => { g.clear(); g.fillStyle(0x1a1a33, 0.95); g.fillRoundedRect(cx-w/2, cy-h/2, w, h, 12); g.lineStyle(3, parseInt(color.replace('#',''),16)); g.strokeRoundedRect(cx-w/2, cy-h/2, w, h, 12) })
    hit.on('pointerout',  () => { g.clear(); g.fillStyle(0x111122, 0.9); g.fillRoundedRect(cx-w/2, cy-h/2, w, h, 12); g.lineStyle(2, parseInt(color.replace('#',''),16)); g.strokeRoundedRect(cx-w/2, cy-h/2, w, h, 12) })
    hit.on('pointerdown', onPick)
  }

  private openUpgradePicker() {
    const W = GAME_W, H = GAME_H, cx = W / 2, cy = H / 2
    const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.85).setInteractive()
    const panel = this.add.container(cx, cy)

    const g = this.add.graphics()
    g.fillStyle(0x0a0a1a, 0.98)
    g.fillRoundedRect(-W * 0.38, -H * 0.36, W * 0.76, H * 0.72, 16)
    g.lineStyle(2, 0x4466aa)
    g.strokeRoundedRect(-W * 0.38, -H * 0.36, W * 0.76, H * 0.72, 16)
    panel.add(g)

    panel.add(this.add.text(0, -H * 0.31, 'Elige carta a MEJORAR', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', color: '#AADDFF'
    }).setOrigin(0.5))

    const uniqueIds = [...new Set(this.run.deck)]
    const colCount = 4
    const itemW = W * 0.16, itemH = 42
    uniqueIds.forEach((cardId, i) => {
      const def = getCardById(cardId)
      if (!def) return
      const col = i % colCount
      const row = Math.floor(i / colCount)
      const ix = -W * 0.3 + col * (itemW + 8)
      const iy = -H * 0.22 + row * (itemH + 8)
      const dmgStr = def.damage ? `âš”ï¸${def.damage}â†’${Math.round(def.damage*1.5)}` : def.shield ? `ðŸ›¡ï¸${def.shield}â†’${Math.round(def.shield*1.5)}` : 'âœ¨'
      const btn = this.add.text(ix + itemW/2, iy, `${def.nameEs}\n${dmgStr}`, {
        fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#ffffff',
        backgroundColor: '#112233', padding: { x: 8, y: 6 }, wordWrap: { width: itemW - 8 }, align: 'center'
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
      btn.on('pointerover', () => btn.setColor('#AADDFF'))
      btn.on('pointerout',  () => btn.setColor('#ffffff'))
      btn.on('pointerdown', () => {
        // store upgraded version in registry (we mark it with '_up' suffix in deck)
        const idx = this.run.deck.indexOf(cardId)
        if (idx !== -1) this.run.deck[idx] = cardId + '_up'
        this.registry.set('cardRunState', this.run)
        overlay.destroy()
        panel.destroy()
        this.scene.start('SafariMapScene')
      })
      panel.add(btn)
    })

    const btnClose = this.add.text(0, H * 0.3, 'Cancelar', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#888888',
      backgroundColor: '#111111', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnClose.on('pointerdown', () => { overlay.destroy(); panel.destroy() })
    panel.add(btnClose)
  }
}
