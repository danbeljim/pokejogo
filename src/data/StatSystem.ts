import { Pokemon } from '../entities/Pokemon'

// Flat bonuses added to base stats (not multiplied)
export const TIER_BONUS: Record<string, number> = {
  common:    0,
  uncommon:  3,
  rare:      6,
  elite:     12,
  pseudo:    18,
  legendary: 25,
}

// index = evolutionStage - 1, flat bonus added to base stats
export const EVO_BONUS = [0, 8, 15]

// Boss gets ONE multiplier only
export const BOSS_MULTIPLIERS = {
  hp: 1.40, attack: 1.15, defense: 1.20, speed: 1.00,
}

export const POKEMON_TIERS: Record<number, string> = {
  // Common
  10: 'common', 11: 'common', 13: 'common', 14: 'common',
  16: 'common', 19: 'common', 21: 'common', 23: 'common',
  29: 'common', 32: 'common', 39: 'common', 41: 'common',
  43: 'common', 46: 'common', 48: 'common', 52: 'common',
  54: 'common', 60: 'common', 72: 'common', 74: 'common',
  81: 'common', 84: 'common', 88: 'common', 90: 'common',
  96: 'common', 100: 'common', 109: 'common', 116: 'common',
  118: 'common', 129: 'common',
  // Uncommon
  17: 'uncommon', 22: 'uncommon', 24: 'uncommon', 27: 'uncommon',
  30: 'uncommon', 33: 'uncommon', 35: 'uncommon', 37: 'uncommon',
  42: 'uncommon', 47: 'uncommon', 49: 'uncommon', 50: 'uncommon',
  53: 'uncommon', 56: 'uncommon', 58: 'uncommon', 63: 'uncommon',
  66: 'uncommon', 69: 'uncommon', 77: 'uncommon', 83: 'uncommon',
  92: 'uncommon', 95: 'uncommon', 102: 'uncommon', 104: 'uncommon',
  111: 'uncommon', 120: 'uncommon',
  // Rare
  1: 'rare', 4: 'rare', 7: 'rare', 25: 'rare', 28: 'rare',
  45: 'rare', 55: 'rare', 67: 'rare', 73: 'rare', 75: 'rare',
  78: 'rare', 79: 'rare', 93: 'rare', 101: 'rare', 105: 'rare',
  123: 'rare', 126: 'rare', 127: 'rare', 128: 'rare', 133: 'rare',
  138: 'rare', 140: 'rare',
  // Elite
  2: 'elite', 3: 'elite', 5: 'elite', 6: 'elite', 8: 'elite', 9: 'elite',
  26: 'elite', 51: 'elite', 59: 'elite', 64: 'elite', 65: 'elite',
  68: 'elite', 71: 'elite', 76: 'elite', 89: 'elite', 94: 'elite',
  112: 'elite', 115: 'elite', 121: 'elite', 130: 'elite', 134: 'elite',
  141: 'elite', 142: 'elite', 143: 'elite',
  // Pseudo-legendary
  147: 'pseudo',
  // Legendary
  144: 'legendary', 145: 'legendary', 146: 'legendary',
  150: 'legendary', 151: 'legendary',
}

// dexId → evolution stage (default 1)
export const EVOLUTION_STAGES: Record<number, number> = {
  // Stage 2
  2: 2, 5: 2, 8: 2, 11: 2, 14: 2, 17: 2, 22: 2, 25: 2,
  30: 2, 33: 2, 40: 2, 42: 2, 44: 2, 47: 2, 49: 2, 53: 2,
  55: 2, 57: 2, 59: 2, 61: 2, 64: 2, 67: 2, 70: 2, 73: 2,
  75: 2, 78: 2, 80: 2, 86: 2, 89: 2, 91: 2, 93: 2, 97: 2,
  101: 2, 105: 2, 110: 2, 112: 2, 119: 2, 121: 2, 130: 2,
  134: 2, 139: 2, 141: 2,
  // Stage 3
  3: 3, 6: 3, 9: 3, 18: 3, 20: 3, 26: 3,
  31: 3, 34: 3, 36: 3, 38: 3, 45: 3, 51: 3, 65: 3, 68: 3,
  71: 3, 76: 3, 82: 3, 94: 3, 103: 3, 131: 3,
}

export function getTierBonus(dexId: number): number {
  return TIER_BONUS[POKEMON_TIERS[dexId] ?? 'common']
}

export function getEvoBonus(dexId: number): number {
  return EVO_BONUS[(EVOLUTION_STAGES[dexId] ?? 1) - 1]
}

export function applyEnemyScale(p: Pokemon, floor: number): void {
  // Additive flat bonus only — no chained multiplier
  const bonus = floor * 2
  p.attack  += bonus
  p.defense += bonus
  p.maxHp   += bonus * 3
  p.hp = p.maxHp
}

export function applyBossScale(p: Pokemon): void {
  p.attack  = Math.round(p.attack  * BOSS_MULTIPLIERS.attack)
  p.defense = Math.round(p.defense * BOSS_MULTIPLIERS.defense)
  p.speed   = Math.round(p.speed   * BOSS_MULTIPLIERS.speed)
  p.maxHp   = Math.round(p.maxHp   * BOSS_MULTIPLIERS.hp)
  p.hp      = p.maxHp
}
