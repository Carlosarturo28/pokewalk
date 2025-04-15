// src/types/Notification.ts
import { ImageSourcePropType } from 'react-native';

export type NotificationType = 'success' | 'error' | 'info' | 'warning'; // Añadido warning

export interface NotificationConfig {
  id: string; // ID único para la notificación
  type: NotificationType;
  title: string;
  message?: string;
  imageSource?: ImageSourcePropType;
  duration?: number; // Duración en ms (opcional, usaremos default)
}

export interface NotificationState extends NotificationConfig {
  isVisible: boolean;
}
