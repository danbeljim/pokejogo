import Phaser from 'phaser'
import { CardRunState, loadMeta, saveMeta } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'

export default class CardDeathScene extends Phaser.Scene {
  constructor() { super('CardDeathScene') }

  init(data: { won?: boolean; gold?: number }) {
    const run = this.registry.get('cardRunState') as CardRunState
    if (!run) return

    const won = data?.won ?? false
    const meta = loadMeta()

    meta.totalRuns++
    if (run.floor > meta.bestFloor) meta.bestFloor = run.floor

    // persist deck for next run (legacy deck mechanic)
    meta.legacyDeck = [...run.deck]

    // star dust: floor reached * 5 + (win bonus 30)
    const earned = run.floor * 5 + (won ? 30 : 0)
    meta.starDust += earned

    saveMeta(meta)
    this.registry.set('cardDeathEarned', earned)
    this.registry.set('cardDeathWon', won)
    this.registry.set('cardDeathFloor', run.floor)
    this.registry.set('cardDeathDeckSize', run.deck.length)

    // clear run state
    this.registry.remove('cardRunState')
    this.registry.remove('cardMap')
    this.registry.remove('cardCurrentNode')
  }

  create() {
    const W = GAME_W, H = GAME_H, cx = W / 2
    const won   = this.registry.get('cardDeathWon') as boolean
    const floor = this.registry.get('cardDeathFloor') as number ?? 0
    const earned = this.registry.get('cardDeathEarned') as number ?? 0
    const meta  = loadMeta()

    this.cameras.main.setBackgroundColor(won ? '#060f06' : '#0f0606')

    // bg particles
    for (let i = 0; i < 60; i++) {
      const color = won ? 0xFFD700 : 0xff3333
      this.add.circle(Math.random() * W, Math.random() * H, Math.random() * 2 + 0.5, color, Math.random() * 0.4 + 0.1)
    }

    const title = won ? '🏆 ¡VICTORIA TOTAL!' : '💀 DERROTA'
    const titleColor = won ? '#FFD700' : '#FF4444'
    this.add.text(cx, H * 0.1, title, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.05)}px`,
      color: titleColor, stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5)

    if (won) {
      this.add.text(cx, H * 0.2, '¡Has derrotado al Boss final!', {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.022)}px`, color: '#88ff88'
      }).setOrigin(0.5)
    } else {
      this.add.text(cx, H * 0.2, 'Tu aventura termina aquí...', {
        fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.022)}px`, color: '#ff8888'
      }).setOrigin(0.5)
    }

    // stats panel
    const panelW = W * 0.5, panelH = H * 0.32
    const px = cx - panelW / 2, py = H * 0.28
    const g = this.add.graphics()
    g.fillStyle(0x0a0a18, 0.92)
    g.fillRoundedRect(px, py, panelW, panelH, 14)
    g.lineStyle(2, won ? 0xFFD700 : 0x884444)
    g.strokeRoundedRect(px, py, panelW, panelH, 14)

    const fs = Math.round(H * 0.02)
    const col1 = px + panelW * 0.1
    const col2 = cx

    const row = (label: string, val: string | number, y: number, color = '#FFD700') => {
      this.add.text(col1, y, label, { fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color: '#aaaaaa' })
      this.add.text(col2 + panelW * 0.05, y, String(val), { fontFamily: '"Press Start 2P"', fontSize: `${fs}px`, color })
    }

    row('Piso alcanzado:',   floor, py + panelH * 0.12)
    row('Polvo Estelar:',    `+${earned}`, py + panelH * 0.3, '#AADDFF')
    row('Total acumulado:',  meta.starDust, py + panelH * 0.48, '#AADDFF')
    row('Mejor piso:',       meta.bestFloor, py + panelH * 0.66)
    row('Total partidas:',   meta.totalRuns, py + panelH * 0.84, '#cccccc')

    // legacy deck message
    const deckSize = this.registry.get('cardDeathDeckSize') as number ?? 0
    this.add.text(cx, H * 0.64, `Tu mazo (${deckSize} cartas) fue heredado al proximo run.`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.013)}px`,
      color: '#88ffaa', align: 'center', wordWrap: { width: W * 0.65 }
    }).setOrigin(0.5)

    // meta progress hint
    this.add.text(cx, H * 0.69, '✨ Usa el Polvo Estelar para desbloquear mejoras', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.013)}px`,
      color: '#AADDFF', align: 'center', wordWrap: { width: W * 0.65 }
    }).setOrigin(0.5)

    const btnRetry = this.add.text(cx - W * 0.12, H * 0.8, '▶ NUEVO RUN', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.024)}px`,
      color: '#00FF88', backgroundColor: '#002211', padding: { x: 22, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnRetry.on('pointerover', () => btnRetry.setColor('#ffffff'))
    btnRetry.on('pointerout',  () => btnRetry.setColor('#00FF88'))
    btnRetry.on('pointerdown', () => this.scene.start('CardMenuScene'))

    const btnMenu = this.add.text(cx + W * 0.14, H * 0.8, '🏠 MEJORAS', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.024)}px`,
      color: '#AADDFF', backgroundColor: '#001122', padding: { x: 22, y: 14 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btnMenu.on('pointerover', () => btnMenu.setColor('#ffffff'))
    btnMenu.on('pointerout',  () => btnMenu.setColor('#AADDFF'))
    btnMenu.on('pointerdown', () => this.scene.start('CardMenuScene'))
  }
}
