import type { QA } from './faq';

export type Example = { name: string; specs: string[] };

export type Vertical = {
  slug: 'maquinaria' | 'packaging' | 'mobiliario';
  rubro: string; // form select value
  label: string; // short name for nav and cards
  title: string; // <title>
  description: string; // meta description
  h1: string;
  sub: string;
  searchFee: number;
  intro: string;
  examples: Example[];
  checklist: string[];
  note?: string;
  faq: QA[];
  waText: string;
  specPlaceholder: string;
  keywords: string[];
  serviceName: string;
};

export const VERTICALS: Vertical[] = [
  {
    slug: 'maquinaria',
    rubro: 'maquinaria',
    label: 'Maquinaria y equipos',
    title: 'Maquinaria de China para pymes argentinas | Dos Deltas',
    description:
      'Cotizaciones comparables de maquinaria de fábricas verificadas del sur de China: 220/380 V, 50 Hz, repuestos y costo puesto en Argentina. Sin comisiones de fábrica.',
    h1: 'Maquinaria de China para tu planta, con especificaciones que sirvan en Argentina.',
    sub: '220/380 V, 50 Hz, repuestos y manuales en español: lo verifico antes de que pagues.',
    searchFee: 500,
    intro:
      'Una máquina mal especificada se paga dos veces: en la compra y en la planta. Comparo 2 a 4 fábricas con la misma ficha técnica, verifico tensión, frecuencia, materiales y repuestos, y te muestro el costo estimado puesto en tu depósito.',
    examples: [
      {
        name: 'Envasadora vertical para polvos y granos',
        specs: ['10 a 60 bolsas/min', 'Dosificador a tornillo o multicabezal', '220 V monofásica o 380 V trifásica, 50 Hz'],
      },
      {
        name: 'Llenadora y tapadora de líquidos',
        specs: ['4 a 12 picos', '500 a 3.000 botellas/h', 'Acero inoxidable 304 o 316, PLC en español'],
      },
      {
        name: 'Inyectora de plástico',
        specs: ['80 a 450 t de cierre', 'Servomotor, consumo en kWh/kg', 'Molde cotizado aparte'],
      },
      {
        name: 'Router CNC y corte láser de fibra',
        specs: ['Mesa de 1.300 × 2.500 mm', '1,5 a 6 kW', 'Control, software y extracción incluidos'],
      },
      {
        name: 'Equipos para alimentos',
        specs: ['Amasadoras, laminadoras, hornos rotativos', 'Acero inoxidable', 'Gas natural o GLP de Argentina, 380 V'],
      },
      {
        name: 'Maquinaria textil',
        specs: ['Bordadoras multicabezal', 'Rectas y overlock industriales', 'Cortadoras automáticas'],
      },
    ],
    checklist: [
      'Qué producto vas a procesar, con fotos o una muestra',
      'Capacidad objetivo (unidades por hora o por turno)',
      'Tensión y fases disponibles en tu planta',
      'Espacio disponible y planos del sector, si los tenés',
      'Nivel de automatización que buscás',
      'Normas o certificados que te piden (IEC, CE, etc.)',
      'Repuestos, manuales y soporte que necesitás',
      'Presupuesto aproximado',
    ],
    faq: [
      {
        q: '¿Cómo me aseguro de que la máquina funcione con la red eléctrica argentina?',
        a: 'Pido la ficha técnica con tensión, fases y frecuencia (220/380 V, 50 Hz) por escrito en la proforma, y lo verifico en la inspección antes del embarque. Muchas máquinas para el mercado chino salen a 380 V, 50 Hz, pero los motores y el tablero se confirman uno por uno.',
      },
      {
        q: '¿Qué pasa con los repuestos?',
        a: 'Pido a cada fábrica una lista de repuestos de desgaste con precio, y la cotización compara qué incluye cada una. Para el primer pedido recomiendo comprar un kit de repuestos junto con la máquina.',
      },
      {
        q: '¿Puedo pagar anticipo en maquinaria?',
        a: 'Los bienes de capital tienen una ventana del BCRA para pagar hasta 30 % FOB antes del embarque. Lo confirmás con tu banco según la posición arancelaria; yo negocio que el resto se pague contra inspección y documentos.',
      },
      {
        q: '¿Visitás la fábrica?',
        a: 'En maquinaria, sí, cuando el pedido lo justifica: estoy en el sur de China, cerca de las fábricas. Si no, hago una videollamada en planta con la máquina funcionando.',
      },
      {
        q: '¿Hay prueba de la máquina antes del embarque?',
        a: 'Sí. Pido una prueba en fábrica (FAT) con tu producto o un material equivalente, filmada, antes de liberar el saldo.',
      },
    ],
    waText: 'Hola Octa, quiero cotizar una máquina: ',
    specPlaceholder:
      'Ej.: envasadora para yerba en paquetes de 500 g y 1 kg, 30 paquetes/min, 380 V trifásica, film laminado.',
    keywords: ['importar maquinaria de China', 'comprar maquinaria en China'],
    serviceName: 'Búsqueda y compra de maquinaria en el sur de China',
  },
  {
    slug: 'packaging',
    rubro: 'packaging',
    label: 'Envases y packaging',
    title: 'Packaging personalizado de China para pymes | Dos Deltas',
    description:
      'Cotizaciones comparables de cajas, bolsas, frascos y etiquetas de fábricas verificadas del sur de China, con costo puesto en Argentina. Sin comisiones de fábrica.',
    h1: 'Packaging personalizado de fábricas del sur de China, comparado y controlado.',
    sub: 'Cajas, bolsas, frascos y etiquetas con tu marca: color, medidas y materiales verificados antes del saldo.',
    searchFee: 300,
    intro:
      'En packaging lo difícil no es encontrar fábrica, es que lo que llega sea igual a la muestra. Comparo 2 a 4 fábricas con el mismo arte y la misma especificación, controlo prueba de color y medidas, y te muestro el costo estimado puesto en tu depósito.',
    examples: [
      { name: 'Cajas de cartón microcorrugado impresas', specs: ['Offset a 4 colores o Pantone', 'Troquel a medida', 'Laminado mate o brillante'] },
      { name: 'Cajas rígidas premium', specs: ['Cierre con imán', 'Hot stamping y relieve', 'Interior con calce'] },
      { name: 'Bolsas de papel kraft impresas', specs: ['Manija plana o retorcida', '120 a 250 g/m²', 'Desde 5.000 unidades'] },
      { name: 'Frascos y botellas para cosmética y limpieza', specs: ['PET, PE o vidrio', 'Tapas, gatillos y válvulas', 'Uso no alimentario'] },
      { name: 'Etiquetas autoadhesivas en bobina', specs: ['Papel o film', 'Para etiquetadora automática', 'Core y diámetro a pedido'] },
      { name: 'Exhibidores de cartón para punto de venta', specs: ['De piso o de mostrador', 'Envío plano', 'Impresión a 4 colores'] },
    ],
    checklist: [
      'Medidas internas y peso del producto',
      'Material y gramaje (o una muestra de referencia)',
      'Impresión: colores, Pantone, terminaciones',
      'Arte en PDF o AI, si ya lo tenés',
      'Cantidad por modelo y por año',
      'Cómo lo vas a llenar o armar (manual o automático)',
      'Embalaje para el transporte',
    ],
    note:
      'Por ahora no cotizo envases en contacto directo con alimentos, porque requieren aprobación de INAL o ANMAT antes de la importación.',
    faq: [
      {
        q: '¿Cómo controlo que el color salga igual?',
        a: 'Pido prueba de color física contra el Pantone y fotos con luz estándar antes de la producción, y lo vuelvo a medir en la inspección.',
      },
      {
        q: '¿Cuál es la cantidad mínima?',
        a: 'Depende del material: en cajas impresas suele ser de 1.000 a 3.000 unidades por modelo; en bolsas, de 5.000. Igual el pedido total tiene que llegar a USD 10.000; podés juntar varios modelos.',
      },
      {
        q: '¿Hacen el diseño?',
        a: 'No. Trabajo con tu arte. Si no tenés, la fábrica puede adaptar un troquel estándar y te mando el plano para que tu diseñador lo complete.',
      },
      {
        q: '¿Cotizás envases para alimentos?',
        a: 'Todavía no: los envases en contacto con alimentos necesitan aprobación de INAL o ANMAT. Las cajas exteriores, bolsas de transporte y etiquetas sí.',
      },
      {
        q: '¿Puedo pedir muestras antes?',
        a: 'Sí, y lo recomiendo. Las muestras con tu impresión se cobran aparte y suelen llegar por courier en 10 a 15 días.',
      },
    ],
    waText: 'Hola Octa, quiero cotizar packaging: ',
    specPlaceholder: 'Ej.: caja de microcorrugado 20 × 15 × 8 cm, impresa a 4 colores, laminado mate, 5.000 unidades.',
    keywords: ['fabricante de envases en China', 'packaging personalizado China'],
    serviceName: 'Búsqueda y compra de packaging personalizado en el sur de China',
  },
  {
    slug: 'mobiliario',
    rubro: 'mobiliario',
    label: 'Mobiliario comercial',
    title: 'Mobiliario comercial de China para tu proyecto | Dos Deltas',
    description:
      'Muebles y equipamiento para hoteles, gastronomía, retail y oficinas, cotizados en fábricas verificadas del sur de China, con costo puesto en Argentina. Sin comisiones.',
    h1: 'Mobiliario y equipamiento comercial de China, para tu hotel, local u oficina.',
    sub: 'Cotizo tu proyecto completo con fábricas especializadas y controlo terminaciones antes del embarque.',
    searchFee: 300,
    intro:
      'El sur de China concentra la mayor oferta de muebles del mundo. Comparo 2 a 4 fábricas sobre tu listado de ítems, verifico materiales y terminaciones en persona, y te muestro el costo estimado puesto en obra.',
    examples: [
      { name: 'Sillas y mesas para gastronomía', specs: ['Estructura metálica o madera', 'Tapas HPL o madera maciza', 'Uso comercial intensivo'] },
      { name: 'Mobiliario para habitaciones de hotel', specs: ['Paquete completo por habitación', 'Cabeceros, placares, escritorios', 'Terminaciones a muestra'] },
      { name: 'Góndolas y exhibidores para retail', specs: ['Metal y melamina', 'Modulares', 'Iluminación integrada'] },
      { name: 'Puestos de trabajo y sillas de oficina', specs: ['Escritorios en bench', 'Sillas ergonómicas', 'Envío desarmado'] },
      { name: 'Mostradores y barras a medida', specs: ['Según planos', 'Mármol sinterizado o madera', 'Herrajes incluidos'] },
      { name: 'Revestimientos y terminaciones del proyecto', specs: ['Porcelanato y piedra sinterizada', 'Paneles decorativos', 'Griferías'] },
    ],
    checklist: [
      'Planos, renders o fotos de referencia',
      'Listado de ítems con cantidades',
      'Materiales y terminaciones (muestras si las tenés)',
      'Uso: tránsito comercial, exterior, ignífugo',
      'Fecha de apertura o de entrega en obra',
      'Armado: desarmado (KD) o armado de fábrica',
    ],
    faq: [
      {
        q: '¿Puedo ver las terminaciones antes de producir?',
        a: 'Sí. Pido muestras de materiales y, para el primer pedido, una pieza de muestra de los ítems principales. Las fotografío en la fábrica o te las envío por courier.',
      },
      {
        q: '¿Conviene traer los muebles armados?',
        a: 'Desarmados (KD) ocupan mucho menos en el contenedor y bajan el flete. Para sillas y mesas suele convenir; para placares o mostradores a medida, depende del armado local.',
      },
      {
        q: '¿Cuánto entra en un contenedor?',
        a: 'Lo calcula la fábrica con el packing list. Como referencia, un contenedor de 40 pies equipa entre 15 y 30 habitaciones de hotel según el programa.',
      },
      {
        q: '¿Puedo combinar varias fábricas en un envío?',
        a: 'Sí. Coordino que las fábricas entreguen en un depósito de consolidación, y tu forwarder lo embarca en un solo contenedor.',
      },
      {
        q: '¿Cuánto tarda un proyecto completo?',
        a: 'Cotización en unos 10 días hábiles, muestras 2 a 3 semanas, producción 30 a 45 días y tránsito a Buenos Aires unos 40 a 50 días. Planificá 4 a 5 meses antes de la apertura.',
      },
    ],
    waText: 'Hola Octa, quiero cotizar mobiliario para un proyecto: ',
    specPlaceholder: 'Ej.: 40 sillas y 12 mesas para restaurante, estructura metálica negra, tapas de madera maciza 70 × 70 cm.',
    keywords: ['muebles de China para hoteles', 'mobiliario comercial China'],
    serviceName: 'Búsqueda y compra de mobiliario comercial en China',
  },
];

export const RUBROS = [
  ...VERTICALS.map((v) => ({ value: v.rubro, label: v.label, placeholder: v.specPlaceholder })),
  { value: 'otro', label: 'Otro', placeholder: 'Contame qué producto es, medidas, materiales y cantidad.' },
];

export const getVertical = (slug: string) => VERTICALS.find((v) => v.slug === slug);
