import Phaser from 'phaser'
import { CARD_POOL, CardDef, loadMeta, saveMeta, getTypeColor } from '../../data/CardData'
import { fetchTCGCardImage } from '../../utils/TcgApi'
import { GAME_W, GAME_H } from '../../main'

const MAX_DECK = 40
const MAX_COPIES = 3

export default class CardDeckEditorScene extends Phaser.Scene {
  private deck: string[] = []
  private poolPage = 0
  private readonly CARDS_PER_PAGE = 8
  private deckCountText!: Phaser.GameObjects.Text
  private deckListContainer!: Phaser.GameObjects.Container
  private poolContainer!: Phaser.GameObjects.Container

  constructor() { super('CardDeckEditorScene') }

  create() {
    const meta = loadMeta()
    this.deck = meta.legacyDeck?.length ? [...meta.legacyDeck] : []

    const W = GAME_W, H = GAME_H
    this.cameras.main.setBackgroundColor('#080818')

    // title
    this.add.text(W / 2, H * 0.04, 'EDITOR DE MAZO', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.03)}px`,
      color: '#FFD700', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5)

    // deck count
    this.deckCountText = this.add.text(W / 2, H * 0.09, '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.018)}px`,
      color: '#aaddff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)

    // left panel: pool
    const panelL = this.add.graphics()
    panelL.fillStyle(0x0a0a1a, 0.9)
    panelL.fillRoundedRect(W * 0.02, H * 0.12, W * 0.55, H * 0.76, 8)
    this.add.text(W * 0.295, H * 0.145, 'CARTAS DISPONIBLES', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#88aaff'
    }).setOrigin(0.5)

    // right panel: deck
    const panelR = this.add.graphics()
    panelR.fillStyle(0x0a0a1a, 0.9)
    panelR.fillRoundedRect(W * 0.59, H * 0.12, W * 0.39, H * 0.76, 8)
    this.add.text(W * 0.785, H * 0.145, 'MI MAZO', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#88ffaa'
    }).setOrigin(0.5)

    this.poolContainer = this.add.container(0, 0)
    this.deckListContainer = this.add.container(0, 0)

    // pagination buttons
    const btnPrev = this.add.text(W * 0.06, H * 0.92, '◀ PREV', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`,
      color: '#888888', padding: { x: 10, y: 8 }
    }).setInteractive({ useHandCursor: true })
    btnPrev.on('pointerover', () => btnPrev.setColor('#ffffff'))
    btnPrev.on('pointerout',  () => btnPrev.setColor('#888888'))
    btnPrev.on('pointerdown', () => { if (this.poolPage > 0) { this.poolPage--; this.redrawPool(); this.loadTCGForPage() } })

    const btnNext = this.add.text(W * 0.40, H * 0.92, 'NEXT ▶', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`,
      color: '#888888', padding: { x: 10, y: 8 }
    }).setInteractive({ useHandCursor: true })
    btnNext.on('pointerover', () => btnNext.setColor('#ffffff'))
    btnNext.on('pointerout',  () => btnNext.setColor('#888888'))
    btnNext.on('pointerdown', () => {
      const maxPage = Math.ceil(CARD_POOL.length / this.CARDS_PER_PAGE) - 1
      if (this.poolPage < maxPage) { this.poolPage++; this.redrawPool(); this.loadTCGForPage() }
    })

    // save button
    const btnSave = this.add.text(W * 0.785, H * 0.92, 'GUARDAR', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.018)}px`,
      color: '#00FF88', backgroundColor: '#002211', padding: { x: 16, y: 10 },
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnSave.on('pointerover', () => btnSave.setColor('#ffffff'))
    btnSave.on('pointerout',  () => btnSave.setColor('#00FF88'))
    btnSave.on('pointerdown', () => {
      const meta2 = loadMeta()
      meta2.legacyDeck = [...this.deck]
      saveMeta(meta2)
      this.showSaveFlash()
    })

    // back button
    const btnBack = this.add.text(W * 0.785, H * 0.96, '← VOLVER', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`,
      color: '#666688', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnBack.on('pointerover', () => btnBack.setColor('#ffffff'))
    btnBack.on('pointerout',  () => btnBack.setColor('#666688'))
    btnBack.on('pointerdown', () => this.scene.start('CardMenuScene'))

    this.redrawPool()
    this.redrawDeck()
    this.loadTCGForPage()
  }

  private async loadTCGForPage() {
    const startIdx = this.poolPage * this.CARDS_PER_PAGE
    const page = CARD_POOL.slice(startIdx, startIdx + this.CARDS_PER_PAGE)
    const toLoad: { key: string; url: string }[] = []
    for (const def of page) {
      const key = `tcg_${def.pokemonName.toLowerCase()}`
      if (!this.textures.exists(key)) {
        const url = await fetchTCGCardImage(def.pokemonName)
        if (url) toLoad.push({ key, url })
      }
    }
    if (!toLoad.length) return
    for (const { key, url } of toLoad) {
      if (!this.textures.exists(key)) this.load.image(key, url)
    }
    this.load.once('complete', () => this.redrawPool())
    this.load.start()
  }

  private redrawPool() {
    this.poolContainer.removeAll(true)
    const W = GAME_W, H = GAME_H
    const startIdx = this.poolPage * this.CARDS_PER_PAGE
    const page = CARD_POOL.slice(startIdx, startIdx + this.CARDS_PER_PAGE)
    const cols = 4
    const cardW = Math.round(W * 0.125)
    const cardH = Math.round(cardW * 1.55)
    const gapX = Math.round(W * 0.018)
    const gapY = Math.round(H * 0.022)
    const originX = W * 0.03
    const originY = H * 0.17

    page.forEach((def, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = originX + col * (cardW + gapX) + cardW / 2
      const cy = originY + row * (cardH + gapY) + cardH / 2
      const count = this.deck.filter(id => id === def.id).length
      const canAdd = this.deck.length < MAX_DECK && count < MAX_COPIES
      const c = this.buildMiniCard(def, cx, cy, cardW, cardH, canAdd)

      // count badge
      if (count > 0) {
        const badge = this.add.text(cx + cardW / 2 - 8, cy - cardH / 2 + 8, `×${count}`, {
          fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.012)}px`,
          color: '#FFD700', stroke: '#000', strokeThickness: 3
        }).setOrigin(1, 0)
        this.poolContainer.add(badge)
      }

      const hit = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 0).setInteractive({ useHandCursor: canAdd })
      hit.on('pointerover', () => {
        this.tweens.add({ targets: c, scaleX: 1.28, scaleY: 1.28, y: cy - 18, duration: 120, ease: 'Power2' })
      })
      hit.on('pointerout', () => {
        this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, y: cy, duration: 100, ease: 'Power2' })
      })
      hit.on('pointerdown', () => {
        if (!canAdd) return
        this.deck.push(def.id)
        this.redrawPool()
        this.redrawDeck()
      })
      this.poolContainer.add([c, hit])
    })

    // page indicator
    const maxPage = Math.ceil(CARD_POOL.length / this.CARDS_PER_PAGE) - 1
    const pageText = this.add.text(W * 0.295, H * 0.905, `${this.poolPage + 1} / ${maxPage + 1}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.013)}px`, color: '#888888'
    }).setOrigin(0.5)
    this.poolContainer.add(pageText)

    this.updateDeckCount()
  }

  private redrawDeck() {
    this.deckListContainer.removeAll(true)
    const W = GAME_W, H = GAME_H

    // group by card id
    const counts = new Map<string, number>()
    for (const id of this.deck) counts.set(id, (counts.get(id) ?? 0) + 1)
    const unique = [...counts.keys()]

    const rowH = Math.round(H * 0.048)
    const listX = W * 0.60
    const listY = H * 0.17
    const listW = W * 0.37

    unique.forEach((id, i) => {
      const def = CARD_POOL.find(c => c.id === id)
      if (!def) return
      const cnt = counts.get(id)!
      const y = listY + i * (rowH + 4)
      const typeCol = getTypeColor(def.type)

      const rowBg = this.add.graphics()
      rowBg.fillStyle(typeCol, 0.18)
      rowBg.fillRoundedRect(listX, y, listW, rowH, 4)
      this.deckListContainer.add(rowBg)

      // color strip left
      const strip = this.add.graphics()
      strip.fillStyle(typeCol, 0.8)
      strip.fillRoundedRect(listX, y, 4, rowH, 2)
      this.deckListContainer.add(strip)

      const catIcon = def.category === 'attack' ? '⚔' : def.category === 'defense' ? '🛡' : '✨'
      const nameText = this.add.text(listX + 12, y + rowH / 2, `${catIcon} ${def.nameEs}`, {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.012)}px`,
        color: '#ffffff', stroke: '#000', strokeThickness: 2
      }).setOrigin(0, 0.5)
      this.deckListContainer.add(nameText)

      const cntText = this.add.text(listX + listW - 26, y + rowH / 2, `×${cnt}`, {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.013)}px`, color: '#FFD700'
      }).setOrigin(0.5)
      this.deckListContainer.add(cntText)

      // remove button
      const removeBtn = this.add.text(listX + listW - 10, y + rowH / 2, '✕', {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.014)}px`, color: '#ff6666'
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      removeBtn.on('pointerover', () => removeBtn.setColor('#ffffff'))
      removeBtn.on('pointerout',  () => removeBtn.setColor('#ff6666'))
      removeBtn.on('pointerdown', () => {
        const idx = this.deck.lastIndexOf(id)
        if (idx !== -1) this.deck.splice(idx, 1)
        this.redrawPool()
        this.redrawDeck()
      })
      this.deckListContainer.add(removeBtn)
    })

    this.updateDeckCount()
  }

  private buildMiniCard(def: CardDef, cx: number, cy: number, w: number, h: number, canAdd: boolean): Phaser.GameObjects.Container {
    const c = this.add.container(cx, cy)
    const typeCol = getTypeColor(def.type)
    const r = 6
    const top = -h / 2
    const bot = top + h
    const overlayH = h * 0.35
    const overlayY = bot - overlayH
    const alpha = canAdd ? 1 : 0.4

    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.3)
    shadow.fillRoundedRect(-w/2 + 3, top + 3, w, h, r)
    c.add(shadow)

    const bg = this.add.graphics()
    bg.fillStyle(0x0d1020, 1)
    bg.fillRoundedRect(-w/2, top, w, h, r)
    c.add(bg)

    // full-bleed art (crop removes original card text at bottom)
    const imgKey = `tcg_${def.pokemonName.toLowerCase()}`
    if (this.textures.exists(imgKey)) {
      const frame = this.textures.get(imgKey).getSourceImage() as HTMLImageElement
      const img = this.add.image(0, 0, imgKey)
      img.setCrop(0, 0, frame.width, Math.floor(frame.height * 0.58))
      img.setDisplaySize(w - 2, h - 2).setOrigin(0.5).setAlpha(alpha)
      c.add(img)
    } else {
      const artBg = this.add.graphics()
      artBg.fillStyle(typeCol, alpha * 0.7)
      artBg.fillRoundedRect(-w/2 + 1, top + 1, w - 2, h - 2, r - 1)
      c.add(artBg)
      c.add(this.add.text(0, top + h * 0.35, def.pokemonName.charAt(0).toUpperCase(), {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(h * 0.32)}px`, color: '#ffffff'
      }).setOrigin(0.5).setAlpha(0.2))
    }

    // text overlay panel — color sampled from art
    const artBgCol = this.textures.exists(imgKey) ? this.sampleArtColor(imgKey, 0.58) : typeCol
    const panel = this.add.graphics()
    panel.fillGradientStyle(artBgCol, artBgCol, artBgCol, artBgCol, 0, 0, 0.92, 0.92)
    panel.fillRoundedRect(-w/2, overlayY, w, overlayH, { tl: 0, tr: 0, bl: r, br: r })
    c.add(panel)

    const nameFontSize = Math.max(5, Math.round(GAME_H * 0.011))
    const statFontSize = Math.max(5, Math.round(GAME_H * 0.013))
    const efFontSize   = Math.max(4, Math.round(GAME_H * 0.009))

    c.add(this.add.text(0, overlayY + overlayH * 0.18, def.nameEs, {
      fontFamily: '"Press Start 2P"', fontSize: `${nameFontSize}px`,
      color: '#FFFFFF', stroke: '#000', strokeThickness: 5,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 4, fill: true },
      wordWrap: { width: w - 4 }, align: 'center'
    }).setOrigin(0.5).setAlpha(alpha))

    // stat line
    const catIcon   = def.category === 'attack' ? '⚔' : def.category === 'defense' ? '🛡' : '✨'
    const statColor = def.category === 'attack' ? '#FFD0D0' : def.category === 'defense' ? '#D0E8FF' : '#D0FFD0'
    const statStr   = def.damage ? `${catIcon} ${def.damage}` : def.shield ? `${catIcon} ${def.shield}` : def.heal ? `${catIcon}+${def.heal}` : def.draw ? `${catIcon}×${def.draw}` : catIcon
    c.add(this.add.text(0, overlayY + overlayH * 0.50, statStr, {
      fontFamily: '"Press Start 2P"', fontSize: `${statFontSize}px`,
      color: statColor, stroke: '#000', strokeThickness: 5,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 4, fill: true }
    }).setOrigin(0.5).setAlpha(alpha))

    // effect description
    const descStr = def.effect ?? (
      def.damage ? `Daño ${def.damage}` :
      def.shield ? `Bloquea ${def.shield}` :
      def.heal   ? `Cura ${def.heal} PS` :
      def.draw   ? `Roba ${def.draw} cartas` : ''
    )
    if (descStr) {
      c.add(this.add.text(0, overlayY + overlayH * 0.76, descStr, {
        fontFamily: '"Press Start 2P"', fontSize: `${efFontSize}px`,
        color: '#FFFFFF', stroke: '#000', strokeThickness: 4,
        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 3, fill: true },
        wordWrap: { width: w - 4 }, align: 'center'
      }).setOrigin(0.5).setAlpha(alpha))
    }

    // energy badge
    const eb = this.add.graphics()
    eb.fillStyle(0x003322, 0.9)
    eb.fillCircle(-w/2 + 9, top + 9, 8)
    eb.lineStyle(1, 0x00FF88)
    eb.strokeCircle(-w/2 + 9, top + 9, 8)
    c.add(eb)
    c.add(this.add.text(-w/2 + 9, top + 9, String(def.energy), {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.010)}px`, color: '#AAFFDD'
    }).setOrigin(0.5))

    // rarity dot
    c.add(this.add.text(w/2 - 8, top + 8,
      def.rarity === 'rare' ? '★' : def.rarity === 'uncommon' ? '◆' : '●', {
        fontSize: `${Math.round(GAME_H * 0.011)}px`,
        color: def.rarity === 'rare' ? '#FFD700' : def.rarity === 'uncommon' ? '#88CCFF' : '#666666'
      }).setOrigin(0.5))

    // border
    const rarityCol = def.rarity === 'rare' ? 0xFFD700 : def.rarity === 'uncommon' ? 0x88CCFF : 0x555555
    const border = this.add.graphics()
    border.lineStyle(canAdd ? (def.rarity === 'rare' ? 2 : 1) : 1, canAdd ? rarityCol : 0x333333, canAdd ? 0.9 : 0.3)
    border.strokeRoundedRect(-w/2, top, w, h, r)
    c.add(border)

    return c
  }

  private updateDeckCount() {
    const n = this.deck.length
    const color = n >= MAX_DECK ? '#FF6666' : n >= MAX_DECK * 0.8 ? '#FFD700' : '#aaddff'
    this.deckCountText.setText(`MAZO: ${n} / ${MAX_DECK}`).setColor(color)
  }

  private showSaveFlash() {
    const W = GAME_W, H = GAME_H
    const txt = this.add.text(W / 2, H * 0.5, '¡GUARDADO!', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.04)}px`,
      color: '#00FF88', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: txt, alpha: 1, duration: 150, yoyo: true, hold: 600 })
  }

  private sampleArtColor(key: string, cropFraction: number): number {
    try {
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement
      const sampleY = Math.floor(src.height * cropFraction * 0.88)
      const canvas = document.createElement('canvas')
      canvas.width = src.width; canvas.height = src.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(src, 0, 0)
      let r = 0, g = 0, b = 0, n = 0
      const step = Math.max(1, Math.floor(src.width / 6))
      for (let x = step; x < src.width - step; x += step) {
        const px = ctx.getImageData(x, sampleY, 1, 1).data
        r += px[0]; g += px[1]; b += px[2]; n++
      }
      return ((Math.floor(r/n) << 16) | (Math.floor(g/n) << 8) | Math.floor(b/n))
    } catch { return 0x111111 }
  }
}
