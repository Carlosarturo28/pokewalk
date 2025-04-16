import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, AppState, Platform, AppStateStatus } from 'react-native'; // AppState aún es útil para recargar ruta
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
const BACKGROUND_LOCATION_TASK = 'background-location-task-v7'; // Inc version
const LOCATION_ROUTE_STORAGE_KEY = '@PokemonWalkApp:backgroundRoute';

// --- Define la tarea ---
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    // ... (sin cambios en la lógica de la tarea)
    if (error) { console.error('[Task] Error:', error.message); return; }
    if (data) { const locations = (data as any)?.locations as Location.LocationObject[]; if (locations && locations.length > 0) { const newCoordinates: Coordinate[] = locations.map((loc) => ({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, })); try { const storedRoute = await AsyncStorage.getItem(LOCATION_ROUTE_STORAGE_KEY); let currentRoute: Coordinate[] = storedRoute ? JSON.parse(storedRoute) : []; currentRoute = [...currentRoute, ...newCoordinates]; await AsyncStorage.setItem(LOCATION_ROUTE_STORAGE_KEY, JSON.stringify(currentRoute)); } catch (storageError: any) { console.error('[Task] Storage Error:', storageError.message); } } }
});

// --- El Hook ---
export const useLocationTracking = () => {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [backgroundPermissionStatus, setBackgroundPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const appState = useRef(AppState.currentState);

  // Para watchPositionAsync (Expo Go)
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  // Detectar entorno
  const isRunningInExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  console.log(`***** Running in ${isRunningInExpoGo ? 'Expo Go' : 'Standalone Build'} *****`);


  // --- Solicitud de Permisos (sin cambios) ---
  const requestPermissions = useCallback(async (): Promise<{foreground: boolean, background: boolean}> => {
    let fgGranted = false; let bgGranted = false;
    console.log('Requesting permissions...');
    let { status: fgStatus } = await Location.requestForegroundPermissionsAsync(); setPermissionStatus(fgStatus); fgGranted = fgStatus === 'granted';
    if (!fgGranted) { Alert.alert('Permiso Requerido', 'Se necesita permiso de ubicación en primer plano.'); return { foreground: false, background: false }; }
    console.log('Foreground permission granted.');
    if (Platform.OS === 'android') {
      let { status: bgStatus } = await Location.requestBackgroundPermissionsAsync(); setBackgroundPermissionStatus(bgStatus); bgGranted = bgStatus === 'granted';
      if (!bgGranted) { Alert.alert('Permiso Opcional Denegado', 'El permiso "Permitir todo el tiempo" es necesario para rastrear si la app se cierra (en builds).'); } else { console.log('Background permission granted.'); }
    } else { bgGranted = true; /* Simplificación iOS */ }
    return { foreground: fgGranted, background: bgGranted };
  }, []);


  // --- Carga Inicial (Simplificada para Expo Go) ---
  useEffect(() => {
    (async () => {
      console.log('Checking initial permissions...');
      // ... (obtener permisos iniciales fg y bg)
      let { status: fgStatus } = await Location.getForegroundPermissionsAsync(); setPermissionStatus(fgStatus);
      let bgStatus: Location.PermissionStatus | null = null;
      if (Platform.OS === 'android') { try { const backgroundPerms = await Location.getBackgroundPermissionsAsync(); bgStatus = backgroundPerms.status; setBackgroundPermissionStatus(bgStatus); } catch (e:any) { console.error('Error checking background permissions:', e.message); }}
      console.log(`Initial Permissions - FG: ${fgStatus}, BG: ${bgStatus ?? 'N/A'}`);
      if (fgStatus === 'granted') { try { let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); setCurrentLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude }); } catch (error: any) { console.error('Error getting initial location:', error.message); }}

      // Lógica inicial solo para STANDALONE
      if (!isRunningInExpoGo) {
          const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          console.log('[Standalone] Is task already running on mount?', isTaskRunning);
          if (isTaskRunning) {
             if (Platform.OS !== 'android' || bgStatus === 'granted') {
                 console.log("[Standalone] Task was running, restoring state.");
                 setIsTracking(true);
                 loadRouteFromStorage(); // Carga la ruta acumulada
             } else {
                 console.warn("[Standalone] Task was running but background permission is NOT granted. Stopping task.");
                 await _stopTaskManager(); // Detener la tarea huérfana
                 setIsTracking(false);
                 try { await AsyncStorage.removeItem(LOCATION_ROUTE_STORAGE_KEY); } catch (e:any) { console.error("Error cleaning storage:", e.message); }
             }
          } else {
              setIsTracking(false);
              try { await AsyncStorage.removeItem(LOCATION_ROUTE_STORAGE_KEY); } catch (e:any) { console.error("Error cleaning storage:", e.message); }
          }
      } else {
           // En Expo Go, nunca restauramos estado de tracking al inicio
           setIsTracking(false);
      }
    })();
  }, [isRunningInExpoGo]); // Dependencia clave: entorno de ejecución


  // --- Cargar Ruta (Solo Standalone) ---
  const loadRouteFromStorage = useCallback(async () => {
    if (isRunningInExpoGo) return; // No hacer nada en Expo Go
    try { const storedRoute = await AsyncStorage.getItem(LOCATION_ROUTE_STORAGE_KEY); if (storedRoute) { const currentRoute: Coordinate[] = JSON.parse(storedRoute); setRouteCoordinates(currentRoute); if (currentRoute.length > 0) { setCurrentLocation(currentRoute[currentRoute.length - 1]); } } else { setRouteCoordinates([]); } } catch (e:any) { console.error('[Standalone] Failed to load route from storage', e.message); setRouteCoordinates([]); }
  }, [isRunningInExpoGo]);


  // --- Listener de AppState (SOLO para recargar ruta al volver a FG en Standalone) ---
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousAppState = appState.current;
      appState.current = nextAppState;

      // Si vuelve a primer plano Y estamos rastreando (en modo Standalone)
      if (
        !isRunningInExpoGo &&
        isTracking &&
        previousAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[Standalone] App came to foreground while tracking, reloading route data...');
        await loadRouteFromStorage();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => { subscription.remove(); };
    // Depende de isTracking y isRunningInExpoGo para saber si debe actuar
  }, [isTracking, isRunningInExpoGo, loadRouteFromStorage]);


  // ============================================================
  // Funciones específicas de inicio/parada por entorno
  // ============================================================

  // --- Para STANDALONE BUILDS (TaskManager) ---
  const _startTaskManager = useCallback(async () => {
      console.log('[Standalone] Attempting to start TaskManager task...');
      // Permiso background ya validado antes de llamar

      const locationOptions: Location.LocationTaskOptions = {
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_UPDATE_INTERVAL_MS,
        distanceInterval: LOCATION_UPDATE_DISTANCE_METERS,
        activityType: Location.ActivityType.Fitness,
        pausesUpdatesAutomatically: false,
        // Siempre incluir foregroundService si estamos en Android Standalone
        ...(Platform.OS === 'android' && {
            foregroundService: {
                notificationTitle: 'Pokemon Walk', // Título más simple
                notificationBody: 'Rastreando tu caminata...',
                notificationColor: '#FFCC00',
            }
        })
      };

      try {
          const isAlreadyRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          if (isAlreadyRunning) {
              console.warn("[Standalone] Task was already running. Stopping before restart.");
              await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          }
          console.log(`[Standalone] Starting task with options: ${JSON.stringify(locationOptions)}`);
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, locationOptions);
          console.log(`[Standalone] ***** TaskManager task started successfully. *****`);
      } catch (error: any) {
         console.error('[Standalone] !!!!!!! ERROR starting task:', error);
         Alert.alert('Error de Rastreo (Standalone)', `No se pudo iniciar el seguimiento.\nCode: ${error.code || 'N/A'}\nMessage: ${error.message}`);
         throw error; // Propagar para que startTracking maneje el estado
      }
  }, []); // Sin dependencias externas aquí

  const _stopTaskManager = useCallback(async () => {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isTaskRunning) {
          try {
              console.log("[Standalone] Stopping TaskManager task...");
              await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
              console.log("[Standalone] TaskManager task stopped.");
          } catch (error: any) {
              console.error("[Standalone] Error stopping task:", error.message);
          }
      } else {
           console.log("[Standalone] TaskManager task was not running.");
      }
  }, []);

  // --- Para EXPO GO (Foreground Watcher) ---
  const _startForegroundWatcher = useCallback(async () => {
    // ... (igual que antes)
     if (watchSubscription.current) { console.log("[ExpoGo] Watcher already active."); return; }
     console.log("[ExpoGo] Starting foreground location watcher..."); setRouteCoordinates([]);
     try { watchSubscription.current = await Location.watchPositionAsync( { accuracy: Location.Accuracy.High, timeInterval: LOCATION_UPDATE_INTERVAL_MS, distanceInterval: LOCATION_UPDATE_DISTANCE_METERS, }, (location) => { const newCoordinate: Coordinate = { latitude: location.coords.latitude, longitude: location.coords.longitude, }; setCurrentLocation(newCoordinate); setRouteCoordinates((prevRoute) => [...prevRoute, newCoordinate]); } ); console.log("[ExpoGo] Foreground watcher started successfully."); } catch (error: any) { console.error("[ExpoGo] Error starting foreground watcher:", error.message); Alert.alert('Error de Rastreo (Expo Go)', `No se pudo iniciar el seguimiento: ${error.message}`); throw error; }
  }, []);

  const _stopForegroundWatcher = useCallback(() => {
    // ... (igual que antes)
    if (watchSubscription.current) { console.log("[ExpoGo] Stopping foreground watcher..."); watchSubscription.current.remove(); watchSubscription.current = null; console.log("[ExpoGo] Foreground watcher stopped."); }
  }, []);


  // --- Funciones públicas ---

  const startTracking = useCallback(async () => {
    if (isTracking) { console.log("Tracking is already active."); return; }

    // 1. Permiso de Primer Plano (Siempre necesario)
    let fgStatus = permissionStatus;
    if (fgStatus !== 'granted') {
        const result = await requestPermissions();
        fgStatus = permissionStatus; // Actualiza desde el estado
        if (!result.foreground) return; // Salir si no se concedió FG
    }

    // 2. Limpiar ruta y storage (storage solo si es standalone)
    setRouteCoordinates([]);
    if (!isRunningInExpoGo) {
        await AsyncStorage.removeItem(LOCATION_ROUTE_STORAGE_KEY);
    }

    try {
        // 3. Iniciar el método apropiado
        if (isRunningInExpoGo) {
            console.log("Requesting start tracking in Expo Go mode...");
            await _startForegroundWatcher();
        } else {
            // En Standalone, verificar permiso background
            let bgStatus = backgroundPermissionStatus;
            if (Platform.OS === 'android' && bgStatus !== 'granted') {
                 const result = await requestPermissions(); // Pide/Verifica ambos
                 bgStatus = backgroundPermissionStatus; // Actualizar estado local
                 if (!result.background) {
                     Alert.alert("Permiso Requerido (Standalone)", 'Se necesita el permiso "Permitir todo el tiempo" para rastrear en segundo plano.');
                     return; // Detener
                 }
             }
             console.log("Requesting start tracking in Standalone mode...");
            await _startTaskManager(); // Inicia siempre con FS si es posible
        }
        setIsTracking(true); // Marcar como rastreando SI el inicio fue exitoso
        console.log("Tracking successfully initiated by user.");

    } catch (error: any) {
      console.error("Error caught in public startTracking:", error.message);
      setIsTracking(false); // Asegurar estado correcto si falla
    }
  }, [
      isTracking, permissionStatus, backgroundPermissionStatus, isRunningInExpoGo,
      requestPermissions, _startTaskManager, _startForegroundWatcher
  ]);

  const stopTracking = useCallback(async () => {
    if (!isTracking) { console.log("Tracking is not active."); return; }

    console.log("Stopping Tracking (User action)...");
    if (isRunningInExpoGo) {
        _stopForegroundWatcher();
    } else {
        await _stopTaskManager();
        console.log('[Standalone] Loading final route from storage after stopping...');
        await loadRouteFromStorage();
    }
    setIsTracking(false);
    console.log("Tracking stopped.");

  }, [isTracking, isRunningInExpoGo, _stopTaskManager, _stopForegroundWatcher, loadRouteFromStorage]);


  // --- Retorno del Hook ---
  return {
    permissionStatus,
    backgroundPermissionStatus: isRunningInExpoGo ? null : backgroundPermissionStatus,
    isTracking,
    currentLocation,
    routeCoordinates,
    startTracking,
    stopTracking,
    requestPermissions,
    loadRouteFromStorage: isRunningInExpoGo ? undefined : loadRouteFromStorage,
  };
};