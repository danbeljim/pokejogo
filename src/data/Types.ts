export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric'
  | 'psychic' | 'ground' | 'rock' | 'flying' | 'poison'
  | 'bug' | 'ghost' | 'ice' | 'dragon' | 'fighting'

export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', grass: '#78C850',
  electric: '#F8D030', psychic: '#F85888', ground: '#E0C068', rock: '#B8A038',
  flying: '#A890F0', poison: '#A040A0', bug: '#A8B820', ghost: '#705898',
  ice: '#98D8D8', dragon: '#7038F8', fighting: '#C03028'
}

// Type effectiveness chart (attacker -> defender -> multiplier)
const EFFECTIVENESS: Partial<Record<PokemonType, Partial<Record<PokemonType, number>>>> = {
  fire: { grass: 2, ice: 2, bug: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
  ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, flying: 0.5, poison: 0.5, bug: 0.5, psychic: 0.5, ghost: 0 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, grass: 0.5, bug: 0.5, flying: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5 },
  bug: { grass: 2, psychic: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5 },
  ghost: { psychic: 2, ghost: 2, normal: 0 },
  dragon: { dragon: 2 },
  normal: { rock: 0.5, ghost: 0 }
}

export function getEffectiveness(attackerType: PokemonType, defenderType: PokemonType): number {
  return EFFECTIVENESS[attackerType]?.[defenderType] ?? 1
}

export const TYPE_NAMES_ES: Record<PokemonType, string> = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta',
  electric: 'Eléctrico', psychic: 'Psíquico', ground: 'Tierra', rock: 'Roca',
  flying: 'Volador', poison: 'Veneno', bug: 'Bicho', ghost: 'Fantasma',
  ice: 'Hielo', dragon: 'Dragón', fighting: 'Lucha'
}

export function getEffectivenessLabel(mult: number): string {
  if (mult === 0) return "¡No tuvo efecto..."
  if (mult >= 2) return "¡Es muy eficaz!"
  if (mult <= 0.5) return "No es muy eficaz..."
  return ''
}
