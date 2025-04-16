import {
    AchievementDefinition,
    AchievementCalculationType,
  } from '../types/Achievement'; // Ajusta ruta
  
  // --- Define aquí tus logros ---
  // Asegúrate de tener imágenes correspondientes en tu carpeta de assets
  // ¡RECUERDA CAMBIAR LOS require() A LAS RUTAS CORRECTAS DE TUS IMÁGENES!
  
  export const ACHIEVEMENTS: AchievementDefinition[] = [
    // --- Logros de Captura Total ---
    {
      id: 'catch_10',
      title: 'Entrenador Novato',
      description: 'Captura 10 Pokémon.',
      medalImage: require('../../assets/images/medals/medal_catch_bronze.png'), // CAMBIAR RUTA
      goal: 3,
      calculationType: 'TOTAL_CAPTURED',
      rewards: [
        { itemId: 'pokeball', quantity: 10 },
        { itemId: 'razz-berry', quantity: 5 },
      ],
    },
    {
      id: 'catch_50',
      title: '¡50 y subiendo!',
      description: 'Captura 50 Pokémon.',
      medalImage: require('../../assets/images/medals/medal_catch_silver.png'), // CAMBIAR RUTA
      goal: 50,
      calculationType: 'TOTAL_CAPTURED',
      rewards: [
        { itemId: 'greatball', quantity: 10 },
        { itemId: 'golden-razz-berry', quantity: 5 },
      ],
    },
    {
      id: 'catch_100',
      title: 'Coleccionista en serie',
      description: 'Captura 100 Pokémon.',
      medalImage: require('../../assets/images/medals/medal_catch_gold.png'), // CAMBIAR RUTA
      goal: 100,
      calculationType: 'TOTAL_CAPTURED',
      rewards: [
        { itemId: 'ultraball', quantity: 15 },
        { itemId: 'lucky-egg', quantity: 4 },
        { itemId: 'masterball', quantity: 1 },
      ],
    },
    {
      id: 'catch_200',
      title: '¡Pokemaníaco!',
      description: 'Captura 200 Pokémon.',
      medalImage: require('../../assets/images/medals/medal_catch_diamond.png'), // CAMBIAR RUTA
      goal: 200,
      calculationType: 'TOTAL_CAPTURED',
      rewards: [
        { itemId: 'ultraball', quantity: 30 },
        { itemId: 'lucky-egg', quantity: 3 },
      ],
    },
  
    // --- Logro de Completar Pokédex (Ejemplo con Kanto/Johto = 251) ---
    {
      id: 'pokedex_complete_251',
      title: 'Maestro Pokémon',
      description: 'Registra 251 Pokémon.',
      medalImage: require('../../assets/images/medals/medal_full_pokedex.png'), // CAMBIAR RUTA
      goal: 251, // Debe coincidir con NATIONAL_POKEDEX_COUNT si usas eso
      calculationType: 'POKEDEX_CAUGHT_COUNT',
      rewards: [
        { itemId: 'masterball', quantity: 1 }, // ¡Recompensa alta!
        { itemId: 'lucky-egg', quantity: 5 },
      ],
    },
  
    // --- Logros de Tipo (Ejemplos) ---
    {
      id: 'type_normal_20',
      title: 'Esto no es normal...',
      description: 'Captura 20 Pokémon de tipo Normal.',
      medalImage: require('../../assets/images/medals/medal_catch_normal.png'), // CAMBIAR RUTA
      goal: 20,
      calculationType: 'POKEDEX_TYPE_CAUGHT_COUNT',
      calculationTarget: 'normal', // El tipo a buscar (en minúsculas)
      rewards: [
        { itemId: 'pokeball', quantity: 20 },
      ],
    },
    {
      id: 'type_fire_20',
      title: '¡Esto sí que quema!',
      description: 'Captura 20 Pokémon de tipo Fuego.',
      medalImage: require('../../assets/images/medals/medal_catch_fire.png'), // CAMBIAR RUTA
      goal: 20,
      calculationType: 'POKEDEX_TYPE_CAUGHT_COUNT',
      calculationTarget: 'fire',
      rewards: [
        { itemId: 'greatball', quantity: 10 },
         { itemId: 'razz-berry', quantity: 10 }, // Asume que tienes bayas por ID
      ],
    },
    {
      id: 'type_water_20',
      title: 'Rey de las mareas',
      description: 'Captura 20 Pokémon de tipo Agua.',
      medalImage: require('../../assets/images/medals/medal_catch_water.png'), // CAMBIAR RUTA
      goal: 20,
      calculationType: 'POKEDEX_TYPE_CAUGHT_COUNT',
      calculationTarget: 'water',
      rewards: [
        { itemId: 'greatball', quantity: 10 },
        { itemId: 'razz-berry', quantity: 10 },
      ],
    },
     {
      id: 'type_grass_20',
      title: 'Coleccionista botánico',
      description: 'Captura 20 Pokémon de tipo Planta.',
      medalImage: require('../../assets/images/medals/medal_catch_plant.png'), // CAMBIAR RUTA
      goal: 20,
      calculationType: 'POKEDEX_TYPE_CAUGHT_COUNT',
      calculationTarget: 'grass',
      rewards: [
        { itemId: 'greatball', quantity: 10 },
        { itemId: 'razz-berry', quantity: 10 },
      ],
    },
    // ... Añade más logros para otros tipos, caminar distancias, etc. ...
  ];