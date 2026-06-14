export interface RogueTrait {
  id: string
  name: string
  description: string
  atkMul?: number
  defMul?: number
  spdMul?: number
  hpMul?: number
  vampiric?: boolean
}

export const ROGUE_TRAITS: RogueTrait[] = [
  { id: 'vampirico', name: 'Vampírico', description: 'Absorbe 15% vida al atacar', vampiric: true },
  { id: 'blindado', name: 'Blindado', description: '+25% Defensa', defMul: 1.25 },
  { id: 'en_furia', name: 'En Furia', description: '+30% Atq / -15% Def', atkMul: 1.30, defMul: 0.85 },
  { id: 'veloz', name: 'Veloz', description: '+30% Velocidad', spdMul: 1.30 },
  { id: 'robusto', name: 'Robusto', description: '+30% PS máx', hpMul: 1.30 },
  { id: 'espectral', name: 'Espectral', description: '+15% Atq y Vel', atkMul: 1.15, spdMul: 1.15 },
  { id: 'fragil', name: 'Frágil', description: '-25% Defensa', defMul: 0.75 },
  { id: 'torpe', name: 'Torpe', description: '-25% Velocidad', spdMul: 0.75 },
]

export const POSITIVE_TRAIT_IDS = ['vampirico', 'blindado', 'en_furia', 'veloz', 'robusto', 'espectral']
export const NEGATIVE_TRAIT_IDS = ['fragil', 'torpe']

export function getTraitById(id: string): RogueTrait | undefined {
  return ROGUE_TRAITS.find(t => t.id === id)
}

export function applyTraitStats(pokemon: { attack: number; defense: number; speed: number; maxHp: number; hp: number }, trait: RogueTrait) {
  if (trait.atkMul) pokemon.attack = Math.max(1, Math.round(pokemon.attack * trait.atkMul))
  if (trait.defMul) pokemon.defense = Math.max(1, Math.round(pokemon.defense * trait.defMul))
  if (trait.spdMul) pokemon.speed = Math.max(1, Math.round(pokemon.speed * trait.spdMul))
  if (trait.hpMul) {
    pokemon.maxHp = Math.max(1, Math.round(pokemon.maxHp * trait.hpMul))
    pokemon.hp = pokemon.maxHp
  }
}

export function assignRogueTraits(
  pokemon: { attack: number; defense: number; speed: number; maxHp: number; hp: number; traits: string[] },
  guaranteePositive = false
) {
  const positive = ROGUE_TRAITS.filter(t => POSITIVE_TRAIT_IDS.includes(t.id))
  const negative = ROGUE_TRAITS.filter(t => NEGATIVE_TRAIT_IDS.includes(t.id))

  // Always assign one negative trait
  const neg = negative[Math.floor(Math.random() * negative.length)]
  pokemon.traits.push(neg.id)
  applyTraitStats(pokemon, neg)

  // Assign positive trait (guaranteed or 70% chance)
  if (guaranteePositive || Math.random() < 0.70) {
    const pos = positive[Math.floor(Math.random() * positive.length)]
    pokemon.traits.push(pos.id)
    applyTraitStats(pokemon, pos)
  }
}

export interface TrainerClass {
  id: string
  name: string
  description: string
  icon: string
  bonus: string
}

export const TRAINER_CLASSES: TrainerClass[] = [
  {
    id: 'criador',
    name: 'Criador',
    description: 'Maestro de captura y crianza',
    icon: '🌿',
    bonus: 'Pokémon capturados tienen 1 rasgo positivo garantizado.'
  },
  {
    id: 'investigador',
    name: 'Investigador',
    description: 'Experto en objetos y datos',
    icon: '🔬',
    bonus: '+1 objeto extra en eventos de items.'
  },
  {
    id: 'luchador',
    name: 'Luchador',
    description: 'Combatiente puro y duro',
    icon: '⚔️',
    bonus: '+20% Ataque al inicial. +50% EXP en combates.'
  },
  {
    id: 'explorador',
    name: 'Explorador',
    description: 'Aventurero sin destino fijo',
    icon: '🗺️',
    bonus: '+2 nodos Random por mapa. Recompensas especiales dobles.'
  },
]

export interface TeamSynergy {
  id: string
  name: string
  description: string
  color: string
  check: (team: Array<{ type: string; speed: number; defense: number }>) => boolean
  atkBonus?: number
  defBonus?: number
  spdBonus?: number
}

export const TEAM_SYNERGIES: TeamSynergy[] = [
  {
    id: 'mono_type',
    name: 'Pureza de Tipo',
    description: 'Equipo del mismo tipo → +20% Atq y Def',
    color: '#FFD700',
    check: (team) => team.length >= 2 && new Set(team.map(p => p.type)).size === 1,
    atkBonus: 1.20,
    defBonus: 1.20,
  },
  {
    id: 'speed_demons',
    name: 'Velocidad Suprema',
    description: '4+ Pokémon rápidos → +30% Vel',
    color: '#00FFFF',
    check: (team) => team.filter(p => p.speed > 40).length >= 4,
    spdBonus: 1.30,
  },
  {
    id: 'iron_wall',
    name: 'Muro de Acero',
    description: '4+ Pokémon defensivos → +30% Def',
    color: '#AAAAAA',
    check: (team) => team.filter(p => p.defense > 40).length >= 4,
    defBonus: 1.30,
  },
  {
    id: 'diversity',
    name: 'Equilibrio Perfecto',
    description: '6 tipos distintos → +10% todo',
    color: '#FF88FF',
    check: (team) => new Set(team.map(p => p.type)).size >= 6,
    atkBonus: 1.10,
    defBonus: 1.10,
    spdBonus: 1.10,
  },
]

export function computeActiveSynergy(team: Array<{ type: string; speed: number; defense: number }>): TeamSynergy | null {
  return TEAM_SYNERGIES.find(s => s.check(team)) ?? null
}
