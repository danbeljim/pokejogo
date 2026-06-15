import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, VITAMINS } from '../data/Items'
import { POSITIVE_TRAIT_IDS, ROGUE_TRAITS, applyTraitStats } from '../data/RoguelikeData'

export interface BerryTreeData {
  playerTeam: Pokemon[]
  playerBag: Item[]
  onComplete: () => void
}

export default class BerryTreeScene extends Phaser.Scene {
  private data_!: BerryTreeData
  private overlay?: HTMLDivElement

  constructor() { super('BerryTreeScene') }

  init(d: BerryTreeData) { this.data_ = d }

  create() {
    this.cameras.main.setBackgroundColor('#00000000')
    this.overlay = this.buildOverlay()
    document.body.appendChild(this.overlay)
  }

  private buildOverlay(): HTMLDivElement {
    const wrap = document.createElement('div')
    wrap.style.cssText = `
      position:fixed; inset:0; background:rgba(5,20,10,0.97);
      display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      z-index:9999; font-family:Arial,sans-serif; overflow-y:auto; padding:20px 0 24px;
    `

    const title = document.createElement('h2')
    title.textContent = '🍓 Árbol de Bayas'
    title.style.cssText = 'color:#FF4499; margin-bottom:8px; font-size:clamp(18px,4vw,28px); text-align:center;'
    wrap.appendChild(title)

    const sub = document.createElement('p')
    sub.textContent = 'Elige una recompensa:'
    sub.style.cssText = 'color:#aaffaa; font-size:14px; margin-bottom:24px; text-align:center;'
    wrap.appendChild(sub)

    const options = [
      { emoji: '🍓', name: 'Baya Frambu', desc: 'Cura el 50% de PS\na todo el equipo', action: () => this.healTeam() },
      { emoji: '🫐', name: 'Baya Zidra', desc: 'Un pokémon recibe\nun rasgo positivo', action: () => this.buffTeam(wrap) },
      { emoji: '🍒', name: 'Baya Pecha', desc: 'Obtienes 2 vitaminas\naleatorias', action: () => this.giveItems() },
    ]

    const row = document.createElement('div')
    const isMobile = window.innerWidth < 700
    row.style.cssText = `display:flex; gap:${isMobile ? '8px' : '32px'}; justify-content:center; flex-wrap:wrap; padding:0 8px;`
    wrap.appendChild(row)

    options.forEach(opt => {
      const card = document.createElement('div')
      const cardW = isMobile ? `${Math.floor((window.innerWidth - 48) / 3)}px` : '180px'
      card.style.cssText = `
        background:#0a2010; border:2px solid #FF4499; border-radius:12px;
        padding:${isMobile ? '10px 6px' : '20px'}; width:${cardW}; text-align:center;
        cursor:pointer; transition:transform 0.15s, border-color 0.15s; box-sizing:border-box;
      `
      card.onmouseenter = () => { card.style.transform = 'scale(1.05)'; card.style.borderColor = '#FFD700' }
      card.onmouseleave = () => { card.style.transform = ''; card.style.borderColor = '#FF4499' }

      card.innerHTML = `
        <div style="font-size:${isMobile ? '28px' : '48px'};margin-bottom:8px">${opt.emoji}</div>
        <div style="color:#fff;font-size:${isMobile ? '11px' : '16px'};font-weight:bold;margin-bottom:6px">${opt.name}</div>
        <div style="color:#aaffaa;font-size:${isMobile ? '9px' : '12px'};margin-bottom:${isMobile ? '8px' : '16px'};white-space:pre-line">${opt.desc}</div>
      `
      const btn = document.createElement('button')
      btn.textContent = 'Elegir'
      btn.style.cssText = `
        background:#0a2010; color:#FFD700; border:1px solid #FFD700;
        padding:${isMobile ? '5px 8px' : '8px 20px'}; font-size:${isMobile ? '11px' : '14px'};
        font-weight:bold; border-radius:6px; cursor:pointer; width:100%;
      `
      btn.onclick = () => opt.action()
      card.appendChild(btn)
      row.appendChild(card)
    })

    return wrap
  }

  private healTeam() {
    this.data_.playerTeam.forEach(p => p.heal(Math.floor(p.maxHp * 0.5)))
    this.done()
  }

  private buffTeam(wrap: HTMLDivElement) {
    // Show team picker to apply buff
    wrap.innerHTML = ''
    const title = document.createElement('h2')
    title.textContent = '🫐 ¿A qué Pokémon?'
    title.style.cssText = 'color:#FF4499; margin-bottom:20px; font-size:clamp(16px,4vw,24px); text-align:center; margin-top:20px;'
    wrap.appendChild(title)

    const row = document.createElement('div')
    row.style.cssText = 'display:flex; gap:12px; flex-wrap:wrap; justify-content:center; padding:0 12px;'
    wrap.appendChild(row)

    this.data_.playerTeam.forEach(p => {
      const btn = document.createElement('button')
      btn.style.cssText = `
        background:#0a2010; color:#fff; border:2px solid #FF4499;
        padding:10px 16px; font-size:14px; border-radius:8px; cursor:pointer;
      `
      btn.textContent = `${p.name} Nv.${p.level}`
      btn.onclick = () => {
        const posTraits = ROGUE_TRAITS.filter(t => POSITIVE_TRAIT_IDS.includes(t.id) && !p.traits.includes(t.id))
        if (posTraits.length > 0) {
          const trait = posTraits[Math.floor(Math.random() * posTraits.length)]
          p.traits.push(trait.id)
          applyTraitStats(p, trait)
        }
        this.done()
      }
      row.appendChild(btn)
    })
  }

  private giveItems() {
    const picks = [...VITAMINS].sort(() => Math.random() - 0.5).slice(0, 2)
    picks.forEach(v => this.data_.playerBag.push(v))
    this.done()
  }

  private done() {
    if (this.overlay) { this.overlay.remove(); this.overlay = undefined }
    const cb = this.data_.onComplete
    this.scene.resume('GameScene')
    this.scene.stop()
    cb()
  }

  shutdown() {
    if (this.overlay) { this.overlay.remove(); this.overlay = undefined }
  }
}
