import { Medal } from '../types'

export interface MapConfig {
  id: number
  name: string
  gymLeaderName: string
  difficulty: number
  platformCount: number
}

export default class MapManager {
  currentMapId: number = 0
  maps: MapConfig[] = [
    {
      id: 1,
      name: 'Brock\'s Boulder Badge',
      gymLeaderName: 'Brock',
      difficulty: 1,
      platformCount: 8
    },
    {
      id: 2,
      name: 'Misty\'s Cascade Badge',
      gymLeaderName: 'Misty',
      difficulty: 2,
      platformCount: 10
    },
    {
      id: 3,
      name: 'Surge\'s Thunder Badge',
      gymLeaderName: 'Lt. Surge',
      difficulty: 3,
      platformCount: 12
    },
    {
      id: 4,
      name: 'Erika\'s Rainbow Badge',
      gymLeaderName: 'Erika',
      difficulty: 3,
      platformCount: 12
    },
    {
      id: 5,
      name: 'Koga\'s Soul Badge',
      gymLeaderName: 'Koga',
      difficulty: 4,
      platformCount: 14
    },
    {
      id: 6,
      name: 'Sabrina\'s Marsh Badge',
      gymLeaderName: 'Sabrina',
      difficulty: 4,
      platformCount: 14
    },
    {
      id: 7,
      name: 'Blaine\'s Volcano Badge',
      gymLeaderName: 'Blaine',
      difficulty: 5,
      platformCount: 16
    },
    {
      id: 8,
      name: 'Giovanni\'s Earth Badge',
      gymLeaderName: 'Giovanni',
      difficulty: 5,
      platformCount: 18
    }
  ]
  collectedMedals: Medal[] = []

  getCurrentMap(): MapConfig {
    return this.maps[this.currentMapId]
  }

  nextMap(): boolean {
    if (this.currentMapId < this.maps.length - 1) {
      this.currentMapId++
      return true
    }
    return false
  }

  addMedal(medal: Medal) {
    this.collectedMedals.push(medal)
  }

  getMedalCount(): number {
    return this.collectedMedals.length
  }

  isGameComplete(): boolean {
    return this.collectedMedals.length === 8
  }
}
