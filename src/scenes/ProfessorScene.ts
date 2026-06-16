import Phaser from 'phaser'
import { Pokemon } from '../entities/Pokemon'
import { EVOLUTIONS } from '../data/Evolution'
import { MOVES } from '../data/Moves'
import { createWildPokemon } from '../entities/PokemonFactory'

export interface ProfessorSceneData {
  playerTeam: Pokemon[]
  difficulty: number
  onComplete: (newTeam: Pokemon[]) => void
}

const RARE_MOVES = ['Flamethrower', 'Hydro Pump', 'Thunderbolt', 'Ice Beam', 'Psychic', 'Headbutt', 'Wing Attack', 'Razor Leaf']

export default class ProfessorScene extends Phaser.Scene {
  private data_!: ProfessorSceneData
  private overlay?: HTMLDivElement

  constructor() { super('ProfessorScene') }

  init(d: ProfessorSceneData) { this.data_ = d }

  create() {
    this.cameras.main.setBackgroundColor('#00000000')
    this.overlay = this.buildOverlay()
    document.body.appendChild(this.overlay)
  }

  private buildOverlay(): HTMLDivElement {
    const wrap = document.createElement('div')
    wrap.style.cssText = `
      position:fixed; inset:0;
      background:url('/assets/locations/laboratorio.png') center/cover no-repeat;
      display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
      z-index:9999; font-family:Arial,sans-serif; overflow-y:auto; padding:20px 0 24px;
    `
    const dimmer = document.createElement('div')
    dimmer.style.cssText = 'position:fixed; inset:0; background:rgba(0,15,25,0.80); z-index:-1; pointer-events:none;'
    wrap.appendChild(dimmer)
    this.renderMainMenu(wrap)
    return wrap
  }

  private renderMainMenu(wrap: HTMLDivElement) {
    wrap.innerHTML = ''

    const title = document.createElement('h2')
    title.textContent = '🔬 Laboratorio del Científico'
    title.style.cssText = 'color:#00BCD4; margin-bottom:8px; font-size:clamp(15px,4vw,24px); text-align:center; margin-top:20px;'
    wrap.appendChild(title)

    const sub = document.createElement('p')
    sub.textContent = '¿Qué deseas hacer hoy?'
    sub.style.cssText = 'color:#aaddff; font-size:14px; margin-bottom:24px; text-align:center;'
    wrap.appendChild(sub)

    const isMobile = window.innerWidth < 700
    const options = [
      { emoji: '📚', name: 'Aprender Movimiento', desc: 'Un pokémon aprende\nun movimiento raro', action: () => this.renderLearnMove(wrap) },
      { emoji: '⚡', name: 'Evolución Instantánea', desc: 'Evoluciona un pokémon\nde tu equipo ahora', action: () => this.renderEvolve(wrap) },
      { emoji: '🔄', name: 'Cambiar Pokémon', desc: 'Intercambia uno de tu\nequipo por otro nuevo', action: () => this.renderSwap(wrap) },
    ]

    const row = document.createElement('div')
    row.style.cssText = `display:flex; gap:${isMobile ? '8px' : '24px'}; flex-wrap:wrap; justify-content:center; padding:0 8px;`
    wrap.appendChild(row)

    options.forEach(opt => {
      const card = document.createElement('div')
      const cardW = isMobile ? `${Math.floor((window.innerWidth - 48) / 3)}px` : '180px'
      card.style.cssText = `
        background:#001520; border:2px solid #00BCD4; border-radius:12px;
        padding:${isMobile ? '10px 6px' : '20px'}; width:${cardW}; text-align:center;
        cursor:pointer; transition:transform 0.15s; box-sizing:border-box;
      `
      card.onmouseenter = () => { card.style.transform = 'scale(1.05)'; card.style.borderColor = '#FFD700' }
      card.onmouseleave = () => { card.style.transform = ''; card.style.borderColor = '#00BCD4' }
      card.innerHTML = `
        <div style="font-size:${isMobile ? '28px' : '40px'};margin-bottom:6px">${opt.emoji}</div>
        <div style="color:#fff;font-size:${isMobile ? '10px' : '14px'};font-weight:bold;margin-bottom:6px">${opt.name}</div>
        <div style="color:#aaddff;font-size:${isMobile ? '9px' : '11px'};margin-bottom:${isMobile ? '8px' : '14px'};white-space:pre-line">${opt.desc}</div>
      `
      const btn = document.createElement('button')
      btn.textContent = 'Elegir'
      btn.style.cssText = `
        background:#001520; color:#FFD700; border:1px solid #FFD700;
        padding:${isMobile ? '5px 6px' : '7px 16px'}; font-size:${isMobile ? '10px' : '13px'};
        font-weight:bold; border-radius:6px; cursor:pointer; width:100%;
      `
      btn.onclick = () => opt.action()
      card.appendChild(btn)
      row.appendChild(card)
    })
  }

  private renderLearnMove(wrap: HTMLDivElement) {
    wrap.innerHTML = ''
    const title = document.createElement('h2')
    title.textContent = '📚 ¿Qué Pokémon aprende?'
    title.style.cssText = 'color:#00BCD4; margin:20px 0 20px; font-size:clamp(14px,4vw,22px); text-align:center;'
    wrap.appendChild(title)

    const row = document.createElement('div')
    row.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; justify-content:center; padding:0 12px;'
    wrap.appendChild(row)

    this.data_.playerTeam.forEach(p => {
      const btn = document.createElement('button')
      btn.style.cssText = 'background:#001520; color:#fff; border:2px solid #00BCD4; padding:10px 16px; font-size:14px; border-radius:8px; cursor:pointer;'
      btn.textContent = `${p.name} Nv.${p.level}`
      btn.onclick = () => this.renderPickMove(wrap, p)
      row.appendChild(btn)
    })
    this.addBack(wrap, () => this.renderMainMenu(wrap))
  }

  private renderPickMove(wrap: HTMLDivElement, pokemon: Pokemon) {
    wrap.innerHTML = ''
    const title = document.createElement('h2')
    title.textContent = `📚 Movimiento para ${pokemon.name}`
    title.style.cssText = 'color:#00BCD4; margin:20px 0 20px; font-size:clamp(13px,4vw,20px); text-align:center;'
    wrap.appendChild(title)

    const picks = [...RARE_MOVES].sort(() => Math.random() - 0.5).slice(0, 3)
    const isMobile = window.innerWidth < 700
    const row = document.createElement('div')
    row.style.cssText = `display:flex; gap:${isMobile ? '8px' : '20px'}; flex-wrap:wrap; justify-content:center; padding:0 12px;`
    wrap.appendChild(row)

    picks.forEach(moveName => {
      const move = MOVES[moveName]
      const card = document.createElement('div')
      card.style.cssText = `background:#001520; border:2px solid #00BCD4; border-radius:10px; padding:16px; width:${isMobile ? '100px' : '150px'}; text-align:center; cursor:pointer; box-sizing:border-box;`
      card.innerHTML = `
        <div style="color:#FFD700;font-weight:bold;font-size:${isMobile ? '11px' : '14px'};margin-bottom:4px">${move?.nameEs || moveName}</div>
        <div style="color:#aaddff;font-size:11px">Tipo: ${move?.type || '?'}</div>
        <div style="color:#aaddff;font-size:11px;margin-bottom:10px">Poder: ${move?.power || '?'}</div>
      `
      const btn = document.createElement('button')
      btn.textContent = 'Aprender'
      btn.style.cssText = 'background:#001520; color:#FFD700; border:1px solid #FFD700; padding:6px 10px; font-size:11px; border-radius:6px; cursor:pointer; width:100%;'
      btn.onclick = () => {
        if (pokemon.moves.length >= 4) pokemon.moves[3] = moveName
        else pokemon.moves.push(moveName)
        this.done()
      }
      card.appendChild(btn)
      row.appendChild(card)
    })
    this.addBack(wrap, () => this.renderLearnMove(wrap))
  }

  private renderEvolve(wrap: HTMLDivElement) {
    wrap.innerHTML = ''
    const title = document.createElement('h2')
    title.textContent = '⚡ ¿Qué Pokémon evoluciona?'
    title.style.cssText = 'color:#00BCD4; margin:20px 0 20px; font-size:clamp(14px,4vw,22px); text-align:center;'
    wrap.appendChild(title)

    const evolvable = this.data_.playerTeam.filter(p => EVOLUTIONS[p.id])
    if (evolvable.length === 0) {
      const msg = document.createElement('p')
      msg.textContent = 'Ningún Pokémon en tu equipo puede evolucionar aún.'
      msg.style.cssText = 'color:#ff8888; text-align:center; font-size:14px; margin:20px;'
      wrap.appendChild(msg)
    } else {
      const row = document.createElement('div')
      row.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; justify-content:center; padding:0 12px;'
      wrap.appendChild(row)
      evolvable.forEach(p => {
        const evo = EVOLUTIONS[p.id]!
        const btn = document.createElement('button')
        btn.style.cssText = 'background:#001520; color:#fff; border:2px solid #00BCD4; padding:10px 16px; font-size:13px; border-radius:8px; cursor:pointer; text-align:left;'
        btn.innerHTML = `<b>${p.name}</b> → ${evo.toName}`
        btn.onclick = () => {
          const prevName = p.name
          p.id = evo.toDexId
          p.name = evo.toName
          p.type = evo.toType
          p.maxHp += 15; p.hp = p.maxHp
          p.attack += 8; p.defense += 6; p.speed += 5
          console.log(`[Professor] ${prevName} evolucionó a ${evo.toName}`)
          this.done()
        }
        row.appendChild(btn)
      })
    }
    this.addBack(wrap, () => this.renderMainMenu(wrap))
  }

  private renderSwap(wrap: HTMLDivElement) {
    wrap.innerHTML = ''
    const title = document.createElement('h2')
    title.textContent = '🔄 ¿Qué Pokémon envías?'
    title.style.cssText = 'color:#00BCD4; margin:20px 0 20px; font-size:clamp(14px,4vw,22px); text-align:center;'
    wrap.appendChild(title)

    const row = document.createElement('div')
    row.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; justify-content:center; padding:0 12px;'
    wrap.appendChild(row)

    this.data_.playerTeam.forEach((p, idx) => {
      const btn = document.createElement('button')
      btn.style.cssText = 'background:#001520; color:#fff; border:2px solid #00BCD4; padding:10px 16px; font-size:14px; border-radius:8px; cursor:pointer;'
      btn.textContent = `${p.name} Nv.${p.level}`
      btn.onclick = () => this.renderPickReplacement(wrap, idx)
      row.appendChild(btn)
    })
    this.addBack(wrap, () => this.renderMainMenu(wrap))
  }

  private renderPickReplacement(wrap: HTMLDivElement, slotIdx: number) {
    wrap.innerHTML = ''
    const title = document.createElement('h2')
    title.textContent = '🔄 ¿Cuál quieres a cambio?'
    title.style.cssText = 'color:#00BCD4; margin:20px 0 20px; font-size:clamp(14px,4vw,22px); text-align:center;'
    wrap.appendChild(title)

    const baseLevel = this.data_.playerTeam[slotIdx]?.level || 10
    const opts: Pokemon[] = []
    const seen = new Set<number>()
    while (opts.length < 3) {
      const p = createWildPokemon(baseLevel)
      if (!seen.has(p.id)) { seen.add(p.id); opts.push(p) }
    }

    const isMobile = window.innerWidth < 700
    const row = document.createElement('div')
    row.style.cssText = `display:flex; gap:${isMobile ? '8px' : '20px'}; flex-wrap:wrap; justify-content:center; padding:0 12px;`
    wrap.appendChild(row)

    opts.forEach(newPoke => {
      const card = document.createElement('div')
      card.style.cssText = `background:#001520; border:2px solid #00BCD4; border-radius:10px; padding:14px; width:${isMobile ? '90px' : '140px'}; text-align:center; cursor:pointer; box-sizing:border-box;`
      card.innerHTML = `
        <div style="color:#FFD700;font-weight:bold;font-size:${isMobile ? '12px' : '15px'};margin-bottom:4px">${newPoke.name}</div>
        <div style="color:#aaddff;font-size:11px">Nv.${newPoke.level}</div>
        <div style="color:#aaddff;font-size:11px;margin-bottom:10px">Tipo: ${newPoke.type}</div>
      `
      const btn = document.createElement('button')
      btn.textContent = 'Elegir'
      btn.style.cssText = 'background:#001520; color:#FFD700; border:1px solid #FFD700; padding:6px 10px; font-size:11px; border-radius:6px; cursor:pointer; width:100%;'
      btn.onclick = () => {
        this.data_.playerTeam[slotIdx] = newPoke
        this.done()
      }
      card.appendChild(btn)
      row.appendChild(card)
    })
    this.addBack(wrap, () => this.renderSwap(wrap))
  }

  private addBack(wrap: HTMLDivElement, fn: () => void) {
    const btn = document.createElement('button')
    btn.textContent = '← Volver'
    btn.style.cssText = 'margin-top:16px; background:none; color:#888; border:1px solid #555; padding:8px 20px; border-radius:6px; cursor:pointer; font-size:13px;'
    btn.onclick = fn
    wrap.appendChild(btn)
  }

  private done() {
    if (this.overlay) { this.overlay.remove(); this.overlay = undefined }
    const cb = this.data_.onComplete
    const team = this.data_.playerTeam
    this.scene.resume('GameScene')
    this.scene.stop()
    cb(team)
  }

  shutdown() {
    if (this.overlay) { this.overlay.remove(); this.overlay = undefined }
  }
}
