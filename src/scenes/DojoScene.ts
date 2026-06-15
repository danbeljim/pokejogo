import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'

export interface DojoSceneData {
  playerTeam: Pokemon[]
  onComplete: () => void
}

const BOOSTS = [
  { label: '+15 Ataque', apply: (p: Pokemon) => { p.attack += 15 } },
  { label: '+15 Defensa', apply: (p: Pokemon) => { p.defense += 15 } },
  { label: '+15 Velocidad', apply: (p: Pokemon) => { p.speed += 15 } },
  { label: '+30 PS máx', apply: (p: Pokemon) => { p.maxHp += 30; p.hp = Math.min(p.hp + 30, p.maxHp) } },
]

export default class DojoScene extends Phaser.Scene {
  private data_!: DojoSceneData
  private overlay?: HTMLDivElement

  constructor() { super('DojoScene') }

  init(d: DojoSceneData) { this.data_ = d }

  create() {
    this.cameras.main.setBackgroundColor('#00000000')
    this.overlay = this.buildOverlay()
    document.body.appendChild(this.overlay)
  }

  private buildOverlay(): HTMLDivElement {
    const wrap = document.createElement('div')
    wrap.style.cssText = `
      position:fixed; inset:0;
      background:url('/assets/locations/dojo.png') center/cover no-repeat;
      display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      z-index:9999; font-family:Arial,sans-serif; overflow-y:auto; padding:20px 0 24px;
    `
    // Dark overlay so text stays readable
    const dimmer = document.createElement('div')
    dimmer.style.cssText = 'position:fixed; inset:0; background:rgba(10,5,0,0.72); z-index:-1; pointer-events:none;'
    wrap.appendChild(dimmer)
    this.renderStep1(wrap)
    return wrap
  }

  private renderStep1(wrap: HTMLDivElement) {
    wrap.innerHTML = ''

    const title = document.createElement('h2')
    title.textContent = '🥋 Dojo de Entrenamiento'
    title.style.cssText = 'color:#E65C00; margin-bottom:8px; font-size:clamp(16px,4vw,26px); text-align:center; margin-top:20px;'
    wrap.appendChild(title)

    const sub = document.createElement('p')
    sub.textContent = 'Elige el pokémon que entrenará:'
    sub.style.cssText = 'color:#ffddaa; font-size:14px; margin-bottom:24px; text-align:center;'
    wrap.appendChild(sub)

    const row = document.createElement('div')
    row.style.cssText = 'display:flex; gap:12px; flex-wrap:wrap; justify-content:center; padding:0 12px;'
    wrap.appendChild(row)

    this.data_.playerTeam.forEach(p => {
      const btn = document.createElement('button')
      btn.style.cssText = `
        background:#1a0800; color:#fff; border:2px solid #E65C00;
        padding:12px 20px; font-size:14px; border-radius:8px; cursor:pointer;
        transition:border-color 0.15s;
      `
      btn.textContent = `${p.name} Nv.${p.level}`
      btn.onmouseenter = () => { btn.style.borderColor = '#FFD700' }
      btn.onmouseleave = () => { btn.style.borderColor = '#E65C00' }
      btn.onclick = () => this.renderStep2(wrap, p)
      row.appendChild(btn)
    })
  }

  private renderStep2(wrap: HTMLDivElement, pokemon: Pokemon) {
    wrap.innerHTML = ''

    const title = document.createElement('h2')
    title.textContent = `🥋 Entrenar a ${pokemon.name}`
    title.style.cssText = 'color:#E65C00; margin-bottom:8px; font-size:clamp(16px,4vw,26px); text-align:center; margin-top:20px;'
    wrap.appendChild(title)

    const sub = document.createElement('p')
    sub.textContent = 'Elige una mejora permanente:'
    sub.style.cssText = 'color:#ffddaa; font-size:14px; margin-bottom:24px; text-align:center;'
    wrap.appendChild(sub)

    const isMobile = window.innerWidth < 700
    const row = document.createElement('div')
    row.style.cssText = `display:flex; gap:${isMobile ? '8px' : '20px'}; flex-wrap:wrap; justify-content:center; padding:0 12px;`
    wrap.appendChild(row)

    BOOSTS.forEach(boost => {
      const card = document.createElement('div')
      card.style.cssText = `
        background:#1a0800; border:2px solid #E65C00; border-radius:10px;
        padding:${isMobile ? '12px 8px' : '20px'}; width:${isMobile ? '130px' : '160px'};
        text-align:center; cursor:pointer; transition:transform 0.15s; box-sizing:border-box;
      `
      card.onmouseenter = () => { card.style.transform = 'scale(1.05)'; card.style.borderColor = '#FFD700' }
      card.onmouseleave = () => { card.style.transform = ''; card.style.borderColor = '#E65C00' }

      const lbl = document.createElement('div')
      lbl.textContent = boost.label
      lbl.style.cssText = `color:#FFD700; font-size:${isMobile ? '13px' : '16px'}; font-weight:bold; margin-bottom:12px;`
      card.appendChild(lbl)

      const btn = document.createElement('button')
      btn.textContent = 'Aplicar'
      btn.style.cssText = `
        background:#1a0800; color:#E65C00; border:1px solid #E65C00;
        padding:6px 14px; font-size:13px; font-weight:bold; border-radius:6px; cursor:pointer; width:100%;
      `
      btn.onclick = () => { boost.apply(pokemon); this.done() }
      card.appendChild(btn)
      row.appendChild(card)
    })

    const back = document.createElement('button')
    back.textContent = '← Volver'
    back.style.cssText = 'margin-top:20px; background:none; color:#888; border:1px solid #555; padding:8px 20px; border-radius:6px; cursor:pointer; font-size:13px;'
    back.onclick = () => this.renderStep1(wrap)
    wrap.appendChild(back)
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
