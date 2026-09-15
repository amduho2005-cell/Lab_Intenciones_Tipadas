// ============================================================
// GENERADOR / RANDOMIZER DE PERSONAJES DE D&D
// Versión migrada a TYPESCRIPT
// Laboratorio de Intenciones Tipadas
// ============================================================
//
// Migración de src/index.js. La lógica es la misma; lo que cambia
// es que ahora cada dato tiene una forma declarada explícitamente
// (ver src/types.ts) y el compilador la hace cumplir. Cero uso de `any`.

import type {
  Raza,
  ClasePersonaje,
  Estadisticas,
  Personaje,
  OpcionesGeneracion,
  ResultadoGeneracion,
} from './types.js';

// -------------------- Datos de referencia --------------------

const RAZAS: readonly Raza[] = ['Humano', 'Elfo', 'Enano', 'Orco'];
const CLASES: readonly ClasePersonaje[] = ['Guerrero', 'Mago', 'Pícaro', 'Clérigo'];

const INVENTARIO_POR_CLASE: Record<ClasePersonaje, string[]> = {
  Guerrero: ['Espada larga', 'Escudo de acero', 'Armadura de placas', 'Poción de curación'],
  Mago: ['Bastón arcano', 'Libro de hechizos', 'Componentes mágicos', 'Poción de maná'],
  'Pícaro': ['Dagas gemelas', 'Ganzúas', 'Capa de sombras', 'Cuerda de seda'],
  'Clérigo': ['Maza sagrada', 'Símbolo divino', 'Escudo de fe', 'Vendas benditas'],
};

/** Nombres válidos de las claves de Estadisticas, derivados del propio tipo. */
type NombreAtributo = keyof Estadisticas;

const NOMBRES_ATRIBUTOS: readonly NombreAtributo[] = [
  'fuerza',
  'destreza',
  'constitucion',
  'inteligencia',
  'sabiduria',
  'carisma',
];

// -------------------- Utilidades de dados --------------------

/**
 * FUNCIÓN TIPADA #1
 * Tira un dado de N caras de forma síncrona.
 */
function tirarDado(caras: number): number {
  if (caras <= 0) {
    throw new Error('El dado debe tener al menos una cara.');
  }
  return Math.floor(Math.random() * caras) + 1;
}

/**
 * CONCEPTO AVANZADO: Promesas y async/await
 * Simula una tirada de dados "no bloqueante".
 */
function tirarDadosAsync(cantidadDados: number, caras: number): Promise<number[]> {
  return new Promise<number[]>((resolve, reject) => {
    if (cantidadDados <= 0) {
      reject(new Error('La cantidad de dados debe ser mayor a cero.'));
      return;
    }
    setTimeout(() => {
      const tiradas: number[] = Array.from({ length: cantidadDados }, () => tirarDado(caras));
      resolve(tiradas);
    }, 50);
  });
}

// -------------------- Generación de estadísticas --------------------

/**
 * FUNCIÓN TIPADA #2
 * CONCEPTO AVANZADO: Funciones de orden superior (map, reduce)
 * Genera las 6 estadísticas base tirando 4d6 y descartando el menor.
 */
function generarEstadisticas(): Estadisticas {
  const valores: number[] = NOMBRES_ATRIBUTOS.map(() => {
    const tiradas: number[] = Array.from({ length: 4 }, () => tirarDado(6));

    // Destructuring y Spread/Rest operator
    const ordenadas: number[] = [...tiradas].sort((a, b) => a - b); // spread
    const [, ...mejoresTres] = ordenadas; // destructuring + rest

    return mejoresTres.reduce((total, valor) => total + valor, 0);
  });

  return NOMBRES_ATRIBUTOS.reduce<Estadisticas>((estadisticas, nombre, indice) => {
    return { ...estadisticas, [nombre]: valores[indice] };
  }, {} as Estadisticas);
}

/** Calcula el modificador de D&D para un valor de estadística. */
function calcularModificador(valor: number): number {
  return Math.floor((valor - 10) / 2);
}

// -------------------- Inventario --------------------

/**
 * CONCEPTO AVANZADO: Funciones de orden superior (filter)
 */
function generarInventario(clase: ClasePersonaje): string[] {
  const items = INVENTARIO_POR_CLASE[clase] ?? [];
  return items.filter((item) => !item.startsWith('?'));
}

// -------------------- Generación de personaje --------------------

/**
 * FUNCIÓN TIPADA #3
 * Destructuring y Rest operator en parámetros + Promesas/async-await + try/catch.
 */
async function generarPersonaje(opciones: OpcionesGeneracion): Promise<ResultadoGeneracion> {
  const { nombre, raza, ...resto } = opciones; // destructuring + rest

  try {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del personaje es obligatorio.');
    }

    const clase: ClasePersonaje = resto.clase ?? CLASES[tirarDado(CLASES.length) - 1];
    const razaFinal: Raza = raza ?? RAZAS[tirarDado(RAZAS.length) - 1];

    const estadisticas: Estadisticas = generarEstadisticas();

    // await sobre una Promesa tipada Promise<number[]>
    const tiradasVida: number[] = await tirarDadosAsync(1, 10);
    const [vidaBase] = tiradasVida; // destructuring de array

    const modificadorConstitucion = calcularModificador(estadisticas.constitucion);
    const puntosDeVida = Math.max(1, vidaBase + modificadorConstitucion);
    const inventario: string[] = generarInventario(clase);

    const personaje: Personaje = {
      nombre: nombre.trim(),
      raza: razaFinal,
      clase,
      nivel: 1,
      estadisticas,
      inventario,
      puntosDeVida,
    };

    return { exito: true, personaje };
  } catch (error) {
    // Manejo de errores con try/catch. `error` es `unknown` en TS (no `any`),
    // por eso se valida el tipo antes de leer `.message`.
    return {
      exito: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// -------------------- Presentación --------------------

function resumenPersonaje(personaje: Personaje): string {
  const { nombre, raza, clase, nivel, estadisticas, inventario, puntosDeVida } = personaje;

  // map: recorremos los nombres de atributos (no Object.entries) para
  // mantener el tipado exacto de cada clave, sin recurrir a `any`.
  const lineasEstadisticas = NOMBRES_ATRIBUTOS.map((atributo) => {
    const valor = estadisticas[atributo];
    return `  - ${atributo}: ${valor} (mod ${calcularModificador(valor)})`;
  }).join('\n');

  return [
    `Nombre: ${nombre}`,
    `Raza: ${raza}`,
    `Clase: ${clase}`,
    `Nivel: ${nivel}`,
    `Puntos de vida: ${puntosDeVida}`,
    'Estadísticas:',
    lineasEstadisticas,
    `Inventario: ${inventario.join(', ')}`,
  ].join('\n');
}

// -------------------- Punto de entrada --------------------

async function main(): Promise<void> {
  const argumentos: string[] = process.argv.slice(2);
  const nombre: string = argumentos[0] ?? 'Aventurero Sin Nombre';

  console.log('=== Generador de Personajes de D&D (TypeScript) ===\n');

  const resultado: ResultadoGeneracion = await generarPersonaje({ nombre });

  if (resultado.exito) {
    // Gracias a la unión discriminada, TS sabe que aquí `resultado.personaje` existe.
    console.log(resumenPersonaje(resultado.personaje));
  } else {
    console.error(`No se pudo generar el personaje: ${resultado.error}`);
  }
}

main();

export {
  tirarDado,
  tirarDadosAsync,
  generarEstadisticas,
  calcularModificador,
  generarInventario,
  generarPersonaje,
  resumenPersonaje,
};
