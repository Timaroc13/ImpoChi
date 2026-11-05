import { SITE, TERMS } from '../config';
import type { QA } from '../data/faq';

const base = (site: URL) => site.href.replace(/\/$/, '');

export const orgSchema = (site: URL) => ({
  '@type': 'Organization',
  '@id': `${base(site)}/#org`,
  name: 'Dos Deltas',
  alternateName: SITE.hk.company || undefined,
  url: base(site),
  logo: `${base(site)}/brand/dos-deltas-mark-color.svg`,
  email: SITE.email,
  description: SITE.vp,
  areaServed: { '@type': 'Country', name: 'Argentina' },
  address: { '@type': 'PostalAddress', addressRegion: 'Hong Kong', addressCountry: 'HK', streetAddress: SITE.hk.address || undefined },
  founder: { '@id': `${base(site)}/#founder` },
});

export const personSchema = (site: URL) => ({
  '@type': 'Person',
  '@id': `${base(site)}/#founder`,
  name: SITE.founder.name,
  alternateName: SITE.founder.short,
  nationality: 'Argentina',
  homeLocation: { '@type': 'Place', name: 'Hong Kong' },
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Instituto Tecnológico de Buenos Aires (ITBA)' },
    { '@type': 'CollegeOrUniversity', name: 'London Business School' },
  ],
  sameAs: SITE.founder.linkedin ? [SITE.founder.linkedin] : undefined,
  worksFor: { '@id': `${base(site)}/#org` },
  image: SITE.founder.photo ? new URL(SITE.founder.photo, site).href : undefined,
});

export const serviceSchema = (site: URL, name: string, path: string, searchFee: number = TERMS.searchFee) => ({
  '@type': 'Service',
  name,
  serviceType: 'Sourcing en China',
  url: `${base(site)}${path}`,
  provider: { '@id': `${base(site)}/#org` },
  areaServed: { '@type': 'Country', name: 'Argentina' },
  offers: {
    '@type': 'Offer',
    name: 'Búsqueda: 2 a 4 cotizaciones comparables',
    price: searchFee,
    priceCurrency: 'USD',
  },
});

export const faqSchema = (items: QA[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((it) => ({
    '@type': 'Question',
    name: it.q,
    acceptedAnswer: { '@type': 'Answer', text: it.a },
  })),
});
