export enum PlatformEventType {
  POKEMON_CAPTURE = 'capture',
  TRAINER_BATTLE = 'trainer',
  WILD_POKEMON = 'wild',
  ITEM_PICKUP = 'item',
  BOSS = 'boss',
  POKEMON_CENTER = 'pokemon_center',
  RANDOM = 'random',
  MEMORIAL = 'memorial',
  NARRATIVE = 'narrative',
  DOUBLE_BATTLE = 'double_battle',
  BERRY_TREE = 'berry_tree',
  DOJO = 'dojo',
  PROFESSOR = 'professor',
  PORTAL = 'portal'
}

export interface PlatformEvent {
  type: PlatformEventType
  data?: any
}

export interface Item {
  id: string
  name: string
  description: string
  effect: (pokemon: any) => void
}

export interface Trainer {
  name: string
  team: any[]
  rewardExp: number
}

export interface Medal {
  name: string
  badgeNumber: number
  gymLeaderName: string
}
