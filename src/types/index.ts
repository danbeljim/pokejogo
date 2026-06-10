export enum PlatformEventType {
  POKEMON_CAPTURE = 'capture',
  TRAINER_BATTLE = 'trainer',
  WILD_POKEMON = 'wild',
  ITEM_PICKUP = 'item',
  BOSS = 'boss'
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
}
