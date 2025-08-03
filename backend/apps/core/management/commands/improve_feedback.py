from django.core.management.base import BaseCommand
from apps.core.models import Pregunta

class Command(BaseCommand):
    help = 'Mejorar la retroalimentación de preguntas existentes con enfoque didáctico exhaustivo'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🎯 Mejorando retroalimentación didáctica de preguntas...')
        )

        # Datos de retroalimentación mejorada por pregunta
        preguntas_mejoradas = {
            # MATEMÁTICAS
            'Si 2x + 3y = 12 y x - y = 1, ¿cuál es el valor de y?': {
                'habilidad_evaluada': 'Habilidad para plantear e implementar estrategias de resolución de sistemas de ecuaciones lineales, aplicando métodos algebraicos como sustitución o eliminación.',
                'estrategias_resolucion': '1. Identificar que se trata de un sistema de dos ecuaciones con dos incógnitas. 2. Aplicar método de sustitución: despejar x de la segunda ecuación (x = y + 1). 3. Sustituir en la primera ecuación: 2(y + 1) + 3y = 12. 4. Resolver: 2y + 2 + 3y = 12 → 5y = 10 → y = 2. 5. Verificar substituyendo en ambas ecuaciones originales.',
                'errores_comunes': 'Confundir los signos al despejar variables, no verificar la solución en ambas ecuaciones, intentar resolver sin método sistemático.',
                'explicacion_opciones_incorrectas': {
                    'B': 'y = 3 es incorrecto porque al sustituir y = 3 en x - y = 1, obtenemos x = 4, y al verificar en la primera ecuación: 2(4) + 3(3) = 8 + 9 = 17 ≠ 12',
                    'C': 'y = 1 es incorrecto porque al sustituir y = 1 en x - y = 1, obtenemos x = 2, y al verificar en la primera ecuación: 2(2) + 3(1) = 4 + 3 = 7 ≠ 12',
                    'D': 'y = 4 es incorrecto porque al sustituir y = 4 en x - y = 1, obtenemos x = 5, y al verificar en la primera ecuación: 2(5) + 3(4) = 10 + 12 = 22 ≠ 12'
                }
            },
            'Factoriza: x² - 9': {
                'habilidad_evaluada': 'Capacidad para reconocer y aplicar productos notables, específicamente la diferencia de cuadrados, transformando expresiones algebraicas a su forma factorizada.',
                'estrategias_resolucion': '1. Reconocer el patrón a² - b² (diferencia de cuadrados). 2. Identificar que x² = (x)² y 9 = (3)². 3. Aplicar la fórmula: a² - b² = (a - b)(a + b). 4. Sustituir: x² - 9 = (x - 3)(x + 3). 5. Verificar multiplicando: (x - 3)(x + 3) = x² + 3x - 3x - 9 = x² - 9 ✓',
                'errores_comunes': 'No reconocer el patrón de diferencia de cuadrados, intentar factorizar como trinomio, confundir los signos en los factores.',
                'explicacion_opciones_incorrectas': {
                    'B': '(x-9)(x+1) es incorrecto porque al expandir obtenemos x² + x - 9x - 9 = x² - 8x - 9, que no es igual a x² - 9',
                    'C': 'x(x-9) es incorrecto porque al expandir obtenemos x² - 9x, que no es igual a x² - 9',
                    'D': '"No se puede factorizar" es incorrecto porque x² - 9 sí es factorizable usando la fórmula de diferencia de cuadrados'
                }
            },

            # LENGUAJE
            '¿Cuál de las siguientes palabras es un adverbio?': {
                'habilidad_evaluada': 'Capacidad para identificar y clasificar categorías gramaticales, específicamente los adverbios y su función modificadora en la oración.',
                'estrategias_resolucion': '1. Recordar que los adverbios modifican verbos, adjetivos u otros adverbios. 2. Identificar terminaciones características como -mente. 3. Analizar cada opción: "Casa" (sustantivo), "Bonito" (adjetivo), "Correr" (verbo), "Rápidamente" (adverbio). 4. Confirmar que "rápidamente" modifica la manera de realizar una acción.',
                'errores_comunes': 'Confundir adverbios con adjetivos, no reconocer la terminación -mente como indicadora de adverbio, no entender la función modificadora del adverbio.',
                'explicacion_opciones_incorrectas': {
                    'B': '"Casa" es un sustantivo que designa un lugar de vivienda, no modifica verbos, adjetivos ni otros adverbios',
                    'C': '"Bonito" es un adjetivo calificativo que modifica sustantivos para expresar una cualidad estética, no es un adverbio',
                    'D': '"Correr" es un verbo que expresa una acción de movimiento, no cumple la función modificadora característica de los adverbios'
                }
            },
            'Identifica la figura literaria en: "Sus ojos eran dos luceros"': {
                'habilidad_evaluada': 'Competencia para reconocer e interpretar figuras retóricas, específicamente la metáfora, y comprender su función expresiva en el lenguaje literario.',
                'estrategias_resolucion': '1. Analizar la estructura de la expresión: "A eran B" (identificación directa). 2. Reconocer que no se usa "como" (lo que descarta símil). 3. Identificar que se establece una equivalencia poética entre "ojos" y "luceros". 4. Confirmar que es metáfora por la transferencia de cualidades luminosas y bellas de los luceros a los ojos.',
                'errores_comunes': 'Confundir metáfora con símil, no reconocer la identificación directa sin nexos comparativos, no comprender la transferencia de significado.',
                'explicacion_opciones_incorrectas': {
                    'B': 'No es símil porque no utiliza nexos comparativos como "como", "cual", "parecido a". El símil sería: "Sus ojos eran como dos luceros"',
                    'C': 'No es hipérbole porque no hay exageración desmesurada o desproporcionada de las características de los ojos',
                    'D': 'No es personificación porque no se atribuyen cualidades humanas a elementos inanimados; se comparan elementos reales (ojos) con elementos del cosmos (luceros)'
                }
            },

            # CIENCIAS NATURALES
            '¿Cuál es la unidad básica de la vida?': {
                'habilidad_evaluada': 'Conocimiento de los principios fundamentales de la biología celular y comprensión de la organización jerárquica de los seres vivos.',
                'estrategias_resolucion': '1. Recordar la teoría celular: todos los seres vivos están formados por células. 2. Identificar los niveles de organización biológica: célula → tejido → órgano → sistema → organismo. 3. Reconocer que la célula es la unidad más pequeña que puede realizar todas las funciones vitales. 4. Descartar opciones que representan niveles superiores de organización.',
                'errores_comunes': 'Confundir célula con tejido, no comprender la jerarquía de organización biológica, pensar que los átomos son la unidad básica de la vida.',
                'explicacion_opciones_incorrectas': {
                    'B': 'El tejido es un conjunto de células similares que trabajan juntas, por lo tanto es un nivel de organización superior a la célula',
                    'C': 'El órgano está formado por varios tejidos que colaboran en una función específica, representa un nivel más complejo que la célula',
                    'D': 'El sistema es un conjunto de órganos que trabajan coordinadamente, constituye el nivel más alto de organización antes del organismo completo'
                }
            },
            'La segunda ley de Newton establece que F =': {
                'habilidad_evaluada': 'Comprensión de las leyes fundamentales de la mecánica clásica y capacidad para relacionar fuerza, masa y aceleración en sistemas físicos.',
                'estrategias_resolucion': '1. Recordar que la segunda ley de Newton relaciona fuerza con masa y aceleración. 2. Identificar que la fuerza es directamente proporcional a la masa y a la aceleración. 3. Reconocer la fórmula F = ma donde F es fuerza (N), m es masa (kg) y a es aceleración (m/s²). 4. Descartar fórmulas que no corresponden a esta relación física.',
                'errores_comunes': 'Confundir fuerza con momento (mv), no recordar que la fuerza es proporcional al producto de masa y aceleración, confundir con otras ecuaciones físicas.',
                'explicacion_opciones_incorrectas': {
                    'B': 'F = mv representa el momento lineal, no la segunda ley de Newton. El momento es masa por velocidad, no por aceleración',
                    'C': 'F = m/a sería físicamente incorrecta porque implicaría que la fuerza es inversamente proporcional a la aceleración, lo cual contradice la observación experimental',
                    'D': 'F = a/m también es físicamente incorrecta porque haría que la fuerza fuera inversamente proporcional a la masa, contrario a lo observado experimentalmente'
                }
            },

            # CIENCIAS SOCIALES
            '¿En qué año inició la Segunda Guerra Mundial?': {
                'habilidad_evaluada': 'Conocimiento de cronología histórica mundial y comprensión de eventos que marcaron el siglo XX, específicamente el inicio del conflicto bélico más significativo de la historia moderna.',
                'estrategias_resolucion': '1. Recordar que la Segunda Guerra Mundial comenzó con la invasión alemana a Polonia. 2. Asociar esta invasión con la fecha del 1 de septiembre de 1939. 3. Reconocer que las declaraciones de guerra de Francia y Reino Unido a Alemania siguieron inmediatamente. 4. Diferenciar del ataque a Pearl Harbor (1941) que marcó la entrada de Estados Unidos.',
                'errores_comunes': 'Confundir con el ataque a Pearl Harbor (1941), mezclar fechas con el inicio de la guerra en el Pacífico, no recordar la cronología europea del conflicto.',
                'explicacion_opciones_incorrectas': {
                    'B': '1941 corresponde al ataque japonés a Pearl Harbor y la entrada de Estados Unidos en la guerra, pero la guerra ya había comenzado en Europa',
                    'C': '1937 marca el inicio de la Segunda Guerra Sino-Japonesa, considerada por algunos como el inicio regional del conflicto, pero no el inicio oficial mundial',
                    'D': '1940 es cuando Alemania invadió Francia y otros países europeos, pero la guerra ya había comenzado un año antes'
                }
            },
            'El existencialismo es una corriente filosófica que enfatiza:': {
                'habilidad_evaluada': 'Comprensión de corrientes filosóficas contemporáneas y capacidad para identificar los principios fundamentales del pensamiento existencialista.',
                'estrategias_resolucion': '1. Recordar que el existencialismo se centra en la existencia humana individual. 2. Identificar el concepto clave: "la existencia precede a la esencia". 3. Reconocer que enfatiza la libertad, responsabilidad y autenticidad individual. 4. Asociar con filósofos como Sartre, Camus y Kierkegaard.',
                'errores_comunes': 'Confundir con determinismo, no comprender la relación existencia-esencia, asociar incorrectamente con nihilismo o materialismo.',
                'explicacion_opciones_incorrectas': {
                    'B': 'El determinismo absoluto es opuesto al existencialismo, que defiende la libertad radical del individuo para elegir su destino',
                    'C': 'La negación de la existencia es característica del nihilismo extremo, no del existencialismo que afirma la importancia de la existencia individual',
                    'D': 'La supremacía del Estado es propia de corrientes totalitarias o estatistas, contraria al individualismo existencialista'
                }
            },

            # INGLÉS
            'Choose the correct form: "She _____ to the store yesterday."': {
                'habilidad_evaluada': 'Competencia gramatical para conjugar verbos irregulares en tiempo pasado simple y comprender indicadores temporales en contexto.',
                'estrategias_resolucion': '1. Identificar el indicador temporal "yesterday" que requiere pasado simple. 2. Reconocer que "go" es un verbo irregular. 3. Recordar la conjugación: go → went → gone. 4. Seleccionar "went" como forma correcta del pasado simple. 5. Verificar que la estructura sigue el patrón: Subject + past verb + complement.',
                'errores_comunes': 'Usar la forma base del verbo con indicadores de pasado, confundir pasado simple con presente, no reconocer verbos irregulares.',
                'explicacion_opciones_incorrectas': {
                    'B': '"Go" es la forma base/infinitivo del verbo, no puede usarse con "yesterday" que requiere pasado simple',
                    'C': '"Going" es el gerundio/participio presente, se usa en tiempos continuos, no en pasado simple con "yesterday"',
                    'D': '"Goes" es tercera persona singular del presente simple, incompatible con el indicador temporal "yesterday"'
                }
            },
            'What does "biblioteca" mean in English?': {
                'habilidad_evaluada': 'Conocimiento de vocabulario básico español-inglés y comprensión de espacios públicos y servicios comunitarios.',
                'estrategias_resolucion': '1. Identificar que "biblioteca" se refiere a un lugar donde se guardan libros. 2. Recordar que en inglés "library" designa el mismo concepto. 3. Diferenciar de "bookstore" (librería comercial). 4. Asociar con servicios públicos de préstamo de libros y lectura.',
                'errores_comunes': 'Confundir biblioteca con librería (bookstore), no distinguir entre espacios de préstamo gratuito y venta comercial.',
                'explicacion_opciones_incorrectas': {
                    'B': '"Bookstore" significa librería, un establecimiento comercial donde se venden libros, no donde se prestan gratuitamente',
                    'C': '"Museum" significa museo, un lugar donde se exhiben objetos de valor cultural, histórico o artístico, no libros para préstamo',
                    'D': '"School" significa escuela, una institución educativa, aunque puede tener biblioteca, no es sinónimo de biblioteca'
                }
            }
        }

        total_updated = 0
        
        for enunciado, mejora in preguntas_mejoradas.items():
            try:
                pregunta = Pregunta.objects.get(enunciado=enunciado)
                
                # Actualizar campos de retroalimentación
                pregunta.habilidad_evaluada = mejora['habilidad_evaluada']
                pregunta.estrategias_resolucion = mejora['estrategias_resolucion']
                pregunta.errores_comunes = mejora['errores_comunes']
                pregunta.explicacion_opciones_incorrectas = mejora['explicacion_opciones_incorrectas']
                
                pregunta.save()
                total_updated += 1
                
                self.stdout.write(f'  ✓ Pregunta actualizada: {enunciado[:60]}...')
                
            except Pregunta.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'❌ Pregunta no encontrada: {enunciado[:60]}...')
                )
                continue
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 ¡{total_updated} preguntas actualizadas con retroalimentación exhaustiva!')
        )
        self.stdout.write(
            self.style.SUCCESS('📚 Retroalimentación mejorada incluye:')
        )
        self.stdout.write(
            self.style.SUCCESS('   • Habilidades evaluadas específicas')
        )
        self.stdout.write(
            self.style.SUCCESS('   • Estrategias de resolución paso a paso')
        )
        self.stdout.write(
            self.style.SUCCESS('   • Errores comunes identificados')
        )
        self.stdout.write(
            self.style.SUCCESS('   • Explicación detallada de opciones incorrectas')
        )