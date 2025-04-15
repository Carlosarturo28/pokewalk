// src/components/map/MapViewComponent.tsx
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Image, Platform, Text } from 'react-native'; // Añadir Text
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';
import { useWalk } from '@/src/contexts/WalkContext';
import { Coordinate, PokemonEncounter } from '@/src/types';

import MinimalMapStyle from '@/src/utils/mapStyle.json'; // <-- ¡Ajusta la ruta!

const pokeballPlaceholder = require('../../assets/images/pokeball-placeholder.png');

interface Props {
  onEncounterPress: (encounter: PokemonEncounter) => void;
}

export const MapViewComponent: React.FC<Props> = ({ onEncounterPress }) => {
  const { walkSummary } = useWalk();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        walkSummary?.route &&
        walkSummary.route.length > 1 &&
        mapRef.current
      ) {
        const coordinatesToFit: Coordinate[] = walkSummary.route;
        console.log('Fitting map to coordinates (summary view)...');
        mapRef.current.fitToCoordinates(coordinatesToFit, {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: false,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [walkSummary]);

  if (!walkSummary?.route || walkSummary.route.length < 1) {
    return (
      <View style={styles.mapLoading}>
        <Text>Cargando datos del mapa...</Text>
      </View>
    );
  }

  const routeCoordinatesForPolyline: Coordinate[] = walkSummary.route;

  const shouldUseCustomStyle = Platform.OS === 'android';

  console.log(
    walkSummary?.encounters.filter(
      (enc): enc is PokemonEncounter => enc.type === 'pokemon'
    )
  );
  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      customMapStyle={shouldUseCustomStyle ? MinimalMapStyle : undefined}
      mapType='standard'
      showsPointsOfInterest={false}
      showsBuildings={false}
      showsTraffic={false}
      showsIndoors={false}
      showsCompass={false}
      toolbarEnabled={false}
      showsUserLocation={false}
      loadingEnabled={true}
      scrollEnabled={true}
      zoomEnabled={true}
    >
      {routeCoordinatesForPolyline.length > 1 && (
        <Polyline
          coordinates={routeCoordinatesForPolyline}
          strokeColor='#E3546D'
          strokeWidth={4.5}
          lineCap='round'
          lineJoin='round'
          zIndex={1}
        />
      )}
      {(walkSummary?.encounters ?? [])
        .filter((enc): enc is PokemonEncounter => enc.type === 'pokemon')
        .map((pokemonEncounter) => {
          const spriteUri = pokemonEncounter.isShiny
            ? pokemonEncounter.pokemonDetails.sprites.front_shiny
            : pokemonEncounter.pokemonDetails.sprites.front_default;
          let borderColor = pokemonEncounter.isShiny ? '#FFD700' : '#333';
          let markerOpacity = 1.0;
          if (pokemonEncounter.caught) {
            borderColor = '#4CAF50';
            markerOpacity = 1;
          }
          return (
            <Marker
              key={pokemonEncounter.id}
              identifier={`marker-${pokemonEncounter.id}`}
              coordinate={pokemonEncounter.location}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() =>
                !pokemonEncounter.caught
                  ? onEncounterPress(pokemonEncounter)
                  : null
              }
              zIndex={pokemonEncounter.caught ? 5 : 10}
            >
              <View
                style={[styles.markerTouchable, { opacity: markerOpacity }]}
              >
                <View style={[styles.markerContainer, { borderColor }]}>
                  <Image
                    source={
                      spriteUri ? { uri: spriteUri } : pokeballPlaceholder
                    }
                    style={styles.markerSprite}
                    resizeMode='contain'
                  />
                </View>
              </View>
            </Marker>
          );
        })}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  markerTouchable: {},
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1.5,
    elevation: 3,
  },
  markerSprite: {
    width: 30,
    height: 30,
  },
});
