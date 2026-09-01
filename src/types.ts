// ============================================================
// TIPOS E INTERFACES
// Laboratorio de Intenciones Tipadas
// ============================================================
//
// Este archivo declara el "contrato" formal del dominio del programa:
// qué forma tienen los datos de un personaje de D&D y qué valores
// están permitidos. Al centralizar los tipos aquí, cualquier función
// que los use queda obligada a respetar esta intención.

/**
 * UNIÓN LITERAL #1
 * Razas jugables permitidas. Cualquier otro string es rechazado
 * en tiempo de compilación (no solo en tiempo de ejecución).
 */
export type Raza = 'Humano' | 'Elfo' | 'Enano' | 'Orco';

/**
 * UNIÓN LITERAL #2
 * Clases jugables permitidas.
 */
export type ClasePersonaje = 'Guerrero' | 'Mago' | 'Pícaro' | 'Clérigo';

/**
 * INTERFAZ #1
 * Describe las seis estadísticas base de un personaje de D&D.
 */
export interface Estadisticas {
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
}

/**
 * INTERFAZ #2
 * Describe un personaje completo y generado.
 */
export interface Personaje {
  nombre: string;
  raza: Raza;
  clase: ClasePersonaje;
  nivel: number;
  estadisticas: Estadisticas;
  inventario: string[];
  puntosDeVida: number;
}

/**
 * INTERFAZ #3
 * Opciones de entrada para generar un personaje. `raza` y `clase`
 * son opcionales: si no se indican, se sortean aleatoriamente.
 */
export interface OpcionesGeneracion {
  nombre: string;
  raza?: Raza;
  clase?: ClasePersonaje;
}

/**
 * TYPE (unión discriminada) #3
 * Resultado de una operación de generación: o hubo éxito (con
 * `personaje` garantizado) o hubo un fallo (con `error` garantizado).
 * Modelar el resultado así elimina la necesidad de comprobar
 * manualmente si `personaje` es `undefined`.
 */
export type ResultadoGeneracion =
  | { exito: true; personaje: Personaje }
  | { exito: false; error: string };
