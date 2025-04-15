import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { Coordinate } from '../types';
import {
  LOCATION_UPDATE_INTERVAL_MS,
  LOCATION_UPDATE_DISTANCE_METERS,
} from '../utils/constants';

export const useLocationTracking = () => {
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(
    null
  );
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );

  // Solicitar permisos
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    console.log('Requesting location permissions...');
    let { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status !== 'granted') {
      Alert.alert(
        'Permiso denegado',
        'Se necesita permiso de ubicación para rastrear la caminata.'
      );
      console.log('Location permission denied.');
      return false;
    }
    console.log('Location permission granted.');
    return true;
  }, []);

  // Obtener ubicación inicial o verificar permisos al montar
  useEffect(() => {
    (async () => {
      let { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status === 'granted') {
        try {
          console.log('Getting initial location...');
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          console.log('Initial location set:', location.coords);
        } catch (error) {
          console.error('Error getting initial location:', error);
          Alert.alert(
            'Error de Ubicación',
            'No se pudo obtener la ubicación inicial. Asegúrate de que el GPS esté activado.'
          );
        }
      } else {
        console.log('Initial permission status:', status);
      }
    })();
  }, []);

  // Iniciar rastreo
  const startTracking = useCallback(async () => {
    let hasPermission = permissionStatus === 'granted';
    if (!hasPermission) {
      hasPermission = await requestPermissions();
    }

    if (!hasPermission) {
      setIsTracking(false);
      return;
    }

    if (isTracking) {
      console.log('Tracking already active.');
      return; // Evitar iniciar múltiples veces
    }

    console.log('Starting location tracking...');
    setRouteCoordinates([]); // Limpiar ruta anterior
    setIsTracking(true);

    try {
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_UPDATE_INTERVAL_MS,
          distanceInterval: LOCATION_UPDATE_DISTANCE_METERS,
        },
        (location) => {
          const newCoordinate: Coordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          // console.log("New location update:", newCoordinate);
          setCurrentLocation(newCoordinate);
          setRouteCoordinates((prevRoute) => [...prevRoute, newCoordinate]);
        }
      );
      console.log('Location tracking started successfully.');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      Alert.alert(
        'Error de Rastreo',
        'No se pudo iniciar el seguimiento de ubicación.'
      );
      setIsTracking(false);
    }
  }, [permissionStatus, isTracking, requestPermissions]);

  // Detener rastreo
  const stopTracking = useCallback(() => {
    if (!isTracking) return;
    console.log('Stopping location tracking...');
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setIsTracking(false);
    console.log('Location tracking stopped.');
  }, [isTracking]);

  // Limpiar suscripción al desmontar
  useEffect(() => {
    return () => {
      console.log('Cleaning up location subscription...');
      locationSubscription.current?.remove();
    };
  }, []);

  return {
    permissionStatus,
    isTracking,
    currentLocation,
    routeCoordinates,
    startTracking,
    stopTracking,
    requestPermissions,
  };
};
