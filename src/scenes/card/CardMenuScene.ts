﻿﻿﻿import Phaser from 'phaser'
import { loadMeta, saveMeta, META_UNLOCKS, buildRunState, MetaProgress } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'
import { loadItemSprite, itemSpriteKey } from '../../utils/PokeSprite'

export default class CardMenuScene extends Phaser.Scene {
  private meta!: MetaProgress
  private unlockItems: Phaser.GameObjects.Container[] = []

  constructor() { super('CardMenuScene') }

  create() {
    this.meta = loadMeta()
    const W = GAME_W, H = GAME_H, cx = W / 2

    this.cameras.main.setBackgroundColor('#0a0a1a')

    // stars background
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * W, y = Math.random() * H
      const r = Math.random() * 2 + 0.5
      this.add.circle(x, y, r, 0xffffff, Math.random() * 0.6 + 0.2)
    }

    // title
    this.add.text(cx, H * 0.07, 'MODO CARTAS', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.04)}px`,
      color: '#FFD700', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5)

    this.add.text(cx, H * 0.14, 'ROGUELIKE', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.025)}px`,
      color: '#FF8800', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5)

    // stats panel
    this.drawStatsPanel(cx, H * 0.26)

    // meta unlocks panel
    this.drawUnlocksPanel(cx, H * 0.5)

    // buttons
    const btnDeck = this.add.text(cx, H * 0.80, '📋  EDITAR MAZO', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.022)}px`,
      color: '#88CCFF', backgroundColor: '#001122', padding: { x: 22, y: 12 },
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnDeck.on('pointerover', () => btnDeck.setColor('#ffffff'))
    btnDeck.on('pointerout',  () => btnDeck.setColor('#88CCFF'))
    btnDeck.on('pointerdown', () => this.scene.start('CardDeckEditorScene'))

    const btnStart = this.add.text(cx, H * 0.90, '▶  COMENZAR RUN', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.028)}px`,
      color: '#00FF88', backgroundColor: '#002211', padding: { x: 28, y: 16 },
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnStart.on('pointerover', () => btnStart.setColor('#ffffff'))
    btnStart.on('pointerout',  () => btnStart.setColor('#00FF88'))
    btnStart.on('pointerdown', () => this.startRun())

    const btnBack = this.add.text(cx, H * 0.95, '< VOLVER', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.018)}px`,
      color: '#888888', padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnBack.on('pointerover', () => btnBack.setColor('#ffffff'))
    btnBack.on('pointerout',  () => btnBack.setColor('#888888'))
    btnBack.on('pointerdown', () => this.scene.start('MainMenuScene'))
  }

  private drawStatsPanel(cx: number, y: number) {
    const H = GAME_H, W = GAME_W
    const panelW = W * 0.55, panelH = H * 0.16
    const g = this.add.graphics()
    g.fillStyle(0x111133, 0.85)
    g.fillRoundedRect(cx - panelW / 2, y - panelH / 2, panelW, panelH, 12)
    g.lineStyle(2, 0x4444aa)
    g.strokeRoundedRect(cx - panelW / 2, y - panelH / 2, panelW, panelH, 12)

    const fs = Math.round(H * 0.018)
    const col1 = cx - panelW * 0.35
    const col2 = cx + panelW * 0.1
    const row1 = y - panelH * 0.2
    const row2 = y + panelH * 0.2

    const label = (x: number, yy: number, txt: string, val: string | number, color = '#FFD700', valOffset = panelW * 0.26) => {
      this.add.text(x, yy, txt, { fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color: '#aaaaaa' }).setOrigin(0, 0.5)
      this.add.text(x + valOffset, yy, String(val), { fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color }).setOrigin(0, 0.5)
    }

    label(col1, row1, 'Partidas:', this.meta.totalRuns)
    label(col1, row2, 'Mejor piso:', this.meta.bestFloor)
    label(col2, row1, 'Polvo Estelar:', this.meta.starDust, '#AADDFF', panelW * 0.34)
    label(col2, row2, 'Mejoras:',  this.meta.unlocks.length)

    // load stardust item sprite and show next to label
    loadItemSprite(this, 'stardust').then(ok => {
      if (!ok) return
      const spriteX = col2 - Math.round(H * 0.022)
      this.add.image(spriteX, row1, itemSpriteKey('stardust'))
        .setOrigin(0.5)
        .setDisplaySize(Math.round(H * 0.035), Math.round(H * 0.035))
    })
  }

  private drawUnlocksPanel(cx: number, y: number) {
    const H = GAME_H, W = GAME_W
    const panelW = W * 0.72, panelH = H * 0.32
    const g = this.add.graphics()
    g.fillStyle(0x0d0d22, 0.9)
    g.fillRoundedRect(cx - panelW / 2, y - panelH / 2, panelW, panelH, 12)
    g.lineStyle(2, 0x3344aa)
    g.strokeRoundedRect(cx - panelW / 2, y - panelH / 2, panelW, panelH, 12)

    this.add.text(cx, y - panelH / 2 + 18, '* MEJORAS PERMANENTES', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`, color: '#AADDFF'
    }).setOrigin(0.5)

    const cols = 2
    const itemW = panelW / cols - 20
    const itemH = 56
    const startX = cx - panelW / 2 + 20
    const startY = y - panelH / 2 + 50

    META_UNLOCKS.forEach((unlock, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const ix = startX + col * (itemW + 16)
      const iy = startY + row * (itemH + 8)
      this.createUnlockItem(ix, iy, itemW, itemH, unlock)
    })
  }

  private createUnlockItem(x: number, y: number, w: number, h: number, unlock: typeof META_UNLOCKS[0]) {
    const owned = this.meta.unlocks.includes(unlock.id)
    const canAfford = this.meta.starDust >= unlock.cost

    const g = this.add.graphics()
    const bg = owned ? 0x113322 : (canAfford ? 0x1a1a2e : 0x1a1010)
    const border = owned ? 0x00cc66 : (canAfford ? 0x4466cc : 0x553333)
    g.fillStyle(bg, 0.95)
    g.fillRoundedRect(x, y, w, h, 8)
    g.lineStyle(2, border)
    g.strokeRoundedRect(x, y, w, h, 8)

    const fs = Math.round(GAME_H * 0.014)
    const nameColor = owned ? '#00FF88' : (canAfford ? '#ffffff' : '#666666')
    this.add.text(x + 10, y + 10, unlock.name, {
      fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color: nameColor
    })
    this.add.text(x + 10, y + h - 18, owned ? 'OK Comprado' : `* ${unlock.cost}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(fs * 0.8)}px`,
      color: owned ? '#00FF88' : (canAfford ? '#FFDD44' : '#884444')
    })

    if (!owned) {
      const btn = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0)
        .setInteractive({ useHandCursor: canAfford })
      if (canAfford) {
        btn.on('pointerover', () => { g.clear(); g.fillStyle(0x2a2a4e, 0.95); g.fillRoundedRect(x, y, w, h, 8); g.lineStyle(2, 0x88aaff); g.strokeRoundedRect(x, y, w, h, 8) })
        btn.on('pointerout',  () => { g.clear(); g.fillStyle(bg, 0.95); g.fillRoundedRect(x, y, w, h, 8); g.lineStyle(2, border); g.strokeRoundedRect(x, y, w, h, 8) })
        btn.on('pointerdown', () => this.buyUnlock(unlock.id, unlock.cost))
      }
    }
  }

  private buyUnlock(id: string, cost: number) {
    if (this.meta.unlocks.includes(id)) return
    if (this.meta.starDust < cost) return
    this.meta.starDust -= cost
    this.meta.unlocks.push(id)
    saveMeta(this.meta)
    this.scene.restart()
  }

  private startRun() {
    const runState = buildRunState(this.meta)
    this.registry.set('cardRunState', runState)
    this.scene.start('SafariMapScene')
  }
}
