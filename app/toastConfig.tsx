// src/config/toastConfig.ts
import React from 'react';
import { BaseToastProps } from 'react-native-toast-message'; // Importar tipos base si es necesario
import { CustomToast } from '../components/common/CustomToast'; // Importa tu componente personalizado

/*
  Define la configuración del Toast.
  Mapea los tipos ('success', 'error', 'info') a tu componente personalizado.
*/
export const toastConfig = {
  /*
    Sobrescribe los tipos base 'success', 'error', 'info'
    para usar nuestro componente `CustomToast`.
    Les pasamos todas las props recibidas (`props`) para que `CustomToast`
    pueda acceder a `text1`, `text2`, `type` y a nuestro `props.imageSource` personalizado.
  */
  success: (props: BaseToastProps & { props: any }) => (
    <CustomToast
      {...props} // Pasa text1, text2
      type='success'
      props={props.props} // Pasa el objeto props personalizado
    />
  ),
  error: (props: BaseToastProps & { props: any }) => (
    <CustomToast {...props} type='error' props={props.props} />
  ),
  info: (props: BaseToastProps & { props: any }) => (
    <CustomToast {...props} type='info' props={props.props} />
  ),
  default: (props: BaseToastProps & { props: any }) => (
    <CustomToast {...props} type='info' props={props.props} />
  ),

  /*
    Opcional: Podrías definir tipos completamente nuevos aquí si quisieras,
    por ejemplo:
    pokeGotcha: (props) => <SpecialGotchaToast {...props} />
  */
};

// Tipo para la configuración (opcional pero bueno para TypeScript)
export type ToastConfigType = typeof toastConfig;
