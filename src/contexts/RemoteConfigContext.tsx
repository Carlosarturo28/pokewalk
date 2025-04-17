import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    ReactNode,
    useCallback,
  } from 'react';
  import { AppState, AppStateStatus } from 'react-native';
  import { EventConfig, fetchRemoteConfig, RemoteConfig } from '../services/remoteConfigService'; // Ajusta ruta
  
  interface RemoteConfigContextProps {
    remoteConfig: RemoteConfig | null;
    isLoadingConfig: boolean;
    activeEvent: EventConfig | null; // Acceso rápido al evento activo
    refreshConfig: () => Promise<void>; // Función para forzar refresco
  }
  
  const RemoteConfigContext = createContext<RemoteConfigContextProps | undefined>(
    undefined
  );
  
  export const RemoteConfigProvider: React.FC<{ children: ReactNode }> = ({
    children,
  }) => {
    const [remoteConfig, setRemoteConfig] = useState<RemoteConfig | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
    const loadConfig = useCallback(async (forceRefresh: boolean = false) => {
      // console.log("RemoteConfigProvider: Loading config...", {forceRefresh});
      setIsLoadingConfig(true);
      const config = await fetchRemoteConfig(forceRefresh);
      setRemoteConfig(config);
      setIsLoadingConfig(false);
      // console.log("RemoteConfigProvider: Config loaded.", config?.currentEvent?.id);
    }, []);
  
    // Carga inicial al montar
    useEffect(() => {
      loadConfig();
    }, [loadConfig]);
  
    // Recarga al volver a primer plano (opcional, pero bueno para eventos)
    useEffect(() => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          // console.log("App came to foreground, checking for config updates...");
          loadConfig(); // Carga usando caché si no ha expirado
        }
      };
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => { subscription.remove(); };
    }, [loadConfig]);
  
    // Deriva el evento activo para fácil acceso
    const activeEvent = remoteConfig?.currentEvent?.isEventRunning ? remoteConfig.currentEvent : null;
  
    const value = {
      remoteConfig,
      isLoadingConfig,
      activeEvent,
      refreshConfig: () => loadConfig(true), // La función de refresco fuerza la carga
    };
  
    return (
      <RemoteConfigContext.Provider value={value}>
        {children}
      </RemoteConfigContext.Provider>
    );
  };
  
  export const useRemoteConfig = (): RemoteConfigContextProps => {
    const context = useContext(RemoteConfigContext);
    if (!context) {
      throw new Error('useRemoteConfig must be used within a RemoteConfigProvider');
    }
    return context;
  };