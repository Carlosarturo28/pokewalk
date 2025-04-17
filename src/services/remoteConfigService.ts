import { Platform } from 'react-native';

// --- TIPOS (Podrían ir en src/types/RemoteConfig.ts) ---
export interface EventBoosts {
    pokemonTypeRates?: { [key: string]: number }; // key: tipo, value: multiplicador
    itemFindDifficulties?: { [key: string]: number }; // key: itemId, value: nueva dificultad (0-1)
    shinyRateMultiplier?: number;
    // ... otros posibles boosts (XP, monedas, etc.)
}

export interface EventConfig {
    id: string;
    isEventRunning: boolean;
    title: string;
    description: string;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
    boosts?: EventBoosts;
    badgeUrl?: string;
}

export interface DefaultProbabilities {
    pokemonEncounterProbability?: number;
    itemFindProbability?: number;
    shinyProbability?: number;
    // ...
}

export interface RemoteConfig {
    currentEvent: EventConfig | null; // Puede no haber evento activo
    defaultProbabilities?: DefaultProbabilities;
    shopListingIds?: string[];
    // ... otras configuraciones globales
}

// --- URL del archivo Raw en GitHub ---
// ¡¡¡ REEMPLAZA ESTA URL CON LA TUYA !!!
const REMOTE_CONFIG_URL = 'https://raw.githubusercontent.com/Carlosarturo28/pokewalk/refs/heads/main/src/utils/remoteConfig.json';

// Caché simple para no descargar en cada carga de pantalla
let cachedConfig: RemoteConfig | null = null;
let lastFetchTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos de caché

export const fetchRemoteConfig = async (forceRefresh: boolean = false): Promise<RemoteConfig | null> => {
    const now = Date.now();

    // Usar caché si no ha expirado y no se fuerza refresco
    if (!forceRefresh && cachedConfig && (now - lastFetchTimestamp < CACHE_DURATION_MS)) {
        console.log('[RemoteConfig] Using cached config.');
        return validateEventDates(cachedConfig); // Validar fechas del evento cacheado
    }

    console.log('[RemoteConfig] Fetching remote config from:', REMOTE_CONFIG_URL);
    try {
        // Añadir timestamp para evitar caché agresiva de CDN/navegador (opcional)
        const url = `${REMOTE_CONFIG_URL}?t=${Date.now()}`;
        const response = await fetch(url, {
            cache: 'no-store' // Intenta evitar caché HTTP
        });

        if (!response.ok) {
            console.error(`[RemoteConfig] Failed to fetch config: ${response.status} ${response.statusText}`);
             // Si falla, devuelve la caché anterior si existe, si no null
            return cachedConfig ? validateEventDates(cachedConfig) : null;
        }

        const data: RemoteConfig = await response.json();
        console.log('[RemoteConfig] Fetched config successfully:', data.currentEvent?.id ?? 'No Event');

        // Validar y actualizar caché
        const validatedData = validateEventDates(data);
        cachedConfig = validatedData;
        lastFetchTimestamp = now;
        return validatedData;

    } catch (error) {
        console.error('[RemoteConfig] Error fetching or parsing config:', error);
         // Si falla, devuelve la caché anterior si existe, si no null
         return cachedConfig ? validateEventDates(cachedConfig) : null;
    }
};

// Función para validar si el evento actual está dentro de sus fechas (si las tiene)
const validateEventDates = (config: RemoteConfig | null): RemoteConfig | null => {
    if (!config || !config.currentEvent || !config.currentEvent.isEventRunning) {
        // Si no hay config, no hay evento, o isEventRunning es false, devolver como está
        // (o podríamos setear isEventRunning a false si estaba en true pero fuera de fecha)
        if (config?.currentEvent) config.currentEvent.isEventRunning = false;
        return config;
    }

    const event = config.currentEvent;
    const now = new Date();
    const startDate = event.startDate ? new Date(event.startDate) : null;
    const endDate = event.endDate ? new Date(event.endDate) : null;

    // Comprobar si la fecha actual está fuera del rango definido
    if (startDate && now < startDate) {
        console.log(`[RemoteConfig] Event ${event.id} has not started yet.`);
        event.isEventRunning = false; // Marcar como no activo aún
    } else if (endDate && now >= endDate) {
        console.log(`[RemoteConfig] Event ${event.id} has ended.`);
        event.isEventRunning = false; // Marcar como no activo (terminado)
    } else {
        // Está dentro del rango o no hay fechas definidas, se mantiene isEventRunning
        console.log(`[RemoteConfig] Event ${event.id} is currently active.`);
    }

    return config;
};