import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, Platform, AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Coordinate } from '../types';
import {
  LOCATION_UPDATE_INTERVAL_MS,
  LOCATION_UPDATE_DISTANCE_METERS,
} from '../utils/constants';

// --- Constantes ---
const BACKGROUND_LOCATION_TASK = 'background-location-task-v6'; // Inc version
const LOCATION_ROUTE_STORAGE_KEY = '@PokemonWalkApp:backgroundRoute';

// --- Define la tarea (Solo para builds Standalone) ---
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  // ... (sin cambios en la lógica de la tarea)
  if (error) {
    console.error('[Task] Error:', error.message);
    return;
  }
  if (data) {
    const locations = (data as any)?.locations as Location.LocationObject[];
    if (locations && locations.length > 0) {
      const newCoordinates: Coordinate[] = locations.map((loc) => ({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }));
      try {
        const storedRoute = await AsyncStorage.getItem(
          LOCATION_ROUTE_STORAGE_KEY
        );
        let currentRoute: Coordinate[] = storedRoute
          ? JSON.parse(storedRoute)
          : [];
        currentRoute = [...currentRoute, ...newCoordinates];
        await AsyncStorage.setItem(
          LOCATION_ROUTE_STORAGE_KEY,
          JSON.stringify(currentRoute)
        );
      } catch (storageError: any) {
        console.error('[Task] Storage Error:', storageError.message);
      }
    }
  }
});

// --- El Hook ---
export const useLocationTracking = () => {
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null);
  const [backgroundPermissionStatus, setBackgroundPermissionStatus] =
    useState<Location.PermissionStatus | null>(null); // Relevante solo para Standalone
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(
    null
  );
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const appState = useRef(AppState.currentState);

  // --- Refs específicos para cada modo ---
  // Para TaskManager (Standalone)
  const wasStartedWithForegroundService = useRef(false);
  const isTransitioningTask = useRef(false);
  // Para watchPositionAsync (Expo Go)
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  // Detectar entorno
  const isRunningInExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  console.log(
    `***** Running in ${
      isRunningInExpoGo ? 'Expo Go' : 'Standalone Build'
    } *****`
  );

  // ============================================================
  // Lógica para STANDALONE BUILDS (TaskManager)
  // ============================================================

  const _startTaskManager = useCallback(
    async (useForegroundService: boolean) => {
      if (isTransitioningTask.current) {
        console.log('[Standalone] Task transition already in progress.');
        return;
      }
      isTransitioningTask.current = true;
      console.log(
        `[Standalone] --- Attempting to start task (useForegroundService: ${useForegroundService}) --- `
      );

      // Asumir que bg permission ya está OK (validado antes de llamar)
      let finalUseForegroundService =
        Platform.OS === 'android' && useForegroundService; // Solo Android usa FS

      const locationOptions: Location.LocationTaskOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_UPDATE_INTERVAL_MS,
        distanceInterval: LOCATION_UPDATE_DISTANCE_METERS,
        activityType: Location.ActivityType.Fitness,
        pausesUpdatesAutomatically: false,
      };

      if (finalUseForegroundService) {
        console.log('[Standalone] Configuring task WITH Foreground Service.');
        locationOptions.foregroundService = {
          notificationTitle: 'Pokemon Walk (Activo)',
          notificationBody: 'Rastreando tu caminata en segundo plano...',
          notificationColor: '#FFCC00',
        };
      } else {
        console.log(
          '[Standalone] Configuring task WITHOUT Foreground Service.'
        );
      }

      try {
        const isAlreadyRunning = await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_LOCATION_TASK
        );
        if (isAlreadyRunning) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          console.log('[Standalone] Previous task stopped.');
        }
        console.log(
          `[Standalone] FINAL options before start: ${JSON.stringify(
            locationOptions
          )}`
        );
        await Location.startLocationUpdatesAsync(
          BACKGROUND_LOCATION_TASK,
          locationOptions
        );
        wasStartedWithForegroundService.current = finalUseForegroundService;
        console.log(
          `[Standalone] ***** Task start requested (FS: ${finalUseForegroundService}). *****`
        );
      } catch (error: any) {
        console.error('[Standalone] !!!!!!! ERROR starting task:', error);
        Alert.alert(
          'Error de Rastreo (Standalone)',
          `No se pudo iniciar el seguimiento.\nCode: ${
            error.code || 'N/A'
          }\nMessage: ${error.message}`
        );
        wasStartedWithForegroundService.current = false;
        throw error;
      } finally {
        isTransitioningTask.current = false;
      }
    },
    []
  ); // No necesita dependencia de backgroundPermissionStatus aquí

  const _stopTaskManager = useCallback(async () => {
    if (isTransitioningTask.current) {
      console.log('[Standalone] Task transition already in progress.');
      return;
    }
    isTransitioningTask.current = true;
    const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isTaskRunning) {
      try {
        console.log('[Standalone] Stopping task...');
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('[Standalone] Task stopped.');
      } catch (error: any) {
        console.error('[Standalone] Error stopping task:', error.message);
      }
    }
    wasStartedWithForegroundService.current = false;
    isTransitioningTask.current = false;
  }, []);

  const loadRouteFromStorage = useCallback(async () => {
    // ... (sin cambios, solo para standalone)
    try {
      const storedRoute = await AsyncStorage.getItem(
        LOCATION_ROUTE_STORAGE_KEY
      );
      if (storedRoute) {
        const currentRoute: Coordinate[] = JSON.parse(storedRoute);
        setRouteCoordinates(currentRoute);
        if (currentRoute.length > 0) {
          setCurrentLocation(currentRoute[currentRoute.length - 1]);
        }
      } else {
        setRouteCoordinates([]);
      }
    } catch (e: any) {
      console.error(
        '[Standalone] Failed to load route from storage',
        e.message
      );
      setRouteCoordinates([]);
    }
  }, []);

  // ============================================================
  // Lógica para EXPO GO (Foreground Only - watchPositionAsync)
  // ============================================================

  const _startForegroundWatcher = useCallback(async () => {
    if (watchSubscription.current) {
      console.log('[ExpoGo] Watcher already active.');
      return; // Ya está corriendo
    }
    console.log('[ExpoGo] Starting foreground location watcher...');
    setRouteCoordinates([]); // Limpiar ruta al empezar

    try {
      watchSubscription.current = await Location.watchPositionAsync(
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
          // Actualizar estado directamente
          setCurrentLocation(newCoordinate);
          setRouteCoordinates((prevRoute) => [...prevRoute, newCoordinate]);
        }
      );
      console.log('[ExpoGo] Foreground watcher started successfully.');
    } catch (error: any) {
      console.error(
        '[ExpoGo] Error starting foreground watcher:',
        error.message
      );
      Alert.alert(
        'Error de Rastreo (Expo Go)',
        `No se pudo iniciar el seguimiento: ${error.message}`
      );
      throw error; // Propagar
    }
  }, []); // Sin dependencias complejas aquí

  const _stopForegroundWatcher = useCallback(() => {
    if (watchSubscription.current) {
      console.log('[ExpoGo] Stopping foreground watcher...');
      watchSubscription.current.remove();
      watchSubscription.current = null;
      console.log('[ExpoGo] Foreground watcher stopped.');
    }
  }, []);

  // ============================================================
  // Lógica Común (Permisos, Carga Inicial, Funciones Públicas)
  // ============================================================

  // --- Solicitud de Permisos ---
  const requestPermissions = useCallback(async (): Promise<{
    foreground: boolean;
    background: boolean;
  }> => {
    // ... (igual que antes, pide ambos si es Android)
    let fgGranted = false;
    let bgGranted = false;
    console.log('Requesting permissions...');
    let { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(fgStatus);
    fgGranted = fgStatus === 'granted';
    if (!fgGranted) {
      Alert.alert(
        'Permiso Requerido',
        'Se necesita permiso de ubicación en primer plano.'
      );
      return { foreground: false, background: false };
    }
    console.log('Foreground permission granted.');
    if (Platform.OS === 'android') {
      let { status: bgStatus } =
        await Location.requestBackgroundPermissionsAsync();
      setBackgroundPermissionStatus(bgStatus);
      bgGranted = bgStatus === 'granted';
      if (!bgGranted) {
        Alert.alert(
          'Permiso Opcional Denegado',
          'El permiso "Permitir todo el tiempo" es necesario para rastrear si la app se cierra (en builds).'
        );
      } else {
        console.log('Background permission granted.');
      }
    } else {
      bgGranted = true; /* Simplificación iOS */
    }
    return { foreground: fgGranted, background: bgGranted };
  }, []);

  // --- Carga Inicial ---
  useEffect(() => {
    (async () => {
      console.log('Checking initial permissions...');
      // ... (obtener permisos iniciales fg y bg)
      let { status: fgStatus } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(fgStatus);
      let bgStatus: Location.PermissionStatus | null = null;
      if (Platform.OS === 'android') {
        try {
          const backgroundPerms =
            await Location.getBackgroundPermissionsAsync();
          bgStatus = backgroundPerms.status;
          setBackgroundPermissionStatus(bgStatus);
        } catch (e: any) {
          console.error('Error checking background permissions:', e.message);
        }
      }
      console.log(
        `Initial Permissions - FG: ${fgStatus}, BG: ${bgStatus ?? 'N/A'}`
      );
      if (fgStatus === 'granted') {
        try {
          let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (error: any) {
          console.error('Error getting initial location:', error.message);
        }
      }

      // Lógica inicial solo para STANDALONE
      if (!isRunningInExpoGo) {
        const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_LOCATION_TASK
        );
        console.log(
          '[Standalone] Is task already running on mount?',
          isTaskRunning
        );
        if (isTaskRunning) {
          if (Platform.OS !== 'android' || bgStatus === 'granted') {
            console.log('[Standalone] Task was running, restoring state.');
            setIsTracking(true);
            loadRouteFromStorage();
          } else {
            console.warn(
              '[Standalone] Task was running but background permission is NOT granted. Stopping task.'
            );
            await _stopTaskManager();
            setIsTracking(false);
            try {
              await AsyncStorage.removeItem(LOCATION_ROUTE_STORAGE_KEY);
            } catch (e: any) {
              console.error('Error cleaning storage:', e.message);
            }
          }
        } else {
          setIsTracking(false);
          try {
            await AsyncStorage.removeItem(LOCATION_ROUTE_STORAGE_KEY);
          } catch (e: any) {
            console.error('Error cleaning storage:', e.message);
          }
        }
      } else {
        // En Expo Go, nunca restauramos estado de tracking al inicio
        setIsTracking(false);
      }
    })();
  }, [isRunningInExpoGo]); // Dependencia clave: entorno de ejecución

  // --- Listener de AppState (SOLO para Standalone) ---
  useEffect(() => {
    // Si estamos en Expo Go, no necesitamos este listener para cambiar FS
    if (isRunningInExpoGo) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;
      appState.current = nextAppState;
      if (!isTracking || isTransitioningTask.current) return; // Salir si no rastrea o transiciona

      // Solo actuar si tenemos permiso de background (Android)
      if (Platform.OS === 'android' && backgroundPermissionStatus !== 'granted')
        return;

      const isGoingToBackground =
        previousAppState === 'active' &&
        nextAppState.match(/inactive|background/);
      const isComingToForeground =
        previousAppState.match(/inactive|background/) &&
        nextAppState === 'active';

      if (isGoingToBackground && !wasStartedWithForegroundService.current) {
        console.log(
          '[Standalone] Going to background, restarting task WITH FS...'
        );
        try {
          await _startTaskManager(true);
        } catch (e) {
          console.error('Failed to restart task for background:', e);
          await _stopTaskManager();
          setIsTracking(false);
        }
      } else if (
        isComingToForeground &&
        wasStartedWithForegroundService.current
      ) {
        console.log(
          '[Standalone] Coming to foreground, restarting task WITHOUT FS...'
        );
        try {
          await _startTaskManager(false);
          await loadRouteFromStorage();
        } catch (e) {
          console.error('Failed to restart task for foreground:', e);
          await _stopTaskManager();
          setIsTracking(false);
        }
      } else if (
        isComingToForeground &&
        !wasStartedWithForegroundService.current
      ) {
        await loadRouteFromStorage();
      }
    };

    console.log(
      '[Standalone] Setting up AppState listener for FS transitions.'
    );
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => {
      console.log('[Standalone] Removing AppState listener.');
      subscription.remove();
    };
    // Dependencias para el listener de Standalone
  }, [
    isTracking,
    backgroundPermissionStatus,
    isRunningInExpoGo,
    loadRouteFromStorage,
    _startTaskManager,
    _stopTaskManager,
  ]);

  // --- Funciones públicas ---

  const startTracking = useCallback(async () => {
    if (isTracking) {
      console.log('Tracking is already active.');
      return;
    }

    // 1. Permiso de Primer Plano (Siempre necesario)
    let fgStatus = permissionStatus;
    if (fgStatus !== 'granted') {
      const result = await requestPermissions();
      fgStatus = permissionStatus;
      if (!result.foreground) return;
    }

    // 2. Limpiar ruta y storage
    setRouteCoordinates([]);
    if (!isRunningInExpoGo) {
      // Solo limpiar storage si usamos TaskManager
      await AsyncStorage.removeItem(LOCATION_ROUTE_STORAGE_KEY);
    }

    try {
      // 3. Iniciar el método apropiado según el entorno
      if (isRunningInExpoGo) {
        console.log(
          'Starting tracking in Expo Go mode (Foreground Watcher)...'
        );
        await _startForegroundWatcher();
      } else {
        // En Standalone, verificar permiso background antes de iniciar TaskManager
        let bgStatus = backgroundPermissionStatus;
        if (Platform.OS === 'android' && bgStatus !== 'granted') {
          console.log(
            'Background permission not granted for Standalone, requesting again...'
          );
          const result = await requestPermissions(); // Pide ambos
          bgStatus = backgroundPermissionStatus; // Actualizar estado local
          if (!result.background) {
            Alert.alert(
              'Permiso Requerido (Standalone)',
              'Se necesita el permiso "Permitir todo el tiempo" para rastrear en segundo plano en esta versión.'
            );
            return; // Detener si no se concede
          }
        }
        console.log('Starting tracking in Standalone mode (Task Manager)...');
        await _startTaskManager(false); // Inicia sin FS al principio
      }
      setIsTracking(true); // Marcar como rastreando si el inicio fue exitoso
      console.log('Tracking successfully initiated.');
    } catch (error: any) {
      // El error ya se alerta dentro de las funciones _start...
      console.error('Error caught in public startTracking:', error.message);
      setIsTracking(false); // Asegurar estado correcto si falla
    }
  }, [
    isTracking,
    permissionStatus,
    backgroundPermissionStatus,
    isRunningInExpoGo,
    requestPermissions,
    _startTaskManager,
    _startForegroundWatcher,
  ]);

  const stopTracking = useCallback(async () => {
    if (!isTracking) {
      console.log('Tracking is not active.');
      return;
    }

    console.log('Stopping Tracking (User action)...');
    if (isRunningInExpoGo) {
      _stopForegroundWatcher();
      // La ruta ya está en routeCoordinates, no se necesita cargar de storage
    } else {
      await _stopTaskManager();
      console.log(
        '[Standalone] Loading final route from storage after stopping...'
      );
      await loadRouteFromStorage(); // Carga la ruta final de TaskManager
    }
    setIsTracking(false);
    console.log('Tracking stopped.');
  }, [
    isTracking,
    isRunningInExpoGo,
    _stopTaskManager,
    _stopForegroundWatcher,
    loadRouteFromStorage,
  ]);

  // --- Retorno del Hook ---
  return {
    permissionStatus,
    backgroundPermissionStatus: isRunningInExpoGo
      ? null
      : backgroundPermissionStatus, // Solo relevante en Standalone
    isTracking,
    currentLocation,
    routeCoordinates,
    startTracking,
    stopTracking,
    requestPermissions,
    loadRouteFromStorage: isRunningInExpoGo ? undefined : loadRouteFromStorage, // Solo relevante en Standalone
  };
};
