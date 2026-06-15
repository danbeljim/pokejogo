import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { Item, VITAMINS, FRAMBU_BERRY } from '../data/Items'

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
      position:fixed; inset:0;
      background:url('/assets/random/bayas.webp') center/cover no-repeat;
      display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      z-index:9999; font-family:Arial,sans-serif; overflow-y:auto; padding:20px 0 24px;
    `
    const dimmer = document.createElement('div')
    dimmer.style.cssText = 'position:fixed; inset:0; background:rgba(5,20,10,0.75); z-index:-1; pointer-events:none;'
    wrap.appendChild(dimmer)

    const title = document.createElement('h2')
    title.textContent = '🍓 Árbol de Bayas'
    title.style.cssText = 'color:#FF4499; margin-bottom:8px; font-size:clamp(18px,4vw,28px); text-align:center;'
    wrap.appendChild(title)

    const sub = document.createElement('p')
    sub.textContent = 'Elige una recompensa:'
    sub.style.cssText = 'color:#aaffaa; font-size:14px; margin-bottom:24px; text-align:center;'
    wrap.appendChild(sub)

    const isMobile = window.innerWidth < 700
    const row = document.createElement('div')
    row.style.cssText = `display:flex; gap:${isMobile ? '12px' : '40px'}; justify-content:center; flex-wrap:wrap; padding:0 8px;`
    wrap.appendChild(row)

    // Baya Frambu — 2 sub-botones
    const frambuCard = document.createElement('div')
    const cardW = isMobile ? `${Math.floor((window.innerWidth - 40) / 2)}px` : '220px'
    frambuCard.style.cssText = `
      background:#0a2010; border:2px solid #FF4499; border-radius:12px;
      padding:${isMobile ? '10px 8px' : '20px'}; width:${cardW}; text-align:center;
      box-sizing:border-box;
    `
    frambuCard.innerHTML = `
      <div style="font-size:${isMobile ? '28px' : '48px'};margin-bottom:8px">🍓</div>
      <div style="color:#fff;font-size:${isMobile ? '12px' : '16px'};font-weight:bold;margin-bottom:6px">Baya Frambu</div>
      <div style="color:#aaffaa;font-size:${isMobile ? '10px' : '12px'};margin-bottom:${isMobile ? '8px' : '14px'}">Cura el 50% de PS\na todo el equipo</div>
    `
    const btnUsar = document.createElement('button')
    btnUsar.textContent = '🌿 Usar ahora'
    btnUsar.style.cssText = `
      background:#0a2010; color:#88ff88; border:1px solid #88ff88;
      padding:${isMobile ? '5px 6px' : '7px 14px'}; font-size:${isMobile ? '11px' : '13px'};
      font-weight:bold; border-radius:6px; cursor:pointer; width:100%; margin-bottom:6px;
    `
    btnUsar.onclick = () => this.healTeam()
    const btnGuardar = document.createElement('button')
    btnGuardar.textContent = '🎒 Guardar'
    btnGuardar.style.cssText = `
      background:#0a2010; color:#FFD700; border:1px solid #FFD700;
      padding:${isMobile ? '5px 6px' : '7px 14px'}; font-size:${isMobile ? '11px' : '13px'};
      font-weight:bold; border-radius:6px; cursor:pointer; width:100%;
    `
    btnGuardar.onclick = () => { this.data_.playerBag.push({ ...FRAMBU_BERRY }); this.done() }
    frambuCard.appendChild(btnUsar)
    frambuCard.appendChild(btnGuardar)
    row.appendChild(frambuCard)

    // Baya Pecha
    const pechaCard = document.createElement('div')
    pechaCard.style.cssText = `
      background:#0a2010; border:2px solid #FF4499; border-radius:12px;
      padding:${isMobile ? '10px 8px' : '20px'}; width:${cardW}; text-align:center;
      cursor:pointer; transition:transform 0.15s, border-color 0.15s; box-sizing:border-box;
    `
    pechaCard.onmouseenter = () => { pechaCard.style.transform = 'scale(1.05)'; pechaCard.style.borderColor = '#FFD700' }
    pechaCard.onmouseleave = () => { pechaCard.style.transform = ''; pechaCard.style.borderColor = '#FF4499' }
    pechaCard.innerHTML = `
      <div style="font-size:${isMobile ? '28px' : '48px'};margin-bottom:8px">🍒</div>
      <div style="color:#fff;font-size:${isMobile ? '12px' : '16px'};font-weight:bold;margin-bottom:6px">Baya Pecha</div>
      <div style="color:#aaffaa;font-size:${isMobile ? '10px' : '12px'};margin-bottom:${isMobile ? '8px' : '16px'}">Obtienes 2 vitaminas\naleatorias</div>
    `
    const btnPecha = document.createElement('button')
    btnPecha.textContent = 'Elegir'
    btnPecha.style.cssText = `
      background:#0a2010; color:#FFD700; border:1px solid #FFD700;
      padding:${isMobile ? '5px 8px' : '8px 20px'}; font-size:${isMobile ? '11px' : '14px'};
      font-weight:bold; border-radius:6px; cursor:pointer; width:100%;
    `
    btnPecha.onclick = () => this.giveItems()
    pechaCard.appendChild(btnPecha)
    row.appendChild(pechaCard)

    return wrap
  }

  private healTeam() {
    this.data_.playerTeam.forEach(p => p.heal(Math.floor(p.maxHp * 0.5)))
    this.done()
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
