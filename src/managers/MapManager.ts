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
  routeName: string
  locationBgUrl: string
  bossMaxLevel: number
  wildMinLevel: number
  wildMaxLevel: number
  isSpecialZone?: boolean
  ghostOnly?: boolean
  towerMap?: boolean
  wildPool?: number[]
}

export default class MapManager {
  currentMapId: number = 0
  maps: MapConfig[] = [
    {
      id: 1, name: "Medalla Roca de Brock", gymLeaderName: 'Brock',
      difficulty: 1, platformCount: 8, bossMaxLevel: 14, wildMinLevel: 3, wildMaxLevel: 6,
      signaturePokemonDexId: 95,
      bgColor: '#5a3a1a', accentColor: '#B8A038', themeName: 'Ciudad Plateada - Montañas Rocosas',
      routeName: 'Ruta 2', locationBgUrl: '/assets/locations/map-1-pewter.png',
      wildPool: [16, 19, 10, 11, 13, 14, 21, 29, 32, 25, 56]
    },
    {
      id: 2, name: "Medalla Cascada de Misty", gymLeaderName: 'Misty',
      difficulty: 2, platformCount: 10, bossMaxLevel: 21, wildMinLevel: 8, wildMaxLevel: 12,
      signaturePokemonDexId: 121,
      bgColor: '#1a3a5a', accentColor: '#6890F0', themeName: 'Ciudad Celeste - Cueva Azulada',
      routeName: 'Ruta 4', locationBgUrl: '/assets/locations/map-2-cerulean.png',
      wildPool: [41, 74, 46, 35, 27, 23, 39, 21, 19]
    },
    {
      id: 3, name: "Medalla Trueno de Lt. Surge", gymLeaderName: 'Lt. Surge',
      difficulty: 3, platformCount: 12, bossMaxLevel: 24, wildMinLevel: 15, wildMaxLevel: 22,
      signaturePokemonDexId: 26,
      bgColor: '#3a3a1a', accentColor: '#F8D030', themeName: 'Ciudad Carmín - Planta Eléctrica',
      routeName: 'Ruta 6', locationBgUrl: '/assets/locations/Ciudad_Carmin_HGSS.webp',
      wildPool: [43, 69, 63, 52, 17, 48, 19, 16]
    },
    {
      id: 0, name: "Torre Pokémon", gymLeaderName: 'Marowak Fantasma',
      difficulty: 3, platformCount: 10, bossMaxLevel: 30, wildMinLevel: 22, wildMaxLevel: 28,
      signaturePokemonDexId: 94,
      bgColor: '#1a0a2a', accentColor: '#705898', themeName: 'Pueblo Lavanda - Torre Pokémon',
      routeName: 'Torre Pokémon', locationBgUrl: '/assets/locations/map-1-pewter.png',
      isSpecialZone: true, ghostOnly: true, towerMap: true
    },
    {
      id: 4, name: "Medalla Arcoíris de Erika", gymLeaderName: 'Erika',
      difficulty: 3, platformCount: 12, bossMaxLevel: 29, wildMinLevel: 18, wildMaxLevel: 22,
      signaturePokemonDexId: 71,
      bgColor: '#1a4a1a', accentColor: '#78C850', themeName: 'Ciudad Azulona - Jardín Frondoso',
      routeName: 'Ruta 7', locationBgUrl: '/assets/locations/Ciudad_Azulona_cuarta_generacion.webp',
      wildPool: [50, 51, 96, 66, 95, 100, 81, 74, 41]
    },
    {
      id: 5, name: "Medalla Alma de Koga", gymLeaderName: 'Koga',
      difficulty: 4, platformCount: 14, bossMaxLevel: 43, wildMinLevel: 22, wildMaxLevel: 30,
      signaturePokemonDexId: 49,
      bgColor: '#3a1a3a', accentColor: '#A040A0', themeName: 'Ciudad Fucsia - Pantano Tóxico',
      routeName: 'Ruta 15', locationBgUrl: '/assets/locations/Ciudad_Fucsia_HGSS.webp',
      wildPool: [92, 58, 37, 84, 83, 143, 17, 22]
    },
    {
      id: 6, name: "Medalla Páramo de Sabrina", gymLeaderName: 'Sabrina',
      difficulty: 4, platformCount: 14, bossMaxLevel: 43, wildMinLevel: 20, wildMaxLevel: 30,
      signaturePokemonDexId: 65,
      bgColor: '#4a1a4a', accentColor: '#F85888', themeName: 'Ciudad Azafrán - Reino Psíquico',
      routeName: 'Ruta 8', locationBgUrl: '/assets/locations/Ciudad_Azafran_HGSS.webp',
      wildPool: [128, 115, 102, 111, 33, 30, 123, 127, 47]
    },
    {
      id: 7, name: "Medalla Volcán de Blaine", gymLeaderName: 'Blaine',
      difficulty: 5, platformCount: 16, bossMaxLevel: 47, wildMinLevel: 30, wildMaxLevel: 40,
      signaturePokemonDexId: 59,
      bgColor: '#5a1a1a', accentColor: '#F08030', themeName: 'Isla Canela - Volcán',
      routeName: 'Ruta 21', locationBgUrl: '/assets/locations/Isla_Canela_HGSS.webp',
      wildPool: [72, 73, 90, 116, 77, 109, 88, 126]
    },
    {
      id: 8, name: "Medalla Tierra de Giovanni", gymLeaderName: 'Giovanni',
      difficulty: 5, platformCount: 18, bossMaxLevel: 50, wildMinLevel: 35, wildMaxLevel: 45,
      signaturePokemonDexId: 112,
      bgColor: '#3a3a3a', accentColor: '#E0C068', themeName: 'Ciudad Verde - Cueva Oculta',
      routeName: 'Ruta 22', locationBgUrl: '/assets/locations/Ciudad_Verde_HGSS.webp',
      wildPool: [42, 105, 101, 22, 78, 75, 67, 28]
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
