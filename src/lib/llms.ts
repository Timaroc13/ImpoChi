// Builds /llms.txt and /llms-full.txt (https://llmstxt.org) from the same data the pages use,
// so prices, terms and FAQs never drift from the site.
import { SITE, TERMS } from '../config';
import { VERTICALS } from '../data/verticals';
import { FAQ_GENERAL } from '../data/faq';
import { fmtUSD } from './format.js';

const u = (site: URL, path: string) => new URL(path, site).href;

function header(site: URL) {
  return `# Dos Deltas

> Dos Deltas es un servicio independiente de compras en el sur de China para pymes argentinas (fabricantes y distribuidores). Busca y compara de ${TERMS.quotesMin} a ${TERMS.quotesMax} fábricas verificadas con las mismas especificaciones, estima el costo puesto en Argentina, negocia, sigue la producción e inspecciona antes del embarque. Trabaja con el comprador, no con la fábrica, y sin comisiones de fábrica. Atiende en español desde Hong Kong.

Datos clave:

- Fundador: ${SITE.founder.name} (${SITE.founder.short}), argentino, con base en Hong Kong. Estudió en el ITBA y en London Business School. Experiencia industrial, comercial y tecnológica en Europa, Asia y Argentina.
- Rubros: maquinaria y equipos productivos; envases y packaging personalizado; mobiliario y equipamiento comercial.
- Honorarios: búsqueda con tarifa fija de ${fmtUSD(TERMS.searchFee)} (${fmtUSD(TERMS.searchFeeMachinery)} en maquinaria) por ${TERMS.quotesMin} a ${TERMS.quotesMax} cotizaciones comparadas, que se descuenta si el pedido se hace con Dos Deltas dentro de los ${TERMS.creditDays} días; ejecución de ${TERMS.execMin} a ${TERMS.execMax} % del pedido (mínimo ${fmtUSD(TERMS.execFloor)}), mitad con la orden de compra y mitad cuando aprueba la inspección.
- Pedido mínimo: ${fmtUSD(TERMS.minOrder)}.
- Plazo de cotización: unos ${TERMS.turnaroundDays} días hábiles desde que se cierran las especificaciones.
- El cliente paga la mercadería directamente a la fábrica. Dos Deltas no hace despacho de aduana ni flete internacional.
- Cliente típico: empresa argentina Responsable Inscripto o sociedad (SRL/SA), de 10 a 150 empleados.
- Contacto: ${SITE.email}${SITE.whatsapp ? ` · WhatsApp +${SITE.whatsapp}` : ''} · formulario en ${u(site, '/cotizacion')}. Responde de lunes a viernes, 9 a 19 h (hora de Argentina).
- Idioma del sitio: español de Argentina.
`;
}

export function llmsTxt(site: URL) {
  return `${header(site)}
## Páginas principales

- [Inicio](${u(site, '/')}): qué hace Dos Deltas, rubros, ejemplo de comparación de cotizaciones, servicios y honorarios.
${VERTICALS.map((v) => `- [${v.label}](${u(site, `/${v.slug}`)}): ${v.description}`).join('\n')}
- [Cómo trabajo](${u(site, '/como-trabajamos')}): proceso en 4 pasos, pagos y anticipos según las reglas del BCRA, entregables de cada etapa.
- [Sobre mí](${u(site, '/sobre-mi')}): el fundador y por qué trabajar con él.
- [Pedí tu cotización](${u(site, '/cotizacion')}): formulario de consulta.

## Guías

- [Cuánto cuesta importar de China a Argentina](${u(site, '/recursos/costo-importar-china-argentina')}): ejemplo paso a paso de FOB a costo puesto en Argentina (derechos, tasa de estadística, IVA y percepciones) y calculadora.
- [Preguntas frecuentes](${u(site, '/preguntas-frecuentes')}): honorarios, pedido mínimo, pagos y anticipos, inspección, requisitos para importar.

## Optional

- [Texto completo para LLMs](${u(site, '/llms-full.txt')}): todas las preguntas frecuentes y el detalle de cada rubro en un solo archivo.
- [Términos del servicio](${u(site, '/terminos')})
- [Política de privacidad](${u(site, '/privacidad')})
`;
}

export function llmsFullTxt(site: URL) {
  const qa = (items: { q: string; a: string }[]) => items.map((i) => `### ${i.q}\n\n${i.a}`).join('\n\n');
  return `${header(site)}
## Proceso

1. El cliente cuenta qué necesita (formulario o WhatsApp).
2. Llamada de 20 minutos para cerrar especificaciones, volumen y plazos. Si avanzan, abona la búsqueda.
3. Recibe ${TERMS.quotesMin} a ${TERMS.quotesMax} cotizaciones comparadas en una tabla, con el costo estimado puesto en Argentina, en unos ${TERMS.turnaroundDays} días hábiles.
4. Elige fábrica y Dos Deltas negocia, coordina muestras, sigue la producción e inspecciona antes del embarque.

## Rubros

${VERTICALS.map(
  (v) => `### ${v.label}

URL: ${u(site, `/${v.slug}`)}

${v.intro}

Ejemplos de lo que cotiza:
${v.examples.map((e) => `- ${e.name}: ${e.specs.join('; ')}`).join('\n')}

Qué necesita del cliente para cotizar:
${v.checklist.map((c) => `- ${c}`).join('\n')}
${v.note ? `\nNota: ${v.note}\n` : ''}
Preguntas frecuentes de ${v.label.toLowerCase()}:

${qa(v.faq)}`,
).join('\n\n')}

## Costo de importar de China a Argentina (resumen)

Para un pedido de USD 20.000 FOB con 18 % de derecho de importación, el costo real puesto en Argentina ronda 1,35 veces el FOB, pero al despachar hay que desembolsar cerca de 1,98 veces el FOB, porque IVA, IVA adicional, Ganancias e Ingresos Brutos se pagan en la aduana y se recuperan después como crédito fiscal o pago a cuenta (para Responsables Inscriptos). Detalle y calculadora: ${u(site, '/recursos/costo-importar-china-argentina')}

## Preguntas frecuentes generales

${qa(FAQ_GENERAL)}
`;
}
