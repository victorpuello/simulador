from django.core.management.base import BaseCommand
from apps.core.models import Materia, Competencia, Pregunta

class Command(BaseCommand):
    help = 'Generar 20 preguntas por materia para el simulador'

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🎯 Generando 20 preguntas por materia...')
        )

        # Datos para generar preguntas por materia
        preguntas_data = {
            'matematicas': [
                {
                    'enunciado': 'Si 2x + 3y = 12 y x - y = 1, ¿cuál es el valor de y?',
                    'contexto': 'Sistema de ecuaciones lineales con dos incógnitas.',
                    'opciones': {'A': '2', 'B': '3', 'C': '1', 'D': '4'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Resolviendo el sistema: x = 3, y = 2',
                    'competencia': 'Álgebra',
                    'tiempo_estimado': 120
                },
                {
                    'enunciado': '¿Cuál es el área de un círculo con radio 5 cm?',
                    'opciones': {'A': '25π cm²', 'B': '10π cm²', 'C': '15π cm²', 'D': '20π cm²'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Área = πr² = π(5)² = 25π cm²',
                    'competencia': 'Geometría',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'Si sen(θ) = 3/5 y θ está en el primer cuadrante, ¿cuál es cos(θ)?',
                    'opciones': {'A': '4/5', 'B': '3/4', 'C': '5/4', 'D': '4/3'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Usando la identidad pitagórica: cos²(θ) = 1 - sen²(θ) = 1 - 9/25 = 16/25, entonces cos(θ) = 4/5',
                    'competencia': 'Trigonometría',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'En una encuesta a 100 estudiantes, 60 prefieren matemáticas y 40 prefieren ciencias. Si 20 prefieren ambas, ¿cuántos no prefieren ninguna?',
                    'opciones': {'A': '20', 'B': '10', 'C': '30', 'D': '0'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Usando diagramas de Venn: Total = Solo matemáticas + Solo ciencias + Ambas + Ninguna. 100 = 40 + 20 + 20 + x, entonces x = 20',
                    'competencia': 'Estadística',
                    'tiempo_estimado': 150
                },
                {
                    'enunciado': 'Si f(x) = x² + 2x - 3, ¿cuál es f(2)?',
                    'opciones': {'A': '5', 'B': '3', 'C': '1', 'D': '7'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'f(2) = (2)² + 2(2) - 3 = 4 + 4 - 3 = 5',
                    'competencia': 'Álgebra',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Cuál es el perímetro de un triángulo equilátero de lado 6 cm?',
                    'opciones': {'A': '18 cm', 'B': '12 cm', 'C': '24 cm', 'D': '36 cm'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Perímetro = 3 × lado = 3 × 6 = 18 cm',
                    'competencia': 'Geometría',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'Si tan(45°) = 1, ¿cuál es el valor de sen(45°)?',
                    'opciones': {'A': '√2/2', 'B': '1/2', 'C': '√3/2', 'D': '1'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'En un triángulo rectángulo de 45°, sen(45°) = √2/2',
                    'competencia': 'Trigonometría',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'La media aritmética de 5, 8, 12, 15, 20 es:',
                    'opciones': {'A': '12', 'B': '10', 'C': '15', 'D': '8'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Media = (5+8+12+15+20)/5 = 60/5 = 12',
                    'competencia': 'Estadística',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'Resuelve: 3x - 7 = 2x + 5',
                    'opciones': {'A': 'x = 12', 'B': 'x = 2', 'C': 'x = -2', 'D': 'x = 5'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': '3x - 2x = 5 + 7, x = 12',
                    'competencia': 'Álgebra',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Cuál es el volumen de un cubo de arista 4 cm?',
                    'opciones': {'A': '64 cm³', 'B': '16 cm³', 'C': '48 cm³', 'D': '32 cm³'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Volumen = arista³ = 4³ = 64 cm³',
                    'competencia': 'Geometría',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'Si cos(60°) = 1/2, ¿cuál es sen(30°)?',
                    'opciones': {'A': '1/2', 'B': '√3/2', 'C': '√2/2', 'D': '1'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'sen(30°) = cos(60°) = 1/2 (ángulos complementarios)',
                    'competencia': 'Trigonometría',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'En un grupo de 50 datos, la mediana es:',
                    'opciones': {'A': 'El promedio de los datos 25 y 26', 'B': 'El dato número 25', 'C': 'El dato número 26', 'D': 'La suma de todos los datos'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Para n par, la mediana es el promedio de los datos n/2 y (n/2)+1',
                    'competencia': 'Estadística',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'Factoriza: x² - 9',
                    'opciones': {'A': '(x-3)(x+3)', 'B': '(x-9)(x+1)', 'C': 'x(x-9)', 'D': 'No se puede factorizar'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Es una diferencia de cuadrados: a² - b² = (a-b)(a+b)',
                    'competencia': 'Álgebra',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': '¿Cuál es la hipotenusa de un triángulo rectángulo con catetos 3 y 4?',
                    'opciones': {'A': '5', 'B': '7', 'C': '6', 'D': '√7'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Teorema de Pitágoras: c² = 3² + 4² = 9 + 16 = 25, entonces c = 5',
                    'competencia': 'Geometría',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'Si log₂(8) = x, entonces x es:',
                    'opciones': {'A': '3', 'B': '2', 'C': '4', 'D': '8'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': '2³ = 8, por lo tanto log₂(8) = 3',
                    'competencia': 'Álgebra',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Cuántos grados tiene cada ángulo interno de un hexágono regular?',
                    'opciones': {'A': '120°', 'B': '108°', 'C': '90°', 'D': '135°'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Ángulo interno = (n-2)×180°/n = (6-2)×180°/6 = 120°',
                    'competencia': 'Geometría',
                    'tiempo_estimado': 120
                },
                {
                    'enunciado': 'La probabilidad de obtener un número par al lanzar un dado es:',
                    'opciones': {'A': '1/2', 'B': '1/3', 'C': '2/3', 'D': '1/6'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Números pares: 2, 4, 6. Probabilidad = 3/6 = 1/2',
                    'competencia': 'Estadística',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'Si una función lineal pasa por (0,2) y (1,5), ¿cuál es su ecuación?',
                    'opciones': {'A': 'y = 3x + 2', 'B': 'y = 2x + 3', 'C': 'y = x + 2', 'D': 'y = 5x + 2'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Pendiente m = (5-2)/(1-0) = 3, intercepto b = 2, entonces y = 3x + 2',
                    'competencia': 'Álgebra',
                    'tiempo_estimado': 120
                },
                {
                    'enunciado': '¿Cuál es la distancia entre los puntos (1,2) y (4,6)?',
                    'opciones': {'A': '5', 'B': '7', 'C': '3', 'D': '√7'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'd = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5',
                    'competencia': 'Geometría',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'El rango intercuartílico de un conjunto de datos es:',
                    'opciones': {'A': 'Q3 - Q1', 'B': 'Q2 - Q1', 'C': 'Q3 - Q2', 'D': 'Q3 + Q1'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El rango intercuartílico es la diferencia entre el tercer y primer cuartil',
                    'competencia': 'Estadística',
                    'tiempo_estimado': 90
                }
            ],
            
            'lenguaje': [
                {
                    'enunciado': '¿Cuál de las siguientes palabras es un adverbio?',
                    'opciones': {'A': 'Rápidamente', 'B': 'Casa', 'C': 'Bonito', 'D': 'Correr'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los adverbios terminados en -mente modifican verbos, adjetivos u otros adverbios',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'En la oración "El libro que compré es interesante", la palabra "que" es:',
                    'opciones': {'A': 'Pronombre relativo', 'B': 'Conjunción', 'C': 'Artículo', 'D': 'Preposición'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': '"Que" introduce una oración subordinada adjetiva y se refiere a "libro"',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': '¿Cuál es la función principal de la introducción en un texto argumentativo?',
                    'contexto': 'Los textos argumentativos tienen una estructura específica para persuadir al lector.',
                    'opciones': {'A': 'Presentar la tesis', 'B': 'Desarrollar argumentos', 'C': 'Concluir ideas', 'D': 'Refutar opposing views'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La introducción debe captar la atención y presentar claramente la tesis a defender',
                    'competencia': 'Comprensión Lectora',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'Identifica la figura literaria en: "Sus ojos eran dos luceros"',
                    'opciones': {'A': 'Metáfora', 'B': 'Símil', 'C': 'Hipérbole', 'D': 'Personificación'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La metáfora establece una identificación directa entre dos elementos sin usar "como"',
                    'competencia': 'Literatura',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Cuál es el sujeto en la oración "Llegaron tarde los estudiantes"?',
                    'opciones': {'A': 'Los estudiantes', 'B': 'Llegaron', 'C': 'Tarde', 'D': 'Llegaron tarde'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El sujeto es quien realiza la acción, aunque aparezca al final de la oración',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'El realismo mágico es característico de:',
                    'opciones': {'A': 'La literatura latinoamericana', 'B': 'El romanticismo europeo', 'C': 'La literatura medieval', 'D': 'El neoclasicismo'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El realismo mágico surgió en Latinoamérica con autores como García Márquez',
                    'competencia': 'Literatura',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': '¿Cuál de estas palabras está correctamente acentuada?',
                    'opciones': {'A': 'Médico', 'B': 'Medico', 'C': 'Medicó', 'D': 'Médicó'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': '"Médico" es esdrújula y todas las esdrújulas llevan tilde',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'La idea central de un párrafo se encuentra generalmente en:',
                    'opciones': {'A': 'La oración temática', 'B': 'La conclusión', 'C': 'Los ejemplos', 'D': 'Las oraciones secundarias'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La oración temática expresa la idea principal que se desarrolla en el párrafo',
                    'competencia': 'Comprensión Lectora',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Qué tipo de narrador se usa en "Yo caminaba por la calle cuando..."?',
                    'opciones': {'A': 'Primera persona', 'B': 'Segunda persona', 'C': 'Tercera persona', 'D': 'Omnisciente'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El uso del pronombre "yo" indica narración en primera persona',
                    'competencia': 'Literatura',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'El modo subjuntivo expresa:',
                    'opciones': {'A': 'Deseo, duda o hipótesis', 'B': 'Hechos reales', 'C': 'Órdenes directas', 'D': 'Acciones pasadas'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El subjuntivo se usa para expresar subjetividad: deseos, dudas, emociones',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'En un texto expositivo, ¿cuál es la función de los conectores?',
                    'contexto': 'Los conectores son palabras que establecen relaciones entre ideas.',
                    'opciones': {'A': 'Relacionar ideas y dar coherencia', 'B': 'Adornar el texto', 'C': 'Alargar párrafos', 'D': 'Confundir al lector'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los conectores unen ideas y facilitan la comprensión del texto',
                    'competencia': 'Comprensión Lectora',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'La aliteración es:',
                    'opciones': {'A': 'Repetición de sonidos consonánticos', 'B': 'Repetición de palabras', 'C': 'Exageración', 'D': 'Comparación'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La aliteración repite sonidos consonánticos para crear efectos sonoros',
                    'competencia': 'Literatura',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Cuál es el complemento directo en "María compró flores"?',
                    'opciones': {'A': 'Flores', 'B': 'María', 'C': 'Compró', 'D': 'No hay'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El complemento directo responde a "¿qué?" - ¿Qué compró? Flores',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'La inferencia en comprensión lectora significa:',
                    'opciones': {'A': 'Deducir información no explícita', 'B': 'Leer literalmente', 'C': 'Memorizar el texto', 'D': 'Copiar ideas'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Inferir es sacar conclusiones usando información del texto y conocimientos previos',
                    'competencia': 'Comprensión Lectora',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'El modernismo literario se caracteriza por:',
                    'opciones': {'A': 'Renovación estética y formal', 'B': 'Realismo social', 'C': 'Temas medievales', 'D': 'Lenguaje coloquial'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El modernismo buscó la belleza formal y la renovación del lenguaje poético',
                    'competencia': 'Literatura',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': '¿Cuál palabra funciona como sustantivo en "El correr es saludable"?',
                    'opciones': {'A': 'Correr', 'B': 'El', 'C': 'Es', 'D': 'Saludable'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los infinitivos pueden sustantivarse, precedidos por artículo',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'El propósito comunicativo de un texto instructivo es:',
                    'opciones': {'A': 'Enseñar a hacer algo', 'B': 'Entretener', 'C': 'Argumentar', 'D': 'Describir'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los textos instructivos guían al lector para realizar una actividad específica',
                    'competencia': 'Comprensión Lectora',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'La rima consonante ocurre cuando:',
                    'opciones': {'A': 'Coinciden vocales y consonantes', 'B': 'Solo coinciden vocales', 'C': 'No hay coincidencias', 'D': 'Solo consonantes'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'En la rima consonante coinciden todos los sonidos desde la vocal acentuada',
                    'competencia': 'Literatura',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'El hiato se produce cuando:',
                    'opciones': {'A': 'Dos vocales no forman diptongo', 'B': 'Hay tres vocales juntas', 'C': 'Se unen consonantes', 'D': 'Hay acento prosódico'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El hiato separa vocales que podrían formar diptongo en sílabas diferentes',
                    'competencia': 'Gramática',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'Un texto argumentativo busca principalmente:',
                    'opciones': {'A': 'Convencer al lector', 'B': 'Informar datos', 'C': 'Narrar eventos', 'D': 'Describir lugares'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El texto argumentativo presenta razones para persuadir sobre una tesis',
                    'competencia': 'Comprensión Lectora',
                    'tiempo_estimado': 80
                }
            ],
            
            'ciencias': [
                {
                    'enunciado': '¿Cuál es la unidad básica de la vida?',
                    'opciones': {'A': 'La célula', 'B': 'El tejido', 'C': 'El órgano', 'D': 'El sistema'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La célula es la unidad estructural y funcional básica de todos los seres vivos',
                    'competencia': 'Biología',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'La velocidad de la luz en el vacío es aproximadamente:',
                    'opciones': {'A': '300,000 km/s', 'B': '150,000 km/s', 'C': '450,000 km/s', 'D': '200,000 km/s'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La velocidad de la luz es una constante fundamental: c = 299,792,458 m/s ≈ 300,000 km/s',
                    'competencia': 'Física',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': '¿Cuál es la fórmula química del agua?',
                    'opciones': {'A': 'H₂O', 'B': 'CO₂', 'C': 'NaCl', 'D': 'CH₄'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El agua está formada por dos átomos de hidrógeno y uno de oxígeno',
                    'competencia': 'Química',
                    'tiempo_estimado': 50
                },
                {
                    'enunciado': 'El proceso por el cual las plantas fabrican su alimento se llama:',
                    'contexto': 'Las plantas son organismos autótrofos que producen su propio alimento.',
                    'opciones': {'A': 'Fotosíntesis', 'B': 'Respiración', 'C': 'Digestión', 'D': 'Transpiración'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La fotosíntesis convierte CO₂ y H₂O en glucosa usando energía solar',
                    'competencia': 'Biología',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'La segunda ley de Newton establece que F =',
                    'opciones': {'A': 'ma', 'B': 'mv', 'C': 'm/a', 'D': 'a/m'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La fuerza es igual a la masa por la aceleración (F = ma)',
                    'competencia': 'Física',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'En la tabla periódica, los elementos del mismo grupo tienen:',
                    'opciones': {'A': 'El mismo número de electrones de valencia', 'B': 'La misma masa atómica', 'C': 'El mismo número de neutrones', 'D': 'La misma densidad'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los elementos del mismo grupo tienen propiedades similares por tener igual número de electrones de valencia',
                    'competencia': 'Química',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': '¿Cuál es la función principal del sistema circulatorio?',
                    'opciones': {'A': 'Transportar sustancias por el cuerpo', 'B': 'Digerir alimentos', 'C': 'Respirar oxígeno', 'D': 'Eliminar desechos'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El sistema circulatorio transporta nutrientes, oxígeno y desechos por todo el organismo',
                    'competencia': 'Biología',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'Un objeto en movimiento rectilíneo uniforme tiene:',
                    'opciones': {'A': 'Velocidad constante', 'B': 'Aceleración constante', 'C': 'Fuerza constante', 'D': 'Velocidad variable'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'En MRU la velocidad es constante, por lo tanto la aceleración es cero',
                    'competencia': 'Física',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': '¿Qué tipo de enlace une los átomos en una molécula de sal (NaCl)?',
                    'opciones': {'A': 'Enlace iónico', 'B': 'Enlace covalente', 'C': 'Enlace metálico', 'D': 'Enlace de hidrógeno'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El NaCl se forma por transferencia de electrones entre Na⁺ y Cl⁻ (enlace iónico)',
                    'competencia': 'Química',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'La mitosis es un proceso que resulta en:',
                    'opciones': {'A': 'Dos células diploides idénticas', 'B': 'Cuatro células haploides', 'C': 'Una célula gigante', 'D': 'Células con diferente información genética'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La mitosis produce dos células hijas genéticamente idénticas a la célula madre',
                    'competencia': 'Biología',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'La energía cinética de un objeto depende de:',
                    'opciones': {'A': 'Su masa y velocidad', 'B': 'Solo su masa', 'C': 'Solo su velocidad', 'D': 'Su posición'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Energía cinética = ½mv², depende de masa y velocidad al cuadrado',
                    'competencia': 'Física',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Cuál es el pH del agua pura a 25°C?',
                    'opciones': {'A': '7', 'B': '0', 'C': '14', 'D': '1'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El agua pura es neutra con pH = 7 a temperatura ambiente',
                    'competencia': 'Química',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'Los cromosomas se encuentran en:',
                    'opciones': {'A': 'El núcleo celular', 'B': 'El citoplasma', 'C': 'Las mitocondrias', 'D': 'La membrana celular'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los cromosomas están en el núcleo y contienen el ADN de la célula',
                    'competencia': 'Biología',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'Un espejo cóncavo forma imágenes:',
                    'opciones': {'A': 'Reales e invertidas cuando el objeto está lejos', 'B': 'Siempre virtuales', 'C': 'Siempre del mismo tamaño', 'D': 'Solo ampliadas'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los espejos cóncavos forman diferentes tipos de imágenes según la distancia del objeto',
                    'competencia': 'Física',
                    'tiempo_estimado': 120
                },
                {
                    'enunciado': 'Una reacción de combustión siempre produce:',
                    'opciones': {'A': 'CO₂ y H₂O', 'B': 'Solo CO₂', 'C': 'Solo H₂O', 'D': 'O₂ y N₂'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La combustión completa de hidrocarburos produce siempre dióxido de carbono y agua',
                    'competencia': 'Química',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'El ADN se replica durante la fase:',
                    'opciones': {'A': 'S del ciclo celular', 'B': 'G1 del ciclo celular', 'C': 'G2 del ciclo celular', 'D': 'M del ciclo celular'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La fase S (síntesis) es cuando ocurre la replicación del ADN',
                    'competencia': 'Biología',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'La presión ejercida por un líquido depende de:',
                    'opciones': {'A': 'La profundidad y densidad', 'B': 'Solo la profundidad', 'C': 'Solo la densidad', 'D': 'El área del recipiente'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Presión hidrostática P = ρgh (densidad × gravedad × profundidad)',
                    'competencia': 'Física',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': '¿Cuántos electrones puede tener como máximo el orbital 2p?',
                    'opciones': {'A': '6', 'B': '2', 'C': '10', 'D': '14'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El subnivel 2p tiene 3 orbitales, cada uno con máximo 2 electrones (3 × 2 = 6)',
                    'competencia': 'Química',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'La función principal de las mitocondrias es:',
                    'opciones': {'A': 'Producir ATP', 'B': 'Sintetizar proteínas', 'C': 'Almacenar ADN', 'D': 'Digerir sustancias'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Las mitocondrias son las "centrales energéticas" que producen ATP mediante respiración celular',
                    'competencia': 'Biología',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'Un rayo de luz cambia de dirección al pasar de un medio a otro. Este fenómeno se llama:',
                    'opciones': {'A': 'Refracción', 'B': 'Reflexión', 'C': 'Difracción', 'D': 'Dispersión'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La refracción ocurre cuando la luz cambia de velocidad al pasar entre medios diferentes',
                    'competencia': 'Física',
                    'tiempo_estimado': 80
                }
            ],
            
            'sociales': [
                {
                    'enunciado': '¿En qué año inició la Segunda Guerra Mundial?',
                    'opciones': {'A': '1939', 'B': '1941', 'C': '1937', 'D': '1940'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La Segunda Guerra Mundial comenzó el 1 de septiembre de 1939 con la invasión alemana a Polonia',
                    'competencia': 'Historia',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': '¿Cuál es la capital de Australia?',
                    'opciones': {'A': 'Canberra', 'B': 'Sídney', 'C': 'Melbourne', 'D': 'Perth'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Canberra es la capital de Australia, aunque Sídney y Melbourne son ciudades más grandes',
                    'competencia': 'Geografía',
                    'tiempo_estimado': 50
                },
                {
                    'enunciado': 'El existencialismo es una corriente filosófica que enfatiza:',
                    'opciones': {'A': 'La libertad y responsabilidad individual', 'B': 'El determinismo absoluto', 'C': 'La negación de la existencia', 'D': 'La supremacía del Estado'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El existencialismo destaca que "la existencia precede a la esencia" y la libertad de elección',
                    'competencia': 'Filosofía',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'La Independencia de Colombia se declaró en:',
                    'contexto': 'El proceso de independencia de las colonias americanas fue un periodo crucial en la historia.',
                    'opciones': {'A': '1810', 'B': '1819', 'C': '1821', 'D': '1830'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El 20 de julio de 1810 se declaró la independencia del Virreinato de Nueva Granada',
                    'competencia': 'Historia',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿Cuál es el río más largo del mundo?',
                    'opciones': {'A': 'Nilo', 'B': 'Amazonas', 'C': 'Yangtsé', 'D': 'Misisipi'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El río Nilo, con 6,650 km de longitud, es considerado el más largo del mundo',
                    'competencia': 'Geografía',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'Según Platón, el mundo de las Ideas es:',
                    'opciones': {'A': 'El mundo perfecto e inmutable', 'B': 'Una ilusión mental', 'C': 'Igual al mundo sensible', 'D': 'Un concepto moderno'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Para Platón, el mundo inteligible de las Ideas es perfecto, eterno e inmutable',
                    'competencia': 'Filosofía',
                    'tiempo_estimado': 120
                },
                {
                    'enunciado': 'La Revolución Francesa comenzó en:',
                    'opciones': {'A': '1789', 'B': '1799', 'C': '1776', 'D': '1804'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La Revolución Francesa comenzó en 1789 con la toma de la Bastilla el 14 de julio',
                    'competencia': 'Historia',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'Los paralelos son líneas imaginarias que:',
                    'opciones': {'A': 'Van de este a oeste', 'B': 'Van de norte a sur', 'C': 'Conectan los polos', 'D': 'Son verticales'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los paralelos son círculos imaginarios perpendiculares al eje terrestre que van de este a oeste',
                    'competencia': 'Geografía',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'El utilitarismo sostiene que una acción es correcta si:',
                    'opciones': {'A': 'Produce la mayor felicidad para el mayor número', 'B': 'Sigue un deber moral', 'C': 'Es natural', 'D': 'Beneficia solo al individuo'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El utilitarismo de Bentham y Mill busca maximizar la felicidad general',
                    'competencia': 'Filosofía',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': '¿Quién fue el primer emperador de Roma?',
                    'opciones': {'A': 'Augusto', 'B': 'Julio César', 'C': 'Nerón', 'D': 'Trajano'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Octavio Augusto fue el primer emperador romano (27 a.C.), aunque César fue dictador perpetuo',
                    'competencia': 'Historia',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'El efecto invernadero es causado principalmente por:',
                    'contexto': 'El cambio climático es uno de los desafíos ambientales más importantes de nuestra época.',
                    'opciones': {'A': 'Gases como CO₂ y metano', 'B': 'El agujero de ozono', 'C': 'La radiación solar', 'D': 'Los volcanes'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los gases de efecto invernadero atrapan calor en la atmósfera terrestre',
                    'competencia': 'Geografía',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'El mito de la caverna de Platón ilustra:',
                    'opciones': {'A': 'La diferencia entre apariencia y realidad', 'B': 'La importancia de la matemática', 'C': 'El origen del universo', 'D': 'La vida después de la muerte'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La alegoría muestra el camino del conocimiento desde las sombras hacia la verdad',
                    'competencia': 'Filosofía',
                    'tiempo_estimado': 110
                },
                {
                    'enunciado': 'La Guerra de los Cien Años fue un conflicto entre:',
                    'opciones': {'A': 'Francia e Inglaterra', 'B': 'España y Francia', 'C': 'Inglaterra y España', 'D': 'Francia y Alemania'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La Guerra de los Cien Años (1337-1453) enfrentó a Francia e Inglaterra',
                    'competencia': 'Historia',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': '¿En qué continente se encuentra el desierto del Sahara?',
                    'opciones': {'A': 'África', 'B': 'Asia', 'C': 'Australia', 'D': 'América'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El Sahara es el desierto más grande del mundo y se ubica en el norte de África',
                    'competencia': 'Geografía',
                    'tiempo_estimado': 50
                },
                {
                    'enunciado': 'El imperativo categórico de Kant establece que debemos:',
                    'opciones': {'A': 'Actuar solo según máximas universalizables', 'B': 'Buscar siempre el placer', 'C': 'Obedecer al más fuerte', 'D': 'Seguir nuestros instintos'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Kant propone actuar solo según principios que podrían ser leyes universales',
                    'competencia': 'Filosofía',
                    'tiempo_estimado': 120
                },
                {
                    'enunciado': 'El Renacimiento comenzó en:',
                    'opciones': {'A': 'Italia', 'B': 'Francia', 'C': 'España', 'D': 'Inglaterra'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El Renacimiento surgió en Italia durante los siglos XIV-XV, especialmente en Florencia',
                    'competencia': 'Historia',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'La línea ecuatorial divide la Tierra en:',
                    'opciones': {'A': 'Hemisferio norte y sur', 'B': 'Hemisferio este y oeste', 'C': 'Zona tropical y polar', 'D': 'Continentes y océanos'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El Ecuador (latitud 0°) separa los hemisferios norte y sur',
                    'competencia': 'Geografía',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'El estoicismo enseña que la felicidad se alcanza mediante:',
                    'opciones': {'A': 'La aceptación y el autocontrol', 'B': 'El placer físico', 'C': 'La acumulación de riquezas', 'D': 'El poder político'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Los estoicos creían en vivir conforme a la naturaleza y aceptar lo que no podemos cambiar',
                    'competencia': 'Filosofía',
                    'tiempo_estimado': 100
                },
                {
                    'enunciado': 'La Revolución Industrial comenzó en:',
                    'opciones': {'A': 'Inglaterra', 'B': 'Francia', 'C': 'Alemania', 'D': 'Estados Unidos'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'La Revolución Industrial se inició en Inglaterra a mediados del siglo XVIII',
                    'competencia': 'Historia',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'El clima mediterráneo se caracteriza por:',
                    'opciones': {'A': 'Veranos secos e inviernos húmedos', 'B': 'Lluvia todo el año', 'C': 'Sequía permanente', 'D': 'Frío constante'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'El clima mediterráneo tiene veranos cálidos y secos, e inviernos suaves y húmedos',
                    'competencia': 'Geografía',
                    'tiempo_estimado': 80
                }
            ],
            
            'ingles': [
                {
                    'enunciado': 'Choose the correct form: "She _____ to the store yesterday."',
                    'opciones': {'A': 'went', 'B': 'go', 'C': 'going', 'D': 'goes'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Past tense of "go" is "went". "Yesterday" indicates past time.',
                    'competencia': 'Gramática Inglesa',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'What does "biblioteca" mean in English?',
                    'opciones': {'A': 'Library', 'B': 'Bookstore', 'C': 'Museum', 'D': 'School'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Biblioteca = Library (a place where books are kept for reading)',
                    'competencia': 'Vocabulario',
                    'tiempo_estimado': 40
                },
                {
                    'enunciado': 'Read: "The weather is sunny today. Mary decides to go to the park." What will Mary probably do?',
                    'contexto': 'Reading comprehension exercise about daily activities.',
                    'opciones': {'A': 'Have a picnic or walk outside', 'B': 'Stay inside and read', 'C': 'Go to the movies', 'D': 'Study in the library'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Sunny weather + going to the park suggests outdoor activities',
                    'competencia': 'Comprensión Escrita',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'Which sentence is in the present continuous?',
                    'opciones': {'A': 'I am studying English', 'B': 'I study English', 'C': 'I studied English', 'D': 'I will study English'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Present continuous = am/is/are + verb-ing (for actions happening now)',
                    'competencia': 'Gramática Inglesa',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'The opposite of "expensive" is:',
                    'opciones': {'A': 'cheap', 'B': 'costly', 'C': 'valuable', 'D': 'precious'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Expensive (caro) ↔ Cheap (barato) are antonyms',
                    'competencia': 'Vocabulario',
                    'tiempo_estimado': 50
                },
                {
                    'enunciado': 'According to the text: "John loves pizza. He eats it twice a week." How often does John eat pizza?',
                    'opciones': {'A': 'Twice a week', 'B': 'Every day', 'C': 'Once a month', 'D': 'Never'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'The text explicitly states "He eats it twice a week"',
                    'competencia': 'Comprensión Escrita',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'Complete: "If it _____ tomorrow, we will stay home."',
                    'opciones': {'A': 'rains', 'B': 'rain', 'C': 'rained', 'D': 'raining'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'First conditional: If + present simple, will + infinitive',
                    'competencia': 'Gramática Inglesa',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'What is a synonym for "happy"?',
                    'opciones': {'A': 'joyful', 'B': 'sad', 'C': 'angry', 'D': 'tired'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Happy and joyful both mean feeling pleasure or contentment',
                    'competencia': 'Vocabulario',
                    'tiempo_estimado': 50
                },
                {
                    'enunciado': 'Based on: "The concert starts at 8 PM. We should arrive early to get good seats." When should they arrive?',
                    'opciones': {'A': 'Before 8 PM', 'B': 'At exactly 8 PM', 'C': 'After 8 PM', 'D': 'At midnight'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': '"Arrive early" means before the start time of 8 PM',
                    'competencia': 'Comprensión Escrita',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'Choose the correct comparative: "This book is _____ than that one."',
                    'opciones': {'A': 'more interesting', 'B': 'most interesting', 'C': 'interestinger', 'D': 'interesting'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Long adjectives use "more + adjective" for comparatives',
                    'competencia': 'Gramática Inglesa',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'Which word means "médico" in English?',
                    'opciones': {'A': 'doctor', 'B': 'teacher', 'C': 'lawyer', 'D': 'engineer'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Médico = Doctor (a person who treats sick people)',
                    'competencia': 'Vocabulario',
                    'tiempo_estimado': 40
                },
                {
                    'enunciado': 'From the passage: "Sarah works as a nurse. She helps patients feel better every day." What is Sarah\'s job?',
                    'opciones': {'A': 'Nurse', 'B': 'Doctor', 'C': 'Teacher', 'D': 'Student'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'The text clearly states "Sarah works as a nurse"',
                    'competencia': 'Comprensión Escrita',
                    'tiempo_estimado': 60
                },
                {
                    'enunciado': 'Select the correct question form: "_____ you like ice cream?"',
                    'opciones': {'A': 'Do', 'B': 'Does', 'C': 'Are', 'D': 'Is'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Questions with "you" + base verb use "Do you...?"',
                    'competencia': 'Gramática Inglesa',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'The word "kitchen" refers to:',
                    'opciones': {'A': 'A room where food is prepared', 'B': 'A place to sleep', 'C': 'A place to study', 'D': 'A place to park cars'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Kitchen = cocina (the room in a house where food is cooked)',
                    'competencia': 'Vocabulario',
                    'tiempo_estimado': 50
                },
                {
                    'enunciado': 'Read: "Tom has three cats and two dogs. His neighbor has one cat." How many cats do they have together?',
                    'opciones': {'A': '4 cats', 'B': '3 cats', 'C': '2 cats', 'D': '5 cats'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Tom has 3 cats + neighbor has 1 cat = 4 cats total',
                    'competencia': 'Comprensión Escrita',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'Which is the correct past participle of "eat"?',
                    'opciones': {'A': 'eaten', 'B': 'ate', 'C': 'eating', 'D': 'eats'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Eat - ate - eaten (irregular verb past participle)',
                    'competencia': 'Gramática Inglesa',
                    'tiempo_estimado': 70
                },
                {
                    'enunciado': 'What does "temprano" mean in English?',
                    'opciones': {'A': 'early', 'B': 'late', 'C': 'never', 'D': 'always'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Temprano = Early (happening before the usual time)',
                    'competencia': 'Vocabulario',
                    'tiempo_estimado': 40
                },
                {
                    'enunciado': 'In the text: "The store opens at 9 AM and closes at 6 PM." How many hours is the store open?',
                    'opciones': {'A': '9 hours', 'B': '6 hours', 'C': '10 hours', 'D': '8 hours'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'From 9 AM to 6 PM = 9 hours (9 AM to 6 PM)',
                    'competencia': 'Comprensión Escrita',
                    'tiempo_estimado': 90
                },
                {
                    'enunciado': 'Choose the correct superlative: "She is the _____ student in the class."',
                    'opciones': {'A': 'smartest', 'B': 'smarter', 'C': 'smart', 'D': 'most smart'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Short adjectives form superlatives with -est (smart → smartest)',
                    'competencia': 'Gramática Inglesa',
                    'tiempo_estimado': 80
                },
                {
                    'enunciado': 'The plural of "child" is:',
                    'opciones': {'A': 'children', 'B': 'childs', 'C': 'childes', 'D': 'child'},
                    'respuesta_correcta': 'A',
                    'retroalimentacion': 'Child → children (irregular plural form)',
                    'competencia': 'Vocabulario',
                    'tiempo_estimado': 60
                }
            ]
        }

        total_created = 0
        
        for materia_nombre, preguntas in preguntas_data.items():
            try:
                materia = Materia.objects.get(nombre=materia_nombre)
                self.stdout.write(f'\n📚 Procesando {materia_nombre}...')
                
                for pregunta_data in preguntas:
                    # Buscar la competencia
                    competencia = None
                    if 'competencia' in pregunta_data:
                        try:
                            competencia = Competencia.objects.get(
                                nombre=pregunta_data['competencia'],
                                materia=materia
                            )
                        except Competencia.DoesNotExist:
                            self.stdout.write(
                                self.style.WARNING(f'Competencia "{pregunta_data["competencia"]}" no encontrada')
                            )
                    
                    # Crear la pregunta
                    pregunta = Pregunta.objects.create(
                        materia=materia,
                        competencia=competencia,
                        contexto=pregunta_data.get('contexto', ''),
                        enunciado=pregunta_data['enunciado'],
                        opciones=pregunta_data['opciones'],
                        respuesta_correcta=pregunta_data['respuesta_correcta'],
                        retroalimentacion=pregunta_data['retroalimentacion'],
                        explicacion=pregunta_data.get('explicacion', ''),
                        tiempo_estimado=pregunta_data.get('tiempo_estimado', 90),
                        dificultad='media',
                        activa=True
                    )
                    
                    total_created += 1
                    self.stdout.write(f'  ✓ Pregunta creada: {pregunta.enunciado[:50]}...')
                
            except Materia.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Materia "{materia_nombre}" no encontrada')
                )
                continue
        
        self.stdout.write(
            self.style.SUCCESS(f'\n🎉 ¡{total_created} preguntas creadas exitosamente!')
        )
        self.stdout.write(
            self.style.SUCCESS('📊 Distribución: 20 preguntas por materia')
        )
        self.stdout.write(
            self.style.SUCCESS('✅ Base de datos enriquecida para simulaciones')
        )