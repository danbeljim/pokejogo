export interface Region {
  id: number
  name: string
  description: string
}

export const REGIONS: Region[] = [
  {
    id: 1,
    name: 'Kanto',
    description: '8 Gimnasios. 8 Medallas. Una Partida.'
  },
  // TODO: Add more regions in the future
  // {
  //   id: 2,
  //   name: 'Johto',
  //   description: '8 More Gyms. 8 More Medals.'
  // }
]
