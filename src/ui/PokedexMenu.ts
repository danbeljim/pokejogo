import { REGIONS } from '../data/Regions'
import './PokedexMenu.css'

export class PokedexMenu {
  private container: HTMLElement
  private selectedIdx: number = 0
  private onSelect: (regionId: number) => void
  private onRoguelike?: () => void

  constructor(onSelect: (regionId: number) => void, onRoguelike?: () => void) {
    this.onSelect = onSelect
    this.onRoguelike = onRoguelike
    this.container = document.createElement('div')
    this.container.className = 'pokedex-container'
    this.render()
  }

  private render() {
    this.container.innerHTML = `
      <div class="pokedex">
        <!-- Slots clicables -->
        <div class="pokedex-slots" id="slots-container"></div>

        <!-- Right side info -->
        <div class="pokedex-info">
          <div class="pokedex-title">POKÉMON<br>ROGUELIKE</div>
          <div class="pokedex-creator">creado por:<br>andrescalzadodev</div>
        </div>

        <!-- Footer -->
        <div class="pokedex-footer"></div>
      </div>
    `

    this.renderSlots()
    document.body.appendChild(this.container)
  }

  private renderSlots() {
    const slotsContainer = this.container.querySelector('#slots-container')!

    for (let i = 0; i < 5; i++) {
      const region = REGIONS[i]
      const slot = document.createElement('div')
      slot.className = `pokedex-slot ${i === this.selectedIdx && region ? 'active' : ''}`
      slot.innerHTML = `<span class="pokedex-slot-text">${region?.name || ''}</span>`

      if (region) {
        slot.style.cursor = 'pointer'
        slot.addEventListener('click', () => {
          this.selectSlot(i, region.id)
        })

        slot.addEventListener('mouseenter', () => {
          slot.classList.add('hover')
        })

        slot.addEventListener('mouseleave', () => {
          slot.classList.remove('hover')
        })
      }

      slotsContainer.appendChild(slot)
    }

    // Roguelike mode slot (WIP - disabled)
    const rlSlot = document.createElement('div')
    rlSlot.className = 'pokedex-slot roguelike-slot roguelike-disabled'
    rlSlot.innerHTML = `<span class="pokedex-slot-text">◆ PURO ROGUELIKE<br><small>próximamente</small></span>`
    rlSlot.style.cursor = 'not-allowed'
    slotsContainer.appendChild(rlSlot)
  }

  private selectSlot(idx: number, regionId: number) {
    this.selectedIdx = idx
    this.updateSlotStyles()
    // Pequeño delay para feedback visual
    setTimeout(() => this.onSelect(regionId), 200)
  }

  private updateSlotStyles() {
    const slots = this.container.querySelectorAll('.pokedex-slot')
    slots.forEach((slot, i) => {
      if (i === this.selectedIdx) {
        slot.classList.add('active')
      } else {
        slot.classList.remove('active')
      }
    })
  }

  public remove() {
    this.container.remove()
  }

  public getElement(): HTMLElement {
    return this.container
  }
}
