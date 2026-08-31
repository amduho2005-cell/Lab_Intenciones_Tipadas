// ============================================================
// GENERADOR / RANDOMIZER DE PERSONAJES DE D&D
// Versión original en JAVASCRIPT (módulos ES: import/export)
// Laboratorio de Intenciones Tipadas
// ============================================================
//
// Este archivo es la "intención inicial" del programa: funciona,
// pero no tiene ningún tipo de garantía formal sobre las formas
// de sus datos. Sirve como punto de partida para la migración a
// TypeScript que se encuentra en src/index.ts.

// -------------------- Datos de referencia --------------------

const RAZAS = ['Humano', 'Elfo', 'Enano', 'Orco'];
const CLASES = ['Guerrero', 'Mago', 'Pícaro', 'Clérigo'];

const INVENTARIO_POR_CLASE = {
  Guerrero: ['Espada larga', 'Escudo de acero', 'Armadura de placas', 'Poción de curación'],
  Mago: ['Bastón arcano', 'Libro de hechizos', 'Componentes mágicos', 'Poción de maná'],
  'Pícaro': ['Dagas gemelas', 'Ganzúas', 'Capa de sombras', 'Cuerda de seda'],
  'Clérigo': ['Maza sagrada', 'Símbolo divino', 'Escudo de fe', 'Vendas benditas'],
};

// -------------------- Utilidades de dados --------------------

/**
 * Tira un dado de N caras de forma síncrona.
 * @param {number} caras - Cantidad de caras del dado (ej. 6, 10, 20).
 * @returns {number} Resultado de la tirada (entre 1 y `caras`).
 */
function tirarDado(caras) {
  if (caras <= 0) {
    // CONCEPTO AVANZADO: Manejo de errores con try/catch (se captura en el llamador)
    throw new Error('El dado debe tener al menos una cara.');
  }
  return Math.floor(Math.random() * caras) + 1;
}

/**
 * CONCEPTO AVANZADO #1: Promesas y async/await
 * Simula una tirada de dados "no bloqueante", como si se consultara
 * un servicio remoto de validación de reglas antes de resolver la tirada.
 * @param {number} cantidadDados - Cuántos dados tirar.
 * @param {number} caras - Caras de cada dado.
 * @returns {Promise<number[]>} Promesa que resuelve con el arreglo de resultados.
 */
function tirarDadosAsync(cantidadDados, caras) {
  return new Promise((resolve, reject) => {
    if (cantidadDados <= 0) {
      reject(new Error('La cantidad de dados debe ser mayor a cero.'));
      return;
    }
    // setTimeout simula la latencia de una operación asíncrona real (I/O, red, etc.)
    setTimeout(() => {
      const tiradas = Array.from({ length: cantidadDados }, () => tirarDado(caras));
      resolve(tiradas);
    }, 50);
  });
}

// -------------------- Generación de estadísticas --------------------

/**
 * CONCEPTO AVANZADO #2: Funciones de orden superior (map, reduce)
 * Genera las 6 estadísticas base de un personaje tirando 4d6 y
 * descartando el dado de menor valor en cada atributo (regla clásica de D&D).
 * @returns {{fuerza:number, destreza:number, constitucion:number, inteligencia:number, sabiduria:number, carisma:number}}
 */
function generarEstadisticas() {
  const atributos = ['fuerza', 'destreza', 'constitucion', 'inteligencia', 'sabiduria', 'carisma'];

  // map: por cada atributo, calculamos su valor final
  const valores = atributos.map(() => {
    const tiradas = Array.from({ length: 4 }, () => tirarDado(6));

    // CONCEPTO AVANZADO #3: Destructuring y Spread/Rest operator
    const ordenadas = [...tiradas].sort((a, b) => a - b); // spread: clonamos antes de ordenar
    const [, ...mejoresTres] = ordenadas; // destructuring + rest: descartamos el menor

    // reduce: sumamos los 3 mejores dados
    return mejoresTres.reduce((total, valor) => total + valor, 0);
  });

  // reduce: combinamos nombres de atributos + valores en un solo objeto
  return atributos.reduce((estadisticas, nombre, indice) => {
    return { ...estadisticas, [nombre]: valores[indice] }; // spread para no mutar el acumulador
  }, {});
}

/**
 * Calcula el modificador de D&D asociado a un valor de estadística.
 * @param {number} valor
 * @returns {number}
 */
function calcularModificador(valor) {
  return Math.floor((valor - 10) / 2);
}

// -------------------- Inventario --------------------

/**
 * Funciones de orden superior (filter): genera el inventario inicial
 * de un personaje según su clase.
 * @param {string} clase
 * @returns {string[]}
 */
function generarInventario(clase) {
  const items = INVENTARIO_POR_CLASE[clase] ?? [];
  // filter: descarta ítems marcados como "opcionales futuros" (prefijo '?')
  return items.filter((item) => !item.startsWith('?'));
}

// -------------------- Generación de personaje --------------------

/**
 * Destructuring y Rest operator en los parámetros de la función.
 * @param {{nombre:string, raza?:string, clase?:string}} opciones
 * @returns {Promise<{exito:boolean, personaje?:object, error?:string}>}
 */
async function generarPersonaje({ nombre, raza, ...resto }) {
  try {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre del personaje es obligatorio.');
    }

    const clase = resto.clase ?? CLASES[tirarDado(CLASES.length) - 1];
    const razaFinal = raza ?? RAZAS[tirarDado(RAZAS.length) - 1];

    if (!CLASES.includes(clase)) {
      throw new Error(`Clase inválida: ${clase}`);
    }
    if (!RAZAS.includes(razaFinal)) {
      throw new Error(`Raza inválida: ${razaFinal}`);
    }

    const estadisticas = generarEstadisticas();

    // await sobre una Promesa: espera la tirada asíncrona de puntos de vida
    const tiradasVida = await tirarDadosAsync(1, 10);
    const [vidaBase] = tiradasVida; // destructuring de array

    const modificadorConstitucion = calcularModificador(estadisticas.constitucion);
    const puntosDeVida = Math.max(1, vidaBase + modificadorConstitucion);
    const inventario = generarInventario(clase);

    const personaje = {
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
    // CONCEPTO AVANZADO: Manejo de errores con try/catch
    return { exito: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// -------------------- Presentación --------------------

/**
 * @param {object} personaje
 * @returns {string}
 */
function resumenPersonaje(personaje) {
  const { nombre, raza, clase, nivel, estadisticas, inventario, puntosDeVida } = personaje;

  const lineasEstadisticas = Object.entries(estadisticas)
    .map(([clave, valor]) => `  - ${clave}: ${valor} (mod ${calcularModificador(valor)})`)
    .join('\n');

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

async function main() {
  const argumentos = process.argv.slice(2);
  const nombre = argumentos[0] ?? 'Aventurero Sin Nombre';

  console.log('=== Generador de Personajes de D&D (JavaScript) ===\n');

  const resultado = await generarPersonaje({ nombre });

  if (resultado.exito) {
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
