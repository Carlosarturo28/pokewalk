// src/components/common/CustomToast.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';

// Define los colores base para cada tipo
const baseToastStyles = {
  success: {
    backgroundColor: '#E8F5E9', // Verde muy pálido
    borderColor: '#66BB6A', // Verde éxito
  },
  error: {
    backgroundColor: '#FFEBEE', // Rojo muy pálido
    borderColor: '#EF5350', // Rojo error
  },
  info: {
    backgroundColor: '#E3F2FD', // Azul muy pálido
    borderColor: '#42A5F5', // Azul info
  },
};

// Define las props que recibirá nuestro toast personalizado
interface CustomToastProps {
  text1?: string;
  text2?: string;
  type: 'success' | 'error' | 'info'; // Tipos estándar
  props: {
    // Objeto para pasar datos adicionales, como la imagen
    imageSource?: ImageSourcePropType; // Permitir pasar una imagen
    [key: string]: any; // Permitir otras props si es necesario
  };
}

export const CustomToast: React.FC<CustomToastProps> = ({
  text1,
  text2,
  type,
  props,
}) => {
  const stylesForType = baseToastStyles[type] || baseToastStyles.info; // Fallback a info si el tipo no existe

  return (
    <View style={[styles.base, stylesForType]}>
      {/* Contenedor para la Imagen (si existe) */}
      {props.imageSource && (
        <View style={styles.imageContainer}>
          <Image
            source={props.imageSource}
            style={styles.image}
            resizeMode='contain'
          />
        </View>
      )}

      {/* Contenedor para el Texto */}
      <View style={styles.textContainer}>
        {text1 && <Text style={styles.text1}>{text1}</Text>}
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    height: 65, // Altura un poco mayor para acomodar imagen
    width: '90%', // Ancho del toast
    backgroundColor: 'white',
    borderRadius: 8,
    borderLeftWidth: 7, // Borde izquierdo grueso con color distintivo
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center', // Centrar verticalmente
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10, // Espacio extra si se apilan
  },
  imageContainer: {
    width: 100, // Ancho fijo para la imagen
    height: 100, // Alto fijo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  image: {
    width: 35,
    height: 35,
  },
  textContainer: {
    flex: 1, // Ocupa el resto del espacio
    justifyContent: 'center', // Centrar texto verticalmente
  },
  text1: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333', // Color oscuro para título
  },
  text2: {
    fontSize: 13,
    color: '#555', // Color gris para subtítulo
  },
});
