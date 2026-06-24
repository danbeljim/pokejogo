import Phaser from 'phaser'
import { CardRunState } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'

export default class CardActTransitionScene extends Phaser.Scene {
  constructor() { super('CardActTransitionScene') }

  create(data: { gold: number }) {
    const run = this.registry.get('cardRunState') as CardRunState
    if (!run) { this.scene.start('CardMenuScene'); return }

    const completedAct = Math.floor(run.floor / 3) + 1
    const nextAct = completedAct + 1

    const bonusHp = 20
    run.playerHp = Math.min(run.playerMaxHp, run.playerHp + bonusHp)
    // Advance floor so next SafariMapScene generates next act
    run.floor = completedAct * 3
    this.registry.set('cardRunState', run)
    // Clear safari state so new act generates fresh map
    this.registry.remove('safariState')

    const actBgColors: Record<number, string> = {
      1: '#080818', 2: '#081408', 3: '#180808',
      4: '#100818', 5: '#08100a', 6: '#181008'
    }
    const actTitleColors: Record<number, string> = {
      1: '#88aaff', 2: '#88ffaa', 3: '#ffaa88',
      4: '#dd88ff', 5: '#88ffee', 6: '#ffee88'
    }
    const actNames: Record<number, string> = {
      1: 'SAFARI ZONA A',
      2: 'SAFARI ZONA B',
      3: 'SAFARI ZONA C',
      4: 'SAFARI ZONA D',
      5: 'SAFARI ZONA E',
      6: 'SAFARI ZONA F',
    }

    this.cameras.main.setBackgroundColor(actBgColors[completedAct] ?? '#080818')

    const cx = GAME_W / 2
    const cy = GAME_H / 2
    const titleColor = actTitleColors[completedAct] ?? '#ffffff'

    const g = this.add.graphics()
    g.fillStyle(0x000000, 0.7)
    g.fillRect(0, 0, GAME_W, GAME_H)

    const bannerH = GAME_H * 0.55
    const banner = this.add.graphics()
    banner.fillStyle(0x0a0a1a, 0.95)
    banner.fillRoundedRect(GAME_W * 0.15, cy - bannerH / 2, GAME_W * 0.7, bannerH, 16)
    banner.lineStyle(2, 0x334466, 1)
    banner.strokeRoundedRect(GAME_W * 0.15, cy - bannerH / 2, GAME_W * 0.7, bannerH, 16)

    this.add.text(cx, cy - bannerH * 0.38, `ACTO ${completedAct} COMPLETADO`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.028)}px`,
      color: titleColor, stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0)

    this.add.text(cx, cy - bannerH * 0.18, actNames[completedAct] ?? '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.018)}px`, color: '#aaaacc'
    }).setOrigin(0.5).setAlpha(0)

    const divG = this.add.graphics()
    divG.lineStyle(1, 0x334466, 0.6)
    divG.strokeLineShape(new Phaser.Geom.Line(GAME_W * 0.2, cy, GAME_W * 0.8, cy))
    divG.setAlpha(0)

    this.add.text(cx, cy + bannerH * 0.06, `+${bonusHp} PS recuperados`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.018)}px`, color: '#FF8888'
    }).setOrigin(0.5).setAlpha(0)

    this.add.text(cx, cy + bannerH * 0.16, `+${data.gold} oro`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.018)}px`, color: '#FFD700'
    }).setOrigin(0.5).setAlpha(0)

    const nextActColor = actTitleColors[nextAct] ?? '#ffffff'
    this.add.text(cx, cy + bannerH * 0.29, `> ACTO ${nextAct}: ${actNames[nextAct] ?? ''}`, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.016)}px`, color: nextActColor
    }).setOrigin(0.5).setAlpha(0)

    const btn = this.add.text(cx, cy + bannerH * 0.43, 'CONTINUAR', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(GAME_H * 0.022)}px`,
      color: '#ffffff', backgroundColor: '#1a3a1a', padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true })

    btn.on('pointerover', () => btn.setColor('#FFD700'))
    btn.on('pointerout', () => btn.setColor('#ffffff'))
    btn.on('pointerdown', () => this.scene.start('SafariMapScene'))

    const allTexts = this.children.list.filter(o => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[]
    this.tweens.add({ targets: allTexts, alpha: 1, duration: 600, ease: 'Power2' })
    this.tweens.add({ targets: divG, alpha: 1, delay: 300, duration: 400 })
  }
}
