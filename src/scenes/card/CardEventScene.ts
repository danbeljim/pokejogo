import Phaser from 'phaser'
import { CardRunState, getCardById, getCardsByRarity } from '../../data/CardData'
import { GAME_W, GAME_H } from '../../main'

interface EventDef {
  id: string
  title: string
  description: string
  icon: string
  options: {
    label: string
    desc: string
    effect: (run: CardRunState) => string
  }[]
}

const EVENTS: EventDef[] = [
  {
    id: 'shrine',
    title: 'Santuario PokÃ©mon',
    description: 'Encuentras un santuario antiguo. Un espÃ­ritu te ofrece su poder...',
    icon: 'ðŸ›ï¸',
    options: [
      { label: 'Ofrendar 30 oro', desc: '+20 PS mÃ¡ximos permanentes',
        effect: run => { if (run.gold < 30) return 'Sin oro suficiente.'; run.gold -= 30; run.playerMaxHp += 20; run.playerHp = Math.min(run.playerHp + 20, run.playerMaxHp); return 'Â¡+20 PS mÃ¡x!' } },
      { label: 'Ignorar', desc: 'Sigues tu camino',
        effect: _ => 'Pasas de largo.' },
    ]
  },
  {
    id: 'merchant_traveler',
    title: 'Mercader Viajero',
    description: 'Un comerciante misterioso ofrece algo especial...',
    icon: 'ðŸ§™',
    options: [
      { label: 'Pagar 40 oro', desc: 'ObtÃ©n una carta rara aleatoria',
        effect: run => { if (run.gold < 40) return 'Sin oro suficiente.'; run.gold -= 40; const rares = getCardsByRarity('rare'); const card = rares[Math.floor(Math.random() * rares.length)]; run.deck.push(card.id); return `Â¡Obtuviste: ${card.nameEs}!` } },
      { label: 'Rechazar', desc: 'No te interesa',
        effect: _ => 'Rechazas la oferta.' },
    ]
  },
  {
    id: 'potion',
    title: 'PociÃ³n Encontrada',
    description: 'Encuentras una mochila abandonada con suministros.',
    icon: 'ðŸŽ’',
    options: [
      { label: 'Tomar la pociÃ³n', desc: 'Recupera 25 PS',
        effect: run => { const prev = run.playerHp; run.playerHp = Math.min(run.playerMaxHp, run.playerHp + 25); return `+${run.playerHp - prev} PS recuperados` } },
      { label: 'Tomar el oro', desc: '+25 oro',
        effect: run => { run.gold += 25; return '+25 oro!' } },
    ]
  },
  {
    id: 'ditto',
    title: 'Â¡Ditto!',
    description: 'Ditto aparece y copia una carta de tu mazo. Â¿Le dejas quedÃ¡rsela?',
    icon: 'ðŸ’œ',
    options: [
      { label: 'Copiar a cambio', desc: '+1 copia de carta aleatoria de tu mazo',
        effect: run => { if (run.deck.length === 0) return 'Mazo vacÃ­o.'; const id = run.deck[Math.floor(Math.random() * run.deck.length)]; run.deck.push(id); const def = getCardById(id); return `Â¡Copia de ${def?.nameEs ?? id}!` } },
      { label: 'Ignorar', desc: 'Ditto se escapa',
        effect: _ => 'Ditto se va.' },
    ]
  },
  {
    id: 'curse',
    title: 'MaldiciÃ³n Antigua',
    description: 'Una energÃ­a oscura te rodea. Puedes absorberla o resistirla.',
    icon: 'ðŸ’€',
    options: [
      { label: 'Absorber', desc: '+3 cartas raras al mazo, -20 PS mÃ¡x',
        effect: run => { const rares = getCardsByRarity('rare'); for (let i = 0; i < 3; i++) { const r = rares[Math.floor(Math.random() * rares.length)]; run.deck.push(r.id) } run.playerMaxHp = Math.max(20, run.playerMaxHp - 20); run.playerHp = Math.min(run.playerHp, run.playerMaxHp); return '3 cartas raras + -20 PS mÃ¡x.' } },
      { label: 'Resistir', desc: 'Nada ocurre',
        effect: _ => 'Resistes la maldiciÃ³n.' },
    ]
  },
]

export default class CardEventScene extends Phaser.Scene {
  private run!: CardRunState
  private event!: EventDef
  private resultText?: Phaser.GameObjects.Text

  constructor() { super('CardEventScene') }

  create() {
    this.run = this.registry.get('cardRunState') as CardRunState
    if (!this.run) { this.scene.start('CardMenuScene'); return }

    this.event = EVENTS[Math.floor(Math.random() * EVENTS.length)]
    this.cameras.main.setBackgroundColor('#050510')

    const W = GAME_W, H = GAME_H, cx = W / 2

    // bg stars
    for (let i = 0; i < 50; i++) this.add.circle(Math.random()*W, Math.random()*H, Math.random()*1.5+0.5, 0xffffff, Math.random()*0.4+0.1)

    this.add.text(cx, H * 0.06, this.event.icon + '  ' + this.event.title, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.032)}px`,
      color: '#AADDFF', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5)

    this.add.text(cx, H * 0.2, this.event.description, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.018)}px`,
      color: '#cccccc', align: 'center', wordWrap: { width: W * 0.7 }
    }).setOrigin(0.5)

    this.event.options.forEach((opt, i) => {
      const y = H * 0.42 + i * (H * 0.16)
      this.createOptionBtn(cx, y, opt.label, opt.desc, opt.effect)
    })

    this.resultText = this.add.text(cx, H * 0.78, '', {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.02)}px`,
      color: '#00FF88', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5)
  }

  private createOptionBtn(cx: number, y: number, label: string, desc: string, effect: (run: CardRunState) => string) {
    const W = GAME_W, H = GAME_H
    const w = W * 0.52, h = H * 0.12

    const g = this.add.graphics()
    g.fillStyle(0x0e0e22, 0.95)
    g.fillRoundedRect(cx - w/2, y - h/2, w, h, 12)
    g.lineStyle(2, 0x4455bb)
    g.strokeRoundedRect(cx - w/2, y - h/2, w, h, 12)

    this.add.text(cx, y - h * 0.18, label, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.02)}px`, color: '#ffffff'
    }).setOrigin(0.5)
    this.add.text(cx, y + h * 0.2, desc, {
      fontFamily: '"Press Start 2P"', fontSize: `${Math.round(H * 0.013)}px`, color: '#8888aa'
    }).setOrigin(0.5)

    const hit = this.add.rectangle(cx, y, w, h, 0xffffff, 0).setInteractive({ useHandCursor: true })
    hit.on('pointerover', () => { g.clear(); g.fillStyle(0x1a1a3a, 0.98); g.fillRoundedRect(cx-w/2, y-h/2, w, h, 12); g.lineStyle(3, 0x88aaff); g.strokeRoundedRect(cx-w/2, y-h/2, w, h, 12) })
    hit.on('pointerout',  () => { g.clear(); g.fillStyle(0x0e0e22, 0.95); g.fillRoundedRect(cx-w/2, y-h/2, w, h, 12); g.lineStyle(2, 0x4455bb); g.strokeRoundedRect(cx-w/2, y-h/2, w, h, 12) })
    hit.on('pointerdown', () => {
      hit.disableInteractive()
      const result = effect(this.run)
      this.registry.set('cardRunState', this.run)
      this.resultText?.setText(result)
      this.time.delayedCall(1800, () => this.scene.start('SafariMapScene'))
    })
  }
}
