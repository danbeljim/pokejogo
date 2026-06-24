import Phaser from 'phaser'
import { CardRunState, CardDef, getRandomRewardCards, getTypeColor } from '../../data/CardData'
import { fetchTCGCardImage } from '../../utils/TcgApi'
import { GAME_W, GAME_H } from '../../main'

export default class CardRewardScene extends Phaser.Scene {
  private run!: CardRunState
  private choices: CardDef[] = []
  private choiceContainers: Phaser.GameObjects.Container[] = []

  constructor() { super('CardRewardScene') }

  create() {
    this.run = this.registry.get('cardRunState') as CardRunState
    if (!this.run) { this.scene.start('CardMenuScene'); return }

    this.choices = getRandomRewardCards(this.run, this.run.cardChoices)
    this.cameras.main.setBackgroundColor('#080818')

    const W = GAME_W, H = GAME_H, cx = W / 2

    for (let i = 0; i < 40; i++) {
      this.add.circle(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, 0xffffff, Math.random() * 0.3 + 0.1)
    }

    this.add.text(cx, H * 0.06, '¡VICTORIA!', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.045)}px`,
      color: '#FFD700', stroke: '#aa4400', strokeThickness: 6
    }).setOrigin(0.5)

    this.add.text(cx, H * 0.14, 'Elige una carta para tu mazo', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.022)}px`,
      color: '#aaddff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)

    this.drawChoices()

    const btnSkip = this.add.text(cx, H * 0.93, 'Saltar recompensa', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.016)}px`,
      color: '#666688', padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnSkip.on('pointerover', () => btnSkip.setColor('#ffffff'))
    btnSkip.on('pointerout',  () => btnSkip.setColor('#666688'))
    btnSkip.on('pointerdown', () => this.proceed())

    this.loadTCGImages()
  }

  private drawChoices() {
    this.choiceContainers.forEach(c => c.destroy())
    this.choiceContainers = []
    const W = GAME_W, H = GAME_H
    const cardW = Math.round(H * 0.28)
    const cardH = Math.round(H * 0.56)
    const gap = W * 0.045
    const total = this.choices.length * cardW + (this.choices.length - 1) * gap
    const startX = W / 2 - total / 2

    this.choices.forEach((def, i) => {
      const x = startX + i * (cardW + gap) + cardW / 2
      const y = H * 0.56
      const c = this.createCard(def, x, y, cardW, cardH)
      this.choiceContainers.push(c)
    })
  }

  private createCard(def: CardDef, x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    const typeCol = getTypeColor(def.type)
    const r = 10
    const artH   = h * 0.78
    const stripH = h * 0.05
    const textH  = h - artH - stripH
    const top    = -h / 2
    const artBot = top + artH
    const stripBot = artBot + stripH
    const rarityCol = def.rarity === 'rare' ? 0xFFD700 : def.rarity === 'uncommon' ? 0x88CCFF : 0x888888
    const borderW   = def.rarity === 'rare' ? 3 : 2

    // shadow
    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.4)
    shadow.fillRoundedRect(-w/2 + 5, top + 5, w, h, r)
    container.add(shadow)

    // base bg
    const bg = this.add.graphics()
    bg.fillStyle(0x0d1020, 1)
    bg.fillRoundedRect(-w/2, top, w, h, r)
    container.add(bg)

    // art
    const imgKey = `tcg_${def.pokemonName.toLowerCase()}`
    if (this.textures.exists(imgKey)) {
      const frame = this.textures.get(imgKey).getSourceImage() as HTMLImageElement
      const cropH = Math.floor(frame.height * 0.55)
      const img = this.add.image(0, top + artH / 2, imgKey)
      img.setCrop(0, 0, frame.width, cropH)
      img.setDisplaySize(w - 4, artH).setOrigin(0.5)
      container.add(img)
    } else {
      const artBg = this.add.graphics()
      artBg.fillStyle(typeCol, 0.75)
      artBg.fillRoundedRect(-w/2 + 2, top + 2, w - 4, artH - 2, { tl: r - 2, tr: r - 2, bl: 0, br: 0 })
      artBg.fillStyle(0x000000, 0.45)
      artBg.fillRect(-w/2 + 2, top + artH * 0.55, w - 4, artH * 0.45)
      container.add(artBg)
      const pkKey = `poke_${def.pokemonName.toLowerCase().replace(/[^a-z0-9-]/g, '')}`
      if (this.textures.exists(pkKey)) {
        const pkImg = this.add.image(0, top + artH * 0.5, pkKey)
        pkImg.setDisplaySize(Math.round(artH * 0.75), Math.round(artH * 0.75)).setOrigin(0.5)
        try { this.textures.get(pkKey).setFilter(Phaser.Textures.FilterMode.NEAREST) } catch {}
        container.add(pkImg)
      } else {
        container.add(this.add.text(0, top + artH * 0.42, def.pokemonName.charAt(0).toUpperCase(), {
          fontFamily: '"Press Start 2P"', fontSize: `${Math.round(artH * 0.42)}px`, color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0.22))
      }
      container.add(this.add.text(0, top + artH * 0.88, def.pokemonName.toUpperCase(), {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.max(5, Math.round(w * 0.06))}px`,
        color: '#ffffff', stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0.7))
    }

    // shimmer on rare/uncommon
    if (def.rarity !== 'common') {
      const shimmer = this.add.graphics()
      shimmer.fillStyle(0xffffff, 0.18)
      shimmer.fillRect(-w/2 + 2, top + 2, w * 0.22, artH - 2)
      container.add(shimmer)
      this.tweens.add({
        targets: shimmer, x: w * 1.1,
        duration: def.rarity === 'rare' ? 1200 : 1800,
        ease: 'Sine.easeInOut', repeat: -1,
        repeatDelay: def.rarity === 'rare' ? 600 : 1400
      })
    }

    // type strip
    const strip = this.add.graphics()
    strip.fillStyle(typeCol, 0.9)
    strip.fillRect(-w/2, artBot, w, stripH)
    container.add(strip)
    container.add(this.add.text(0, artBot + stripH / 2, def.type.toUpperCase(), {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.max(5, Math.round(stripH * 0.55))}px`,
      color: '#ffffff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5))

    // text panel
    const panel = this.add.graphics()
    panel.fillStyle(0x080c18, 0.97)
    panel.fillRoundedRect(-w/2, stripBot, w, textH, { tl: 0, tr: 0, bl: r, br: r })
    container.add(panel)

    container.add(this.add.text(0, stripBot + textH * 0.22, def.nameEs, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.max(6, Math.round(GAME_H * 0.014))}px`,
      color: '#ffffff', stroke: '#000000', strokeThickness: 3,
      wordWrap: { width: w - 10 }, align: 'center'
    }).setOrigin(0.5))

    const catIcon  = def.category === 'attack' ? '⚔' : def.category === 'defense' ? '🛡' : '✨'
    const statColor = def.category === 'attack' ? '#FF6666' : def.category === 'defense' ? '#66AAFF' : '#AAFFAA'
    const statStr  = def.damage ? `${catIcon} ${def.damage}` : def.shield ? `${catIcon} ${def.shield}` : def.heal ? `${catIcon} +${def.heal}` : def.draw ? `${catIcon} x${def.draw}` : catIcon
    container.add(this.add.text(0, stripBot + textH * 0.58, statStr, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.018)}px`,
      color: statColor, stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5))

    if (def.effect) {
      container.add(this.add.text(0, stripBot + textH * 0.85, def.effect, {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.max(5, Math.round(GAME_H * 0.009))}px`,
        color: '#AADDFF', stroke: '#000', strokeThickness: 2,
        wordWrap: { width: w - 10 }, align: 'center'
      }).setOrigin(0.5).setAlpha(0.85))
    }

    // energy badge
    const eBadgeBg = this.add.graphics()
    eBadgeBg.fillStyle(0x004422, 0.95)
    eBadgeBg.fillCircle(-w/2 + 14, top + 14, 13)
    eBadgeBg.lineStyle(2, 0x00FF88, 0.9)
    eBadgeBg.strokeCircle(-w/2 + 14, top + 14, 13)
    container.add(eBadgeBg)
    container.add(this.add.text(-w/2 + 14, top + 14, String(def.energy), {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.015)}px`, color: '#AAFFDD'
    }).setOrigin(0.5))

    // rarity badge
    container.add(this.add.text(w/2 - 13, top + 13,
      def.rarity === 'rare' ? '★' : def.rarity === 'uncommon' ? '◆' : '●', {
        fontSize: `${Math.round(GAME_H * 0.016)}px`,
        color: def.rarity === 'rare' ? '#FFD700' : def.rarity === 'uncommon' ? '#88CCFF' : '#888888'
      }).setOrigin(0.5))

    // border
    const border = this.add.graphics()
    const drawBorder = (highlight = false) => {
      border.clear()
      border.lineStyle(highlight ? 3 : borderW, highlight ? 0xFFFFFF : rarityCol, highlight ? 1 : 0.9)
      border.strokeRoundedRect(-w/2, top, w, h, r)
    }
    drawBorder()
    container.add(border)

    const baseY = y
    const hit = this.add.rectangle(0, 0, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true })
    container.add(hit)
    hit.on('pointerover', () => {
      drawBorder(true)
      this.tweens.add({ targets: container, y: baseY - 20, rotation: -0.04, scale: 1.05, duration: 120, ease: 'Power2' })
    })
    hit.on('pointerout', () => {
      drawBorder(false)
      this.tweens.add({ targets: container, y: baseY, rotation: 0, scale: 1, duration: 120, ease: 'Power2' })
    })
    hit.on('pointerdown', () => this.pickCard(def))
    return container
  }

  private pickCard(def: CardDef) {
    this.run.deck.push(def.id)
    this.registry.set('cardRunState', this.run)
    this.proceed()
  }

  private proceed() {
    this.scene.start('SafariMapScene')
  }

  private async loadTCGImages() {
    const toLoad: { key: string; url: string }[] = []
    for (const def of this.choices) {
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
    this.load.once('complete', () => { this.drawChoices() })
    this.load.start()
  }
}
