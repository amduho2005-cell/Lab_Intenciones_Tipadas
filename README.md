# Laboratorio de Intenciones Tipadas
## Generador / Randomizer de Personajes de D&D

Proyecto de consola en Node.js que genera personajes aleatorios de
Dungeons & Dragons (raza, clase, estadísticas, puntos de vida e
inventario inicial). Se entrega en dos versiones: una original en
JavaScript y su migración completa a TypeScript, con el objetivo de
comparar y documentar cómo el sistema de tipos hace explícita (y
verificable) la intención original del programa.

---

## 1. Intención Inicial

**Propósito auditable:** dado un nombre de personaje (y opcionalmente
una raza y una clase), el programa debe producir de forma
determinísticamente *aleatoria* —pero siempre **válida**— un personaje
jugable de D&D con:

- Una raza perteneciente al conjunto `Humano | Elfo | Enano | Orco`.
- Una clase perteneciente al conjunto `Guerrero | Mago | Pícaro | Clérigo`.
- Seis estadísticas (`fuerza`, `destreza`, `constitucion`,
  `inteligencia`, `sabiduria`, `carisma`) calculadas con la regla
  "4d6, se descarta el menor".
- Puntos de vida calculados a partir de una tirada de dado de 10 caras
  más el modificador de constitución, con un piso de 1.
- Un inventario inicial coherente con la clase asignada.

**Restricciones:**

- El nombre del personaje es obligatorio; no se genera nada sin él.
- La raza y la clase, si se proveen manualmente, deben pertenecer al
  conjunto cerrado de valores permitidos; de lo contrario el programa
  debe fallar de forma controlada (no silenciosa).
- Ninguna operación de generación debe bloquear el hilo principal de
  forma indefinida: la tirada de puntos de vida se modela como una
  operación asíncrona (simulando una consulta a un servicio externo
  de validación de reglas).
- El programa debe poder ejecutarse tanto desde su versión JavaScript
  original como desde su versión TypeScript migrada, produciendo
  resultados con la misma forma de datos.

---

## 2. Criterios de Aceptación

1. **Generación válida por defecto:** al ejecutar el programa sin
   argumentos, se debe imprimir en consola un personaje completo
   (nombre por defecto, raza, clase, seis estadísticas con su
   modificador, puntos de vida ≥ 1 e inventario no vacío) sin lanzar
   excepciones no controladas.
2. **Validación de entradas inválidas:** si se invoca
   `generarPersonaje` con un nombre vacío o compuesto solo de
   espacios, el resultado debe ser `{ exito: false, error: string }`
   y **no** debe interrumpir el proceso (el error se captura con
   `try/catch` y se retorna, no se deja propagar).
3. **Paridad JS/TS:** el archivo `src/index.ts`, una vez compilado
   con `npm run build` y ejecutado con `npm start`, debe producir una
   salida con exactamente la misma estructura (mismas claves, mismos
   rangos de valores) que `src/index.js` ejecutado con
   `npm run start:js`.

---

## 3. Tipos, interfaces y uniones usados en TypeScript

Todo el modelo de datos vive en `src/types.ts`, separado de la lógica
en `src/index.ts`, para que el "contrato" del dominio sea auditable
de un vistazo.

| Nombre | Categoría | Propósito |
|---|---|---|
| `Raza` | Unión literal | Restringe la raza a exactamente `'Humano' \| 'Elfo' \| 'Enano' \| 'Orco'`. Cualquier otro string produce un error de compilación. |
| `ClasePersonaje` | Unión literal | Restringe la clase a `'Guerrero' \| 'Mago' \| 'Pícaro' \| 'Clérigo'`. |
| `Estadisticas` | Interface | Obliga a que un objeto de estadísticas tenga las seis claves numéricas exactas, ni más ni menos. |
| `Personaje` | Interface | Forma completa de un personaje generado; compone `Raza`, `ClasePersonaje` y `Estadisticas`. |
| `OpcionesGeneracion` | Interface | Entrada de `generarPersonaje`: `nombre` obligatorio, `raza` y `clase` opcionales (`?`). |
| `ResultadoGeneracion` | Type (unión discriminada) | `{ exito: true; personaje: Personaje } \| { exito: false; error: string }`. El campo `exito` permite que TypeScript "estreche" (*narrow*) el tipo automáticamente: dentro de un `if (resultado.exito)`, TS sabe que `resultado.personaje` existe sin necesidad de comprobaciones manuales de `undefined`. |

Además, se usa `keyof Estadisticas` para derivar el tipo
`NombreAtributo` directamente de la interfaz, evitando que la lista de
nombres de atributos y la interfaz se desincronicen con el tiempo.

No se utiliza `any` en ningún punto del código: los `catch` tipan el
error como `unknown` (el tipo por defecto de TypeScript moderno) y se
valida con `error instanceof Error` antes de leer `.message`.

---

## 4. Comandos de instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar la versión JavaScript original directamente
npm run start:js
# equivalente a: node src/index.js

# 3. Ejecutar la versión TypeScript en modo desarrollo (sin compilar a disco)
npm run dev
# equivalente a: tsx src/index.ts

# 4. Compilar TypeScript -> JavaScript (carpeta dist/)
npm run build
# equivalente a: tsc

# 5. Compilar y ejecutar la versión TypeScript ya compilada
npm start
# equivalente a: npm run build && node dist/index.js

# También se puede pasar un nombre de personaje como argumento:
node src/index.js "Thalindra"
node dist/index.js "Grommash"
```

---

## 5. Errores detectados por TypeScript

Durante la migración de `src/index.js` a `src/index.ts` (con
`strict: true`), el compilador obligó a resolver los siguientes
problemas que en la versión JavaScript original eran válidos en
tiempo de escritura pero riesgosos en tiempo de ejecución:

- **Claves de objeto no verificadas:** en JS, `INVENTARIO_POR_CLASE[clase]`
  acepta cualquier string como `clase`, incluso uno mal escrito, y
  simplemente devuelve `undefined` sin avisar. Al tipar
  `INVENTARIO_POR_CLASE` como `Record<ClasePersonaje, string[]>` y
  `clase` como `ClasePersonaje`, TypeScript garantiza en tiempo de
  compilación que solo se puede indexar con uno de los cuatro valores
  válidos: un typo como `'Guerero'` ya no compila.
- **Forma del resultado de generación:** en JS, el objeto de retorno
  de `generarPersonaje` (`{ exito, personaje, error }`) podía usarse
  sin comprobar si `personaje` existía, provocando un error en
  tiempo de ejecución del tipo *"Cannot read properties of undefined"*
  si se accedía a `resultado.personaje` en la rama de fallo. La
  unión discriminada `ResultadoGeneracion` hace que ese acceso
  incorrecto sea un **error de compilación**, no un error en
  producción.
- **Tipo del error capturado:** en JS, `catch (error)` no dice nada
  sobre la forma de `error`, por lo que `error.message` puede fallar
  silenciosamente si se lanza algo que no es una instancia de `Error`
  (por ejemplo, un string). TypeScript tipa `error` como `unknown` en
  el `catch`, forzando la comprobación `error instanceof Error` antes
  de leer `.message`, tal como ya se hacía por buena práctica en la
  versión JS, pero ahora es **obligatorio**, no opcional.
- **Consistencia de las estadísticas:** en JS, nada impide construir
  un objeto de estadísticas al que le falte un atributo (por ejemplo,
  olvidar `carisma`) o que tenga uno de más. La interfaz
  `Estadisticas` hace que cualquier función que construya o reciba
  este objeto sea verificada estructuralmente por el compilador.
- **Import de tipos separado del import de valores:** al usar
  `import type { ... } from './types.js'`, TypeScript verifica en
  compilación que esos nombres son *solo* tipos (se eliminan del
  JavaScript emitido), evitando dependencias circulares o código
  muerto que en JS pasarían desapercibidos hasta la ejecución.

En resumen: ningún error de lógica de negocio nuevo fue introducido
por TypeScript, pero varias suposiciones implícitas de la versión
JavaScript (formas de objetos, claves válidas, tipo del error
capturado) pasaron de ser *convenciones que un desarrollador debía
recordar* a ser *invariantes que el compilador hace cumplir*.

---

## 6. Guía de pasos para Git/GitHub Flow

Flujo sugerido para entregar este laboratorio como una rama de
funcionalidad (`feature/proyecto-1`) mediante un Pull Request.

```bash
# 1. Actualizar la rama principal local
git checkout main
git pull origin main

# 2. Crear y cambiar a la rama de la funcionalidad
git checkout -b feature/proyecto-1

# 3. Copiar/crear los archivos del proyecto dentro del repositorio
#    (package.json, tsconfig.json, src/index.js, src/types.ts,
#     src/index.ts, README.md)

# 4. Revisar el estado y agregar los archivos al área de stage
git status
git add .

# 5. Confirmar los cambios con un mensaje descriptivo
git commit -m "feat: generador de personajes de D&D (JS + migración a TS)"

# 6. Subir la rama al repositorio remoto
git push origin feature/proyecto-1

# 7. Abrir el Pull Request desde la línea de comandos (requiere GitHub CLI)
gh pr create \
  --base main \
  --head feature/proyecto-1 \
  --title "Laboratorio de Intenciones Tipadas: Generador de Personajes de D&D" \
  --body "Migración de JavaScript a TypeScript del generador de personajes. Incluye tipos, interfaces, unión literal, promesas/async-await, destructuring/spread/rest, funciones de orden superior y manejo de errores con try/catch."

# 8. (Alternativa sin GitHub CLI) Abrir el Pull Request manualmente
#    desde la interfaz web de GitHub, seleccionando:
#    base: main  <-  compare: feature/proyecto-1

# 9. Tras la revisión y aprobación, fusionar el Pull Request
#    (desde la web de GitHub, o por línea de comandos:)
git checkout main
git pull origin main
git merge feature/proyecto-1
git push origin main

# 10. (Opcional) Eliminar la rama de funcionalidad ya fusionada
git branch -d feature/proyecto-1
git push origin --delete feature/proyecto-1
```

---

## 7. Estructura del proyecto

```
laboratorio-intenciones-tipadas/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.js     # Versión original en JavaScript (ES Modules)
    ├── types.ts     # Interfaces, types y uniones literales
    └── index.ts     # Versión migrada a TypeScript
```
