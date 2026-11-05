import { TERMS } from '../config';
import { fmtUSD } from '../lib/format.js';

export type QA = { q: string; a: string };

const fee = `${fmtUSD(TERMS.searchFee)} (${fmtUSD(TERMS.searchFeeMachinery)} en maquinaria)`;

export const FAQ_GENERAL: QA[] = [
  {
    q: '¿Cuánto cobrás?',
    a: `Dos partes, acordadas por escrito. Búsqueda: tarifa fija de ${fee} por ${TERMS.quotesMin} a ${TERMS.quotesMax} cotizaciones comparadas; se descuenta del honorario si hacés el pedido conmigo dentro de los ${TERMS.creditDays} días. Ejecución: ${TERMS.execMin} a ${TERMS.execMax} % del valor del pedido (mínimo ${fmtUSD(TERMS.execFloor)}), mitad con la orden de compra y mitad cuando aprueba la inspección. No cobro comisiones a las fábricas.`,
  },
  {
    q: '¿Hay pedido mínimo?',
    a: `Sí: ${fmtUSD(TERMS.minOrder)} por pedido. Por debajo de ese monto mi trabajo te cuesta más de lo que te ahorra; para compras chicas te conviene Alibaba con Trade Assurance, y te digo cómo usarlo bien.`,
  },
  {
    q: '¿Ustedes importan por mí?',
    a: 'No. El despacho y el flete los manejás vos con tu despachante y tu forwarder. Yo te paso la documentación de la fábrica lista (factura comercial, packing list, certificados) y, si no tenés despachante, te recomiendo opciones.',
  },
  {
    q: '¿Cómo le pago a la fábrica y qué pasa con el anticipo?',
    a: 'Le pagás directo a la cuenta corporativa verificada de la fábrica; yo nunca recibo el dinero de tu mercadería. Las fábricas chinas suelen pedir 30 % de anticipo antes de producir, y el BCRA todavía restringe los pagos antes del embarque (salvo hasta 30 % FOB en bienes de capital). Negocio condiciones que tu banco pueda cursar: pago contra documentos de embarque, anticipo atado a un hito de inspección o carta de crédito, según el caso.',
  },
  {
    q: '¿Qué pasa si la mercadería llega mal?',
    a: 'El saldo se paga después de una inspección previa al embarque, hecha por mí o por una empresa de inspección independiente, con informe y fotos. Si la inspección encuentra defectos, la fábrica corrige antes de cobrar. No doy garantías sobre el producto: lo que hago es que no pagues el saldo a ciegas.',
  },
  {
    q: '¿Necesito estar inscripto como importador?',
    a: 'Para el régimen general, sí: tu empresa tiene que ser Responsable Inscripto o sociedad (SRL o SA) y estar dada de alta en los Registros Especiales Aduaneros de ARCA. Los monotributistas no pueden importar por régimen general. Por courier se puede hasta USD 3.000 FOB y 50 kg por envío.',
  },
  {
    q: '¿Mis diseños quedan protegidos?',
    a: 'Firmamos un acuerdo de confidencialidad antes de que me mandes planos o artes, y pido a las fábricas un NNN (no uso, no divulgación, no elusión) cuando el producto es propio.',
  },
  {
    q: '¿En qué rubros trabajás?',
    a: 'Maquinaria y equipos productivos, envases y packaging personalizado, y mobiliario y equipamiento comercial. Son los rubros donde el sur de China es fuerte y donde una comparación técnica cambia la decisión. Si tu producto es otro, contámelo y te digo con honestidad si puedo ayudarte.',
  },
  {
    q: '¿Cuánto tarda?',
    a: `Las cotizaciones comparadas llegan en unos ${TERMS.turnaroundDays} días hábiles desde que cerramos las especificaciones. Producción y embarque dependen del producto: de 25 a 60 días para la mayoría de los pedidos, más en maquinaria a medida.`,
  },
  {
    q: '¿Por qué no voy directo a Alibaba?',
    a: 'Podés, y para pedidos chicos te lo recomiendo. En pedidos grandes el problema es que muchos vendedores son revendedores, cada uno cotiza otra cosa y no tenés a nadie en planta antes de pagar el saldo. Yo comparo fábricas con las mismas especificaciones, las verifico y controlo antes del embarque.',
  },
  {
    q: '¿Y si después voy directo a la fábrica?',
    a: 'Es tu derecho comprar donde quieras. Por eso la búsqueda tiene una tarifa fija: me pagás por el trabajo de encontrar y comparar, no por un dato. Las cotizaciones llegan con el perfil, la auditoría y las fotos de cada fábrica; el nombre y el contacto se comparten cuando avanzamos con la ejecución, bajo un acuerdo de no elusión.',
  },
];
