/**
 * A store's name in running text: "Betty's Bridal" → "Betty's" (the design's
 * "In stock at Betty's", "From Cameron's"); a name that doesn't start with a
 * possessive stays whole ("Linen & Loom", never "Linen's").
 */
export function shortStoreName ( name: string ): string {
  const full = String( name || '' ).trim();
  const first = full.split( /\s+/ )[0] || '';
  return /[’']s$/.test( first ) ? first.replace( /’/g, "'" ) : full;
}
