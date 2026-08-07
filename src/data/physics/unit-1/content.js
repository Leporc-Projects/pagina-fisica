// Contenido conceptual en revisión para la Unidad 1. Las páginas lo presentan con
// profundidad progresiva sin duplicar texto ni convertir cada capa en una ruta.

export const UNIT_1_CONTENT = {
  herramientas: {
    introduction:
      "La física relaciona mediciones mediante modelos. Antes de calcular conviene identificar qué se mide, con qué unidad y qué precisión permite el dato.",
    errorTopics: ["unidades"],
    sections: [
      {
        id: "magnitudes-y-si",
        title: "Magnitudes, unidades y Sistema Internacional",
        essential: [
          "Una magnitud física es una propiedad que puede compararse cuantitativamente con un patrón. Un valor físico necesita un número y una unidad: 4,2 no comunica lo mismo que 4,2 s.",
          "El Sistema Internacional usa siete unidades base. En esta unidad aparecen sobre todo metro (m), kilogramo (kg) y segundo (s); otras unidades se construyen combinándolas.",
        ],
        understand: [
          "Una ecuación física no cambia cuando se expresa en unidades compatibles. Cambia la representación numérica, no la cantidad medida.",
          "Escribir la unidad durante todo el cálculo permite detectar sumas incompatibles y resultados sin interpretación física.",
        ],
        deepen: [
          "Las magnitudes derivadas se definen a partir de magnitudes base. Por ejemplo, la velocidad tiene dimensión longitud dividida por tiempo y se expresa en m/s en el SI.",
          "Una igualdad física exige dimensiones iguales a ambos lados, aunque la igualdad dimensional por sí sola no demuestra que el modelo sea correcto.",
        ],
      },
      {
        id: "conversion-y-cifras",
        title: "Conversión de unidades y cifras significativas",
        essential: [
          "Convertir una unidad consiste en multiplicar por factores que valen uno. Las unidades se cancelan algebraicamente y la cantidad física permanece igual.",
          "Las cifras significativas comunican la resolución de los datos. Un resultado no debe sugerir una precisión que las mediciones de entrada no poseen.",
        ],
        understand: [
          "Conviene escribir cada factor de conversión con la unidad que se desea eliminar en el denominador. Así la propia notación muestra si la cadena está orientada correctamente.",
          "En productos y cocientes, la cantidad de cifras significativas suele limitarse por el dato con menos cifras significativas. En sumas y restas, importa la posición decimal menos precisa.",
        ],
        deepen: [
          "El redondeo se realiza al final para evitar acumular error. Durante el desarrollo pueden conservarse cifras de guarda y después reportar el resultado con precisión coherente.",
          "Los números exactos, como una definición de unidad o un conteo, no limitan las cifras significativas.",
        ],
        checks: [
          {
            question: "¿Qué debe permanecer igual durante una conversión correcta de unidades?",
            options: [
              "El número escrito",
              "La cantidad física representada",
              "El símbolo de la unidad",
            ],
            answer:
              "La cantidad física representada. El número y el símbolo pueden cambiar juntos.",
          },
        ],
      },
      {
        id: "dimensiones-y-estimaciones",
        title: "Análisis dimensional, órdenes de magnitud y estimaciones",
        essential: [
          "El análisis dimensional comprueba si una expresión combina magnitudes compatibles. Solo pueden sumarse términos con la misma dimensión.",
          "Un orden de magnitud ubica una cantidad cerca de una potencia de diez. Una estimación busca una escala razonable antes de exigir precisión fina.",
        ],
        understand: [
          "Estimar obliga a declarar supuestos y ayuda a reconocer errores de factor diez, unidades o digitación. No sustituye una medición: establece un intervalo plausible.",
          "La homogeneidad dimensional es una condición necesaria para una ecuación física, pero dos expresiones dimensionalmente correctas pueden describir modelos distintos.",
        ],
        deepen: [
          "Si una relación propuesta contiene constantes sin dimensión, el análisis puede determinar exponentes posibles. No puede determinar por sí solo factores numéricos ni dependencias aditivas.",
        ],
        explore: [
          "Las estimaciones tipo Fermi descomponen una pregunta amplia en cantidades más simples. La calidad depende de hacer explícitos los supuestos y revisar la sensibilidad del resultado.",
        ],
        formulas: ["dimensional-velocity"],
      },
    ],
  },

  vectores: {
    introduction:
      "Los vectores permiten representar cantidades cuya descripción requiere magnitud y dirección. Sus componentes dependen de la base elegida; el vector físico no.",
    errorTopics: ["vectores"],
    sections: [
      {
        id: "escalar-vector",
        title: "Escalares y vectores",
        essential: [
          "Un vector es una cantidad que tiene magnitud y dirección. El sentido distingue las dos orientaciones posibles sobre una misma dirección.",
          "Un escalar queda descrito por un valor y su unidad. Temperatura, tiempo y masa son ejemplos escalares; desplazamiento y velocidad son vectores.",
        ],
        understand: [
          "Dos vectores son iguales cuando tienen la misma magnitud, dirección y sentido, aunque estén dibujados en lugares distintos.",
          "La magnitud de un vector nunca es negativa. Una componente sí puede ser negativa porque compara el vector con el sentido positivo de un eje.",
        ],
        deepen: [
          "Un vector geométrico puede representarse en distintas bases. Las componentes cambian al cambiar de base, mientras que magnitudes y relaciones geométricas permanecen invariantes.",
        ],
        checks: [
          {
            question: "¿Cuál describe completamente una velocidad?",
            options: [
              "25 m/s",
              "25 m hacia el norte",
              "25 m/s hacia el norte",
              "25 s/m",
            ],
            answer: "25 m/s hacia el norte: incluye magnitud, unidad y dirección.",
          },
        ],
      },
      {
        id: "componentes-y-base",
        title: "Componentes cartesianas, unitarios y bases",
        essential: [
          "Las componentes cartesianas indican cuánto del vector corresponde a cada eje. En una base ortonormal tridimensional se escribe A = Aₓ i + Aᵧ j + A_z k.",
          "Si el ángulo θ se mide desde +x en el plano, Aₓ = A cos θ y Aᵧ = A sin θ. Antes de elegir seno o coseno debe analizarse la geometría y el cuadrante.",
        ],
        understand: [
          "Los vectores unitarios i, j y k tienen magnitud uno y señalan los sentidos positivos de los ejes. La terna forma una base para expresar cualquier vector cartesiano.",
          "La función atan2(Aᵧ,Aₓ) conserva la información del cuadrante; usar solamente arctan(Aᵧ/Aₓ) puede producir una dirección incorrecta.",
        ],
        deepen: [
          "La magnitud se obtiene mediante el teorema de Pitágoras extendido. Recuperar la dirección exige combinar las componentes con sus signos.",
        ],
        formulas: ["vector-magnitude", "vector-components"],
        visualizations: ["vector-components"],
      },
      {
        id: "suma-y-resta",
        title: "Suma y resta de vectores",
        essential: [
          "Para sumar vectores se suman componentes correspondientes. Geométricamente, el segundo vector puede colocarse desde la punta del primero; la resultante va desde el origen inicial hasta la punta final.",
          "Restar B equivale a sumar el vector opuesto −B.",
        ],
        understand: [
          "La suma vectorial es conmutativa y asociativa. El orden de construcción puede cambiar el dibujo intermedio, pero no la resultante.",
          "Una resultante pequeña no significa que los vectores sean pequeños: pueden tener magnitudes grandes y sentidos casi opuestos.",
        ],
        deepen: [
          "El método por componentes funciona en cualquier dimensión y evita depender de la escala del dibujo. El diagrama sigue siendo útil para anticipar signos y dirección aproximada.",
        ],
        visualizations: ["vector-sum"],
      },
      {
        id: "producto-escalar-y-vectorial",
        title: "Producto escalar y producto vectorial",
        essential: [
          "El producto escalar A·B es un número que mide cuánto apunta un vector en la dirección del otro. Es cero cuando los vectores no nulos son perpendiculares.",
          "El producto vectorial A×B produce un vector perpendicular al plano de A y B. Su sentido se determina con la regla de la mano derecha.",
        ],
        understand: [
          "La magnitud AB cos θ del producto escalar puede verse como la magnitud de un vector multiplicada por la proyección del otro sobre su dirección.",
          "La magnitud AB sin θ del producto vectorial corresponde al área del paralelogramo formado por los vectores.",
        ],
        deepen: [
          "El producto escalar es conmutativo. El producto vectorial no: B×A = −(A×B). Si los vectores son paralelos, su producto vectorial es cero.",
        ],
        formulas: ["dot-product", "cross-product"],
        visualizations: ["dot-projection"],
      },
    ],
  },

  "movimiento-1d": {
    introduction:
      "La cinemática describe cómo cambia el movimiento sin explicar todavía qué interacción lo produce. Toda descripción requiere un sistema de referencia y una convención de signos.",
    errorTopics: ["cinematica"],
    sections: [
      {
        id: "referencia-y-posicion",
        title: "Sistema de referencia, posición y desplazamiento",
        essential: [
          "La posición x localiza un objeto respecto a un origen y un eje elegidos. El desplazamiento es Δx = x_f − x_i y depende solo de las posiciones inicial y final.",
          "La distancia recorrida mide la longitud total del camino y no puede ser negativa. Distancia y magnitud del desplazamiento coinciden únicamente en casos particulares.",
        ],
        understand: [
          "Una posición negativa solo indica que el objeto está en el lado negativo del origen. No informa hacia dónde se mueve.",
          "Cambiar el origen modifica las coordenadas de posición, pero no modifica el desplazamiento entre dos eventos si el eje conserva orientación y escala.",
        ],
        deepen: [
          "El sistema de referencia incluye origen, orientación, escala espacial y reloj. Las afirmaciones sobre movimiento deben entenderse respecto a ese sistema.",
        ],
        checks: [
          {
            question: "Un móvil está en x = −20 m. ¿Qué puede concluirse necesariamente?",
            answer:
              "Está 20 m en el lado negativo del origen. No puede deducirse el sentido de su velocidad ni su aceleración.",
          },
        ],
      },
      {
        id: "velocidad-y-rapidez",
        title: "Velocidad media, instantánea y rapidez",
        essential: [
          "La velocidad media es desplazamiento dividido por el intervalo de tiempo. Su signo indica el sentido del desplazamiento neto respecto al eje.",
          "La velocidad instantánea es la razón de cambio de la posición. La rapidez es la magnitud de la velocidad y nunca es negativa.",
        ],
        understand: [
          "En una gráfica x(t), la velocidad instantánea es la pendiente de la tangente. Una posición grande no implica una velocidad grande.",
          "Para un viaje de ida y regreso, la distancia puede ser grande mientras el desplazamiento —y por tanto la velocidad media— sea cero.",
        ],
        deepen: [
          "La derivada dx/dt surge como el límite de Δx/Δt cuando el intervalo temporal tiende a cero. Requiere que la función de posición sea diferenciable en el instante considerado.",
        ],
        formulas: ["average-velocity", "instantaneous-velocity"],
      },
      {
        id: "aceleracion-y-signos",
        title: "Aceleración media, instantánea y signos",
        essential: [
          "La aceleración indica cómo cambia la velocidad con el tiempo. Puede cambiar su magnitud, su dirección o ambas.",
          "Una aceleración negativa apunta hacia −x; no significa automáticamente que el objeto esté frenando.",
        ],
        understand: [
          "La rapidez aumenta cuando velocidad y aceleración tienen el mismo signo, y disminuye cuando tienen signos opuestos.",
          "En una gráfica v(t), la pendiente es la aceleración. En una gráfica a(t), el valor de la función es la aceleración, no su pendiente.",
        ],
        deepen: [
          "La aceleración instantánea es dv/dt y también la segunda derivada de la posición cuando x(t) es dos veces diferenciable.",
        ],
        formulas: ["average-acceleration", "instantaneous-acceleration"],
        checks: [
          {
            question: "Si v < 0 y a < 0, ¿qué ocurre con la rapidez?",
            answer:
              "Aumenta, porque velocidad y aceleración apuntan en el mismo sentido.",
          },
        ],
      },
      {
        id: "graficas-relacionadas",
        title: "Relaciones entre x(t), v(t) y a(t)",
        essential: [
          "La pendiente de x(t) es v(t), y la pendiente de v(t) es a(t). Estas relaciones conectan la forma de las tres gráficas.",
          "El área algebraica bajo v(t) representa desplazamiento; el área algebraica bajo a(t) representa cambio de velocidad. Las regiones bajo el eje aportan signo negativo.",
        ],
        understand: [
          "Derivar sigue los cambios locales: x(t) → v(t) → a(t). Integrar acumula cambios: a(t) → v(t) → x(t), junto con las condiciones iniciales.",
          "Una línea horizontal en x(t) indica reposo; una línea horizontal en v(t) indica velocidad constante, que no tiene que ser cero.",
        ],
        deepen: [
          "Las áreas son integrales definidas. Su interpretación física incluye signo y unidad: (m/s)·s produce m, mientras (m/s²)·s produce m/s.",
        ],
        visualizations: ["position-time", "velocity-time", "acceleration-time"],
      },
    ],
  },

  "ecuaciones-movimiento": {
    introduction:
      "Las ecuaciones cinemáticas expresan un modelo. Antes de usarlas hay que declarar sistema de referencia, intervalo y comportamiento de la aceleración.",
    errorTopics: ["aceleracion-constante", "caida-libre"],
    sections: [
      {
        id: "aceleracion-constante",
        title: "Modelo de aceleración constante",
        essential: [
          "Si la aceleración es constante durante el intervalo, la velocidad cambia linealmente y la posición cambia cuadráticamente con el tiempo.",
          "Las cuatro ecuaciones usuales son relaciones del mismo modelo; se elige una después de identificar datos, incógnita y condiciones, no por coincidencia superficial de símbolos.",
        ],
        understand: [
          "En v(t), la pendiente es a y el área algebraica es Δx. Cuando v cruza cero, el objeto cambia de sentido si la descripción continúa suavemente.",
          "La velocidad promedio (v₀+v)/2 solo puede usarse de esta forma cuando la aceleración es constante.",
        ],
        deepen: [
          "Integrar a constante produce v = v₀+at. Integrar esa velocidad desde la condición inicial produce x = x₀+v₀t+½at². Las otras relaciones se obtienen eliminando t o usando el promedio lineal de velocidades.",
        ],
        formulas: [
          "constant-velocity",
          "constant-position",
          "constant-no-time",
          "constant-average-displacement",
        ],
        visualizations: ["constant-acceleration"],
      },
      {
        id: "cambio-de-sentido",
        title: "Cambio de sentido y lectura por intervalos",
        essential: [
          "Un cambio de sentido ocurre cuando la velocidad cambia de signo. El instante v = 0 separa dos intervalos de movimiento, pero la aceleración puede seguir siendo distinta de cero.",
          "El desplazamiento suma contribuciones con signo; la distancia suma longitudes y por eso exige separar los intervalos cuando hay retorno.",
        ],
        understand: [
          "Una aceleración opuesta a la velocidad reduce la rapidez hasta el reposo instantáneo. Si la aceleración continúa, después aumenta la rapidez en el sentido contrario.",
        ],
        deepen: [
          "Para calcular distancia desde v(t), deben localizarse sus ceros y sumar el valor absoluto del desplazamiento en cada intervalo. Integrar |v(t)| produce distancia recorrida.",
        ],
      },
      {
        id: "caida-libre",
        title: "Caída libre como modelo",
        essential: [
          "En el modelo introductorio de caída libre se desprecia la resistencia del aire, se aproxima g como constante y se estudia una región próxima a la superficie terrestre.",
          "g ≈ 9,8 m/s² es la magnitud local aproximada. Si +y apunta hacia arriba, aᵧ = −g. El signo proviene del eje, no del símbolo g.",
        ],
        understand: [
          "En la altura máxima de un lanzamiento vertical, vᵧ = 0 pero aᵧ = −g. La gravedad actúa durante el ascenso, en el punto más alto y durante el descenso.",
          "Las simetrías de tiempo o rapidez solo se aplican entre puntos de la misma altura bajo las mismas condiciones del modelo.",
        ],
        deepen: [
          "El cuerpo puede tratarse como partícula cuando su tamaño y rotación no son relevantes para la pregunta. Si la resistencia del aire importa, la aceleración ya no es constante ni necesariamente igual para ascenso y descenso.",
        ],
        checks: [
          {
            question: "En el punto más alto de un lanzamiento vertical ideal, ¿cuáles son vᵧ y aᵧ si +y apunta hacia arriba?",
            answer: "vᵧ = 0 y aᵧ = −g.",
          },
        ],
        visualizations: ["free-fall-position", "free-fall-velocity"],
      },
      {
        id: "integracion",
        title: "Aceleración no constante e integración",
        essential: [
          "Cuando a cambia con el tiempo, las ecuaciones de aceleración constante no son válidas. La velocidad se obtiene acumulando a(t) y la posición acumulando v(t).",
          "Las condiciones iniciales fijan qué movimiento particular corresponde a esas funciones.",
        ],
        understand: [
          "La integral de a(t) entre dos instantes es Δv, no necesariamente la velocidad final. Hay que sumar la velocidad inicial.",
          "De manera análoga, la integral de v(t) es desplazamiento y se suma a la posición inicial para obtener x(t).",
        ],
        deepen: [
          "Si la aceleración depende de posición o velocidad, puede ser necesario cambiar variables o resolver una ecuación diferencial. En esta unidad se establece la relación conceptual sin construir todavía un método general de solución.",
        ],
        formulas: ["integrated-velocity", "integrated-position"],
      },
    ],
  },

  "movimiento-2d": {
    introduction:
      "En dos y tres dimensiones, posición, velocidad y aceleración son vectores. Las componentes cartesianas se relacionan mediante un mismo tiempo.",
    errorTopics: ["proyectiles"],
    sections: [
      {
        id: "posicion-velocidad-aceleracion",
        title: "Vectores de posición, velocidad y aceleración",
        essential: [
          "El vector posición r(t) localiza la partícula. La velocidad v = dr/dt es tangente a la trayectoria y la aceleración a = dv/dt describe el cambio del vector velocidad.",
          "Cada componente puede derivarse por separado en una base cartesiana fija.",
        ],
        understand: [
          "Una trayectoria curva puede tener rapidez constante y aun así tener aceleración, porque cambia la dirección de la velocidad.",
          "Las componentes x, y y z no corresponden a movimientos con tiempos distintos: describen el mismo evento y comparten t.",
        ],
        deepen: [
          "La derivación componente a componente supone que los vectores unitarios cartesianos son constantes. En bases móviles, como la polar, también hay que derivar los vectores unitarios.",
        ],
        formulas: ["position-vector", "velocity-vector", "acceleration-vector"],
      },
      {
        id: "componentes-de-trayectoria",
        title: "Componentes paralela y perpendicular",
        essential: [
          "La componente paralela de la aceleración cambia la rapidez. La componente perpendicular cambia la dirección de la velocidad.",
          "Una aceleración puramente perpendicular puede curvar la trayectoria sin cambiar la rapidez instantánea.",
        ],
        understand: [
          "Esta descomposición sigue la trayectoria y no tiene que coincidir con los ejes x e y. Resulta especialmente útil en movimiento circular.",
        ],
        deepen: [
          "Para rapidez no nula, la aceleración tangencial tiene magnitud dv/dt y la normal tiene magnitud v²/ρ, donde ρ es el radio local de curvatura.",
        ],
      },
      {
        id: "proyectiles",
        title: "Movimiento de proyectiles",
        essential: [
          "En el modelo sin resistencia del aire y con g aproximadamente constante, aₓ = 0 y aᵧ = −g cuando +y apunta hacia arriba.",
          "El movimiento horizontal tiene velocidad constante y el vertical tiene aceleración constante; ambos comparten el mismo tiempo.",
        ],
        understand: [
          "En el punto más alto, la componente vertical de la velocidad es cero, pero la velocidad horizontal puede ser distinta de cero y la aceleración sigue apuntando hacia abajo.",
          "La forma parabólica resulta de combinar x lineal en t con y cuadrática en t bajo estas condiciones.",
        ],
        deepen: [
          "Las fórmulas de alcance o tiempo de vuelo que suponen alturas inicial y final iguales no deben aplicarse a lanzamientos entre alturas diferentes.",
        ],
        formulas: ["projectile-acceleration", "projectile-position"],
        visualizations: ["projectile-motion"],
        checks: [
          {
            question: "En el punto más alto de un proyectil ideal, ¿la velocidad total es necesariamente cero?",
            answer:
              "No. La componente vertical es cero, pero la componente horizontal permanece constante en el modelo ideal.",
          },
        ],
      },
    ],
  },

  "circular-relativo": {
    introduction:
      "El movimiento circular muestra que rapidez y velocidad no son equivalentes. La velocidad relativa obliga además a nombrar con precisión el marco desde el cual se observa.",
    errorTopics: ["circular", "velocidad-relativa"],
    sections: [
      {
        id: "movimiento-circular",
        title: "Movimiento circular y aceleración radial",
        essential: [
          "En una circunferencia, la velocidad instantánea es tangente a la trayectoria. La aceleración radial o centrípeta apunta hacia el centro.",
          "Con rapidez constante, la velocidad no es constante porque su dirección cambia continuamente.",
        ],
        understand: [
          "La aceleración centrípeta no es una fuerza nueva. Es el nombre de la componente radial de la aceleración; las fuerzas responsables se estudiarán dinámicamente más adelante.",
          "Cuanto mayor es la rapidez o menor el radio, mayor es la aceleración necesaria para cambiar la dirección.",
        ],
        deepen: [
          "La aceleración radial vectorial puede escribirse a_r = −(v²/R) r̂. El signo negativo indica que apunta en sentido opuesto al unitario radial saliente.",
        ],
        formulas: ["circular-speed", "centripetal-acceleration"],
        visualizations: ["circular-motion"],
        checks: [
          {
            question: "Una partícula se mueve en una circunferencia con rapidez constante. ¿Tiene aceleración?",
            answer:
              "Sí. La dirección de su velocidad cambia continuamente y existe aceleración hacia el centro.",
          },
        ],
      },
      {
        id: "rapidez-variable",
        title: "Movimiento circular con rapidez variable",
        essential: [
          "Si la rapidez cambia, la aceleración tiene una componente tangencial además de la radial.",
          "La componente tangencial cambia la rapidez; la radial cambia la dirección.",
        ],
        understand: [
          "La aceleración total es la suma vectorial de dos componentes perpendiculares. Ninguna reemplaza a la otra.",
        ],
        deepen: [
          "En una circunferencia de radio fijo, a_t = dv/dt y a_r = v²/R. La magnitud total es la raíz de la suma de sus cuadrados.",
        ],
      },
      {
        id: "velocidad-relativa",
        title: "Velocidad relativa y marcos de referencia",
        essential: [
          "v_A/B significa velocidad de A medida desde B. El orden de los subíndices forma parte de la definición.",
          "La composición v_A/C = v_A/B + v_B/C conecta tres marcos identificados explícitamente.",
        ],
        understand: [
          "Antes de sumar velocidades hay que dibujar o nombrar qué objeto observa a cuál. Cambiar el orden invierte el signo: v_B/A = −v_A/B.",
          "En la aproximación clásica de esta unidad, el tiempo se considera común a los marcos y las velocidades se suman vectorialmente.",
        ],
        deepen: [
          "La relación de composición es válida para marcos clásicos. A velocidades comparables con la luz se requiere otra transformación, fuera del alcance de esta unidad.",
        ],
        formulas: ["relative-velocity"],
        visualizations: ["relative-velocity"],
      },
    ],
  },

  "coordenadas-polares": {
    introduction:
      "Esta ampliación presenta una base móvil útil para trayectorias con geometría radial. Complementa el alcance curricular sin desplazar la prioridad de los temas desarrollados explícitamente en las sesiones 2–6.",
    errorTopics: ["coordenadas-polares"],
    sections: [
      {
        id: "base-polar",
        title: "Coordenadas r y θ y base móvil",
        essential: [
          "Una posición plana puede describirse mediante la distancia radial r y el ángulo θ medido desde un eje de referencia.",
          "r̂ apunta radialmente hacia afuera y θ̂ es perpendicular a r̂ en el sentido de aumento de θ.",
        ],
        understand: [
          "A diferencia de i y j, los unitarios polares cambian de dirección cuando cambia θ. Aunque sus magnitudes permanecen iguales a uno, sus derivadas no son cero.",
        ],
        deepen: [
          "Las relaciones dr̂/dt = θ̇ θ̂ y dθ̂/dt = −θ̇ r̂ explican los términos adicionales que aparecen al derivar posición y velocidad.",
        ],
        visualizations: ["polar-basis"],
      },
      {
        id: "velocidad-polar",
        title: "Velocidad en coordenadas polares",
        essential: [
          "La velocidad combina cambio radial y cambio angular: una parte sigue r̂ y otra sigue θ̂.",
        ],
        understand: [
          "ṙ mide qué tan rápido cambia la distancia al origen. rθ̇ es la rapidez transversal debida al giro.",
        ],
        deepen: [
          "La expresión se obtiene derivando r = r r̂ y usando que r̂ cambia con θ. Por eso no basta con derivar únicamente la coordenada r.",
        ],
        formulas: ["polar-velocity"],
      },
      {
        id: "aceleracion-polar",
        title: "Aceleración polar y relación con movimiento circular",
        essential: [
          "La aceleración polar tiene componentes radial y transversal. Ambas pueden recibir contribuciones de más de un tipo de cambio.",
        ],
        understand: [
          "Para un círculo de radio constante y rapidez constante quedan ṙ = r̈ = θ̈ = 0. La componente radial se reduce a −rθ̇² r̂, dirigida hacia el centro.",
        ],
        deepen: [
          "La componente transversal contiene rθ̈ y 2ṙθ̇. El segundo término aparece cuando cambian simultáneamente la distancia radial y el ángulo.",
        ],
        formulas: ["polar-acceleration"],
        explore: [
          "La base polar es un ejemplo de coordenadas curvilíneas. Su utilidad depende de que la geometría del problema haga más simple la descripción que una base cartesiana fija.",
        ],
      },
    ],
  },
};
