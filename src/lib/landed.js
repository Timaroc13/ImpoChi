/**
 * Landed-cost stack for a formal import by a Responsable Inscripto (brief §1).
 * Taxes apply on CIF + duty + statistics fee. Percepciones are recoverable prepayments.
 */
export function landedCost({ fob, freight, die, stat = 0.03, iva = 0.21, ivaAd = 0.2, gan = 0.06, iibb = 0.025, local = 1200 }) {
  const cif = fob + freight;
  const duty = cif * die;
  const tasa = cif * stat;
  const base = cif + duty + tasa;
  const ivaAmt = base * iva;
  const ivaAdAmt = base * ivaAd;
  const ganAmt = base * gan;
  const iibbAmt = base * iibb;
  const cashOut = base + ivaAmt + ivaAdAmt + ganAmt + iibbAmt + local;
  const trueCost = base + local;
  return {
    fob, freight, cif, duty, tasa, base, iva: ivaAmt, ivaAd: ivaAdAmt, gan: ganAmt, iibb: iibbAmt, local,
    cashOut, trueCost, credits: cashOut - trueCost,
    cashMultiple: cashOut / fob, costMultiple: trueCost / fob,
  };
}
