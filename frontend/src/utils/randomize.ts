/**
 * Utilidades para aleatorización determinística
 */

/**
 * Generador de números pseudoaleatorios con semilla (Simple Linear Congruential Generator)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

/**
 * Función shuffle determinística usando semilla
 */
function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const rng = new SeededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Aleatorizar opciones de una pregunta de forma determinística
 */
export function randomizeQuestionOptions(
  opciones: Record<string, string>, 
  respuestaCorrecta: string,
  preguntaId: number,
  sesionId: number
) {
  // Crear semilla única basada en pregunta y sesión
  const seed = (preguntaId * 1000) + (sesionId % 1000);
  
  // Obtener las letras originales y sus textos
  const letrasOriginales = Object.keys(opciones);
  const textosOriginales = Object.values(opciones);
  
  // Aleatorizar las letras destino
  const letrasDestino = ['A', 'B', 'C', 'D'].slice(0, letrasOriginales.length);
  const letrasAleatorias = shuffleWithSeed(letrasDestino, seed);
  
  // Crear nuevas opciones aleatorizadas
  const opcionesAleatorizadas: Record<string, string> = {};
  const mapeo: Record<string, string> = {};
  
  letrasOriginales.forEach((letraOriginal, index) => {
    const letraDestino = letrasAleatorias[index];
    opcionesAleatorizadas[letraDestino] = textosOriginales[index];
    mapeo[letraOriginal] = letraDestino;
  });
  
  // Calcular nueva respuesta correcta
  const nuevaRespuestaCorrecta = mapeo[respuestaCorrecta] || respuestaCorrecta;
  
  return {
    opciones: opcionesAleatorizadas,
    respuestaCorrecta: nuevaRespuestaCorrecta,
    mapeo
  };
}

/**
 * Aleatorizar orden de preguntas de forma determinística
 */
export function randomizeQuestions<T extends { id: number }>(
  preguntas: T[],
  sesionId: number
): T[] {
  // Usar solo el ID de sesión como semilla para el orden de preguntas
  return shuffleWithSeed(preguntas, sesionId);
}