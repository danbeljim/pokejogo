import { Medal } from '../types'

export interface MapConfig {
  id: number
  name: string
  gymLeaderName: string
  difficulty: number
  platformCount: number
  signaturePokemonDexId: number
  bgColor: string
  accentColor: string
  themeName: string
}

export default class MapManager {
  currentMapId: number = 0
  maps: MapConfig[] = [
    {
      id: 1, name: "Medalla Roca de Brock", gymLeaderName: 'Brock',
      difficulty: 1, platformCount: 8,
      signaturePokemonDexId: 95, // Onix
      bgColor: '#5a3a1a', accentColor: '#B8A038', themeName: 'Ciudad Plateada - Montañas Rocosas'
    },
    {
      id: 2, name: "Misty's Cascade Badge", gymLeaderName: 'Misty',
      difficulty: 2, platformCount: 10,
      signaturePokemonDexId: 121, // Starmie
      bgColor: '#1a3a5a', accentColor: '#6890F0', themeName: 'Cerulean Cave - Underwater'
    },
    {
      id: 3, name: "Surge's Thunder Badge", gymLeaderName: 'Lt. Surge',
      difficulty: 3, platformCount: 12,
      signaturePokemonDexId: 26, // Raichu
      bgColor: '#3a3a1a', accentColor: '#F8D030', themeName: 'Vermilion City - Power Plant'
    },
    {
      id: 4, name: "Erika's Rainbow Badge", gymLeaderName: 'Erika',
      difficulty: 3, platformCount: 12,
      signaturePokemonDexId: 71, // Victreebel
      bgColor: '#1a4a1a', accentColor: '#78C850', themeName: 'Celadon City - Forest Garden'
    },
    {
      id: 5, name: "Koga's Soul Badge", gymLeaderName: 'Koga',
      difficulty: 4, platformCount: 14,
      signaturePokemonDexId: 49, // Venomoth
      bgColor: '#3a1a3a', accentColor: '#A040A0', themeName: 'Fuchsia City - Toxic Marsh'
    },
    {
      id: 6, name: "Sabrina's Marsh Badge", gymLeaderName: 'Sabrina',
      difficulty: 4, platformCount: 14,
      signaturePokemonDexId: 65, // Alakazam
      bgColor: '#4a1a4a', accentColor: '#F85888', themeName: 'Saffron City - Psychic Realm'
    },
    {
      id: 7, name: "Blaine's Volcano Badge", gymLeaderName: 'Blaine',
      difficulty: 5, platformCount: 16,
      signaturePokemonDexId: 59, // Arcanine
      bgColor: '#5a1a1a', accentColor: '#F08030', themeName: 'Cinnabar Island - Volcano'
    },
    {
      id: 8, name: "Giovanni's Earth Badge", gymLeaderName: 'Giovanni',
      difficulty: 5, platformCount: 18,
      signaturePokemonDexId: 112, // Rhydon
      bgColor: '#3a3a3a', accentColor: '#E0C068', themeName: 'Viridian City - Hidden Cave'
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
