interface City {
  id: number;
  name: string;
}

interface Governorate {
  id: number;
  name: string;
  cities: City[];
}

export const tunisiaGovernorates: Governorate[] = [
  {
    id: 1,
    name: "Tunis",
    cities: [
      { id: 1, name: "Tunis City" },
      { id: 2, name: "Le Bardo" },
      { id: 3, name: "La Marsa" },
      { id: 4, name: "Carthage" },
      { id: 5, name: "Sidi Bou Said" }
    ]
  },
  {
    id: 2,
    name: "Sfax",
    cities: [
      { id: 6, name: "Sfax City" },
      { id: 7, name: "Sakiet Ezzit" },
      { id: 8, name: "Mahres" },
      { id: 9, name: "Kerkennah" }
    ]
  },
  {
    id: 3,
    name: "Sousse",
    cities: [
      { id: 10, name: "Sousse City" },
      { id: 11, name: "Hammam Sousse" },
      { id: 12, name: "Port El Kantaoui" },
      { id: 13, name: "Msaken" }
    ]
  },
  {
    id: 4,
    name: "Kairouan",
    cities: [
      { id: 14, name: "Kairouan City" },
      { id: 15, name: "Haffouz" },
      { id: 16, name: "Sbikha" }
    ]
  },
  {
    id: 5,
    name: "Bizerte",
    cities: [
      { id: 17, name: "Bizerte City" },
      { id: 18, name: "Menzel Bourguiba" },
      { id: 19, name: "Ras Jebel" },
      { id: 20, name: "Mateur" }
    ]
  },
  {
    id: 6,
    name: "Gabès",
    cities: [
      { id: 21, name: "Gabès City" },
      { id: 22, name: "El Hamma" },
      { id: 23, name: "Matmata" }
    ]
  },
  {
    id: 7,
    name: "Ariana",
    cities: [
      { id: 24, name: "Ariana City" },
      { id: 25, name: "Raoued" },
      { id: 26, name: "Sidi Thabet" }
    ]
  },
  {
    id: 8,
    name: "Gafsa",
    cities: [
      { id: 27, name: "Gafsa City" },
      { id: 28, name: "Metlaoui" },
      { id: 29, name: "El Ksar" }
    ]
  },
  {
    id: 9,
    name: "Monastir",
    cities: [
      { id: 30, name: "Monastir City" },
      { id: 31, name: "Ksibet el-Médiouni" },
      { id: 32, name: "Sahline" }
    ]
  },
  {
    id: 10,
    name: "Ben Arous",
    cities: [
      { id: 33, name: "Ben Arous City" },
      { id: 34, name: "Radès" },
      { id: 35, name: "Mégrine" }
    ]
  }
];

export interface LocationType {
  governorate: string;
  city: string;
}

export function formatLocation(location: LocationType): string {
  return `${location.city}, ${location.governorate}, Tunisia`;
}

export function parseLocation(locationString: string): LocationType | null {
  try {
    const parts = locationString.split(', ');
    if (parts.length >= 3) {
      return {
        city: parts[0],
        governorate: parts[1]
      };
    }
    return null;
  } catch (error) {
    return null;
  }
} 