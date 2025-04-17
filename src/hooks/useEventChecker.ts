import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRemoteConfig } from '../contexts/RemoteConfigContext'; // Ajusta ruta
import { EventConfig } from '../services/remoteConfigService';

const LAST_SEEN_EVENT_ID_KEY = '@PokemonWalkApp:lastSeenEventId_v1';

interface UseEventCheckerResult {
  shouldShowEventModal: boolean;
  currentEventData: EventConfig | null;
  markEventAsSeen: () => void;
  isLoadingCheck: boolean;
}

export const useEventChecker = (): UseEventCheckerResult => {
  const { activeEvent, isLoadingConfig, refreshConfig } = useRemoteConfig();
  const [lastSeenEventId, setLastSeenEventId] = useState<string | null>(null);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  // Cargar el último ID visto desde AsyncStorage
  useEffect(() => {
    const loadLastSeen = async () => {
      setIsLoadingCheck(true);
      try {
        const storedId = await AsyncStorage.getItem(LAST_SEEN_EVENT_ID_KEY);
        setLastSeenEventId(storedId);
        // console.log("[EventCheck] Last seen event ID:", storedId);
      } catch (e) {
        console.error("Failed to load last seen event ID:", e);
      } finally {
         setIsLoadingCheck(false);
      }
    };
    loadLastSeen();
  }, []);

  // Determinar si mostrar el modal cuando la config remota o el ID visto cambien
  useEffect(() => {
    // Esperar a que ambos estados de carga terminen
    if (isLoadingConfig || isLoadingCheck) {
      setShouldShowModal(false); // No mostrar mientras carga
      return;
    }

    // Si hay un evento activo Y su ID es DIFERENTE al último visto
    if (activeEvent && activeEvent.id !== lastSeenEventId) {
        console.log(`[EventCheck] New active event found (${activeEvent.id})! Should show modal.`);
        setShouldShowModal(true);
    } else {
        // Si no hay evento activo o ya se vio, no mostrar modal
        setShouldShowModal(false);
         if (activeEvent && activeEvent.id === lastSeenEventId) {
             // console.log(`[EventCheck] Active event ${activeEvent.id} already seen.`);
         } else if (!activeEvent) {
             // console.log("[EventCheck] No active event currently.");
         }
    }
  }, [activeEvent, lastSeenEventId, isLoadingConfig, isLoadingCheck]);

  // Función para marcar el evento actual como visto
  const markEventAsSeen = useCallback(() => {
    if (activeEvent) {
      const currentEventId = activeEvent.id;
      // console.log(`[EventCheck] Marking event ${currentEventId} as seen.`);
      setLastSeenEventId(currentEventId); // Actualiza estado local
      setShouldShowModal(false); // Oculta el modal si estaba visible
      AsyncStorage.setItem(LAST_SEEN_EVENT_ID_KEY, currentEventId) // Guarda en storage
        .catch(e => console.error("Failed to save last seen event ID:", e));
    }
  }, [activeEvent]); // Depende del evento activo actual

  // Opcional: Forzar refresco de configuración al inicio si ha pasado mucho tiempo
  // useEffect(() => { refreshConfig(); }, [refreshConfig]);

  return {
    shouldShowEventModal: shouldShowModal,
    currentEventData: activeEvent, // Pasa la data del evento activo
    markEventAsSeen, // Función para cerrar y marcar como visto
    isLoadingCheck: isLoadingConfig || isLoadingCheck, // Estado de carga combinado
  };
};