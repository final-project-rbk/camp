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
      { id: 5, name: "Sidi Bou Said" },
      { id: 6, name: "La Goulette" },
      { id: 7, name: "El Menzah" },
      { id: 8, name: "Lac" },
      { id: 9, name: "Belvédère" },
      { id: 10, name: "Bab Saadoun" }
    ]
  },
  {
    id: 2,
    name: "Sfax",
    cities: [
      { id: 11, name: "Sfax City" },
      { id: 12, name: "Sakiet Ezzit" },
      { id: 13, name: "Mahres" },
      { id: 14, name: "Kerkennah" },
      { id: 15, name: "Sakiet Eddaier" },
      { id: 16, name: "Thyna" },
      { id: 17, name: "Agareb" },
      { id: 18, name: "Jebeniana" },
      { id: 19, name: "El Hencha" },
      { id: 20, name: "Bir Ali Ben Khalifa" }
    ]
  },
  {
    id: 3,
    name: "Sousse",
    cities: [
      { id: 21, name: "Sousse City" },
      { id: 22, name: "Hammam Sousse" },
      { id: 23, name: "Port El Kantaoui" },
      { id: 24, name: "Msaken" },
      { id: 25, name: "Akouda" },
      { id: 26, name: "Enfidha" },
      { id: 27, name: "Hergla" },
      { id: 28, name: "Sidi El Hani" },
      { id: 29, name: "Bouficha" },
      { id: 30, name: "Chott Meriem" }
    ]
  },
  {
    id: 4,
    name: "Kairouan",
    cities: [
      { id: 31, name: "Kairouan City" },
      { id: 32, name: "Haffouz" },
      { id: 33, name: "Sbikha" },
      { id: 34, name: "Oueslatia" },
      { id: 35, name: "Nasrallah" },
      { id: 36, name: "Bou Hajla" },
      { id: 37, name: "El Alâa" },
      { id: 38, name: "Chbika" },
      { id: 39, name: "Echrarda" },
      { id: 40, name: "Sidi Amor Bou Hajla" }
    ]
  },
  {
    id: 5,
    name: "Bizerte",
    cities: [
      { id: 41, name: "Bizerte City" },
      { id: 42, name: "Menzel Bourguiba" },
      { id: 43, name: "Ras Jebel" },
      { id: 44, name: "Mateur" },
      { id: 45, name: "Menzel Abderrahmen" },
      { id: 46, name: "Menzel Jemil" },
      { id: 47, name: "Sejnane" },
      { id: 48, name: "Ghar El Melh" },
      { id: 49, name: "Aousja" },
      { id: 50, name: "Tinja" }
    ]
  },
  {
    id: 6,
    name: "Gabès",
    cities: [
      { id: 51, name: "Gabès City" },
      { id: 52, name: "El Hamma" },
      { id: 53, name: "Matmata" },
      { id: 54, name: "Ghannouch" },
      { id: 55, name: "Métouia" },
      { id: 56, name: "Oudhref" },
      { id: 57, name: "Chenini Nahal" },
      { id: 58, name: "Mareth" },
      { id: 59, name: "Nouvelle Matmata" },
      { id: 60, name: "Bouchemma" }
    ]
  },
  {
    id: 7,
    name: "Ariana",
    cities: [
      { id: 61, name: "Ariana City" },
      { id: 62, name: "Raoued" },
      { id: 63, name: "Sidi Thabet" },
      { id: 64, name: "La Soukra" },
      { id: 65, name: "Ettadhamen" },
      { id: 66, name: "Mnihla" },
      { id: 67, name: "Kalâat el-Andalous" },
      { id: 68, name: "Sidi Amor" },
      { id: 69, name: "Borj Touil" },
      { id: 70, name: "Mornag" }
    ]
  },
  {
    id: 8,
    name: "Gafsa",
    cities: [
      { id: 71, name: "Gafsa City" },
      { id: 72, name: "Metlaoui" },
      { id: 73, name: "El Ksar" },
      { id: 74, name: "Redeyef" },
      { id: 75, name: "Moularès" },
      { id: 76, name: "Sidi Aïch" },
      { id: 77, name: "Sened" },
      { id: 78, name: "Belkhir" },
      { id: 79, name: "Lela" },
      { id: 80, name: "Sidi Boubaker" }
    ]
  },
  {
    id: 9,
    name: "Monastir",
    cities: [
      { id: 81, name: "Monastir City" },
      { id: 82, name: "Ksibet el-Médiouni" },
      { id: 83, name: "Sahline" },
      { id: 84, name: "Bekalta" },
      { id: 85, name: "Jemmal" },
      { id: 86, name: "Ksar Hellal" },
      { id: 87, name: "Moknine" },
      { id: 88, name: "Téboulba" },
      { id: 89, name: "Bembla" },
      { id: 90, name: "Zéramdine" }
    ]
  },
  {
    id: 10,
    name: "Ben Arous",
    cities: [
      { id: 91, name: "Ben Arous City" },
      { id: 92, name: "Radès" },
      { id: 93, name: "Mégrine" },
      { id: 94, name: "Hammam Lif" },
      { id: 95, name: "Fouchana" },
      { id: 96, name: "Mornaguia" },
      { id: 97, name: "El Mourouj" },
      { id: 98, name: "Hammam Chott" },
      { id: 99, name: "Bou Mhel el-Bassatine" },
      { id: 100, name: "Ezzahra" }
    ]
  },
  {
    id: 11,
    name: "Nabeul",
    cities: [
      { id: 101, name: "Nabeul City" },
      { id: 102, name: "Hammamet" },
      { id: 103, name: "Korba" },
      { id: 104, name: "Dar Chaâbane" },
      { id: 105, name: "Menzel Temime" },
      { id: 106, name: "Béni Khiar" },
      { id: 107, name: "El Maâmoura" },
      { id: 108, name: "Tazarka" },
      { id: 109, name: "Soliman" },
      { id: 110, name: "Grombalia" }
    ]
  },
  {
    id: 12,
    name: "Jendouba",
    cities: [
      { id: 111, name: "Jendouba City" },
      { id: 112, name: "Tabarka" },
      { id: 113, name: "Ain Draham" },
      { id: 114, name: "Bou Salem" },
      { id: 115, name: "Fernana" },
      { id: 116, name: "Ghardimaou" },
      { id: 117, name: "Oued Meliz" },
      { id: 118, name: "Balta-Bou Aouene" },
      { id: 119, name: "Jendouba Sud" },
      { id: 120, name: "Sidi Abdelhamid" }
    ]
  },
  {
    id: 13,
    name: "Kasserine",
    cities: [
      { id: 121, name: "Kasserine City" },
      { id: 122, name: "Sbeitla" },
      { id: 123, name: "Fériana" },
      { id: 124, name: "Thala" },
      { id: 125, name: "Haidra" },
      { id: 126, name: "Foussana" },
      { id: 127, name: "Jilma" },
      { id: 128, name: "Sidi Bouzid" },
      { id: 129, name: "Ezzouhour" },
      { id: 130, name: "El Ayoun" }
    ]
  },
  {
    id: 14,
    name: "Siliana",
    cities: [
      { id: 131, name: "Siliana City" },
      { id: 132, name: "Bou Arada" },
      { id: 133, name: "Gaâfour" },
      { id: 134, name: "El Krib" },
      { id: 135, name: "Sidi Bou Rouis" },
      { id: 136, name: "Maktar" },
      { id: 137, name: "Rouhia" },
      { id: 138, name: "Bargou" },
      { id: 139, name: "Kesra" },
      { id: 140, name: "El Aroussa" }
    ]
  },
  {
    id: 15,
    name: "Kef",
    cities: [
      { id: 141, name: "El Kef City" },
      { id: 142, name: "Tajerouine" },
      { id: 143, name: "Nebeur" },
      { id: 144, name: "Sakiet Sidi Youssef" },
      { id: 145, name: "Dahmani" },
      { id: 146, name: "Jérissa" },
      { id: 147, name: "Kalâat Khasba" },
      { id: 148, name: "Sers" },
      { id: 149, name: "Touiref" },
      { id: 150, name: "El Ksour" }
    ]
  },
  {
    id: 16,
    name: "Béja",
    cities: [
      { id: 151, name: "Béja City" },
      { id: 152, name: "Nefza" },
      { id: 153, name: "Téboursouk" },
      { id: 154, name: "Testour" },
      { id: 155, name: "Goubellat" },
      { id: 156, name: "Medjez el-Bab" },
      { id: 157, name: "Amdoun" },
      { id: 158, name: "Tibar" },
      { id: 159, name: "Sidi Ismail" },
      { id: 160, name: "Sidi M'Hamed" }
    ]
  },
  {
    id: 17,
    name: "Zaghouan",
    cities: [
      { id: 161, name: "Zaghouan City" },
      { id: 162, name: "Zriba" },
      { id: 163, name: "Fahs" },
      { id: 164, name: "Saouaf" },
      { id: 165, name: "Bir Mcherga" },
      { id: 166, name: "Joumine" },
      { id: 167, name: "El Fahs" },
      { id: 168, name: "Nadhour" },
      { id: 169, name: "Zaghouan Nord" },
      { id: 170, name: "Zaghouan Sud" }
    ]
  },
  {
    id: 18,
    name: "Manouba",
    cities: [
      { id: 171, name: "Manouba City" },
      { id: 172, name: "Borj El Amri" },
      { id: 173, name: "Oued Ellil" },
      { id: 174, name: "Mornaguia" },
      { id: 175, name: "Douar Hicher" },
      { id: 176, name: "Tebourba" },
      { id: 177, name: "Jedaida" },
      { id: 178, name: "Mateur" },
      { id: 179, name: "Borj Touil" },
      { id: 180, name: "El Battan" }
    ]
  },
  {
    id: 19,
    name: "Mahdia",
    cities: [
      { id: 181, name: "Mahdia City" },
      { id: 182, name: "Bou Merdes" },
      { id: 183, name: "El Jem" },
      { id: 184, name: "Ksour Essef" },
      { id: 185, name: "Chorbane" },
      { id: 186, name: "Sidi Alouane" },
      { id: 187, name: "Ouled Chamekh" },
      { id: 188, name: "Chebba" },
      { id: 189, name: "Melloulèche" },
      { id: 190, name: "Bou Salama" }
    ]
  },
  {
    id: 20,
    name: "Sidi Bouzid",
    cities: [
      { id: 191, name: "Sidi Bouzid City" },
      { id: 192, name: "Menzel Bouzaiane" },
      { id: 193, name: "Sidi Ali Ben Aoun" },
      { id: 194, name: "Jilma" },
      { id: 195, name: "Cebbala Ouled Asker" },
      { id: 196, name: "Bir El Hafey" },
      { id: 197, name: "Sidi Bouzid Est" },
      { id: 198, name: "Sidi Bouzid Ouest" },
      { id: 199, name: "Menzel Bouzaiane" },
      { id: 200, name: "Regueb" }
    ]
  },
  {
    id: 21,
    name: "Médenine",
    cities: [
      { id: 201, name: "Médenine City" },
      { id: 202, name: "Ben Gardane" },
      { id: 203, name: "Zarzis" },
      { id: 204, name: "Djerba" },
      { id: 205, name: "Zarzis Nord" },
      { id: 206, name: "Zarzis Sud" },
      { id: 207, name: "Beni Khedache" },
      { id: 208, name: "Sidi Makhlouf" },
      { id: 209, name: "Houmt Souk" },
      { id: 210, name: "Midoun" }
    ]
  },
  {
    id: 22,
    name: "Tataouine",
    cities: [
      { id: 211, name: "Tataouine City" },
      { id: 212, name: "Remada" },
      { id: 213, name: "Bir Lahmar" },
      { id: 214, name: "Ghomrassen" },
      { id: 215, name: "Dehiba" },
      { id: 216, name: "Smâr" },
      { id: 217, name: "Bir Soltane" },
      { id: 218, name: "Tataouine Sud" },
      { id: 219, name: "Tataouine Nord" },
      { id: 220, name: "Oum Ez Zessar" }
    ]
  },
  {
    id: 23,
    name: "Kebili",
    cities: [
      { id: 221, name: "Kebili City" },
      { id: 222, name: "Douz" },
      { id: 223, name: "Souk Lahad" },
      { id: 224, name: "Faouar" },
      { id: 225, name: "Kebili Nord" },
      { id: 226, name: "Kebili Sud" },
      { id: 227, name: "El Golâa" },
      { id: 228, name: "Jemna" },
      { id: 229, name: "Nefzaoua" },
      { id: 230, name: "Rjim Maatoug" }
    ]
  },
  {
    id: 24,
    name: "Tozeur",
    cities: [
      { id: 231, name: "Tozeur City" },
      { id: 232, name: "Nefta" },
      { id: 233, name: "Degache" },
      { id: 234, name: "Hazoua" },
      { id: 235, name: "Tamerza" },
      { id: 236, name: "Chebika" },
      { id: 237, name: "Mides" },
      { id: 238, name: "Tozeur Nord" },
      { id: 239, name: "Tozeur Sud" },
      { id: 240, name: "El Hamma du Jérid" }
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