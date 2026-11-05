/** Argentine number format: dot for thousands, comma for decimals. */
export function fmtNum(n, decimals = 0) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function fmtUSD(n, decimals = 0) {
  return `USD ${fmtNum(n, decimals)}`;
}
