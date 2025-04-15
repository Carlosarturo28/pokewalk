// src/utils/profilePictures.ts
import { ImageSourcePropType } from 'react-native';

// Define la estructura de cada opción de imagen
export interface ProfilePictureOption {
  id: string; // Un identificador único para guardar
  name: string; // Nombre descriptivo (opcional)
  source: ImageSourcePropType; // La fuente de la imagen (require)
}

// --- DEFINE AQUÍ TUS IMÁGENES DE PERFIL PREDEFINIDAS ---
// Asegúrate de que las rutas sean correctas y las imágenes existan
export const PROFILE_PICTURES: ProfilePictureOption[] = [
  {
    id: 'trainer_m1',
    name: 'Entrenador 1',
    source: require('../../assets/images/profile/trainer_m1.png'),
  },
  {
    id: 'trainer_f1',
    name: 'Entrenadora 1',
    source: require('../../assets/images/profile/trainer_f1.png'),
  },
  {
    id: 'trainer_m2',
    name: 'Entrenador 2',
    source: require('../../assets/images/profile/trainer_m2.png'),
  },
  {
    id: 'trainer_f2',
    name: 'Entrenadora 2',
    source: require('../../assets/images/profile/trainer_f2.png'),
  },
  {
    id: 'pikachu_icon',
    name: 'Pikachu',
    source: require('../../assets/images/profile/pikachu_icon.jpg'),
  },
  {
    id: 'pokeball_icon',
    name: 'Poké Ball',
    source: require('../../assets/images/profile/pokeball_icon.jpg'),
  },
  // Añade más imágenes aquí...
  // { id: 'charmander_icon', name: 'Charmander', source: require('@/src/assets/profile/charmander_icon.png') },
];

// Puedes añadir una función para obtener la fuente por ID si lo prefieres
export const getProfilePictureSourceById = (
  id: string | null
): ImageSourcePropType => {
  const found = PROFILE_PICTURES.find((p) => p.id === id);
  // Devuelve la fuente encontrada o el placeholder por defecto
  return found
    ? found.source
    : require('../../assets/images/profile-placeholder.png');
};
